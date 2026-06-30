import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Centralized Stripe Price IDs
const STRIPE_PRICES = {
  PRO_FOUNDER: 'price_1SfuSgInI9cm3k8RNN0RE9YI',
  PRO_INVESTOR: 'price_1SCRGhInI9cm3k8Rg5Cy2JRK',
  PRO_DISCOVER: 'price_1ToAoJInI9cm3k8RbRNoZAYR', // $40/mo unlimited Discover
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      logStep('Stripe key not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Please add STRIPE_SECRET_KEY.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, plan } = await req.json();
    logStep('Request received', { action, plan, userId: user.id });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id, user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Profile loaded', { userType: profile.user_type, hasStripeCustomer: !!profile.stripe_customer_id });

    switch (action) {
      case 'create_checkout': {
        // Determine the correct price based on user type
        const priceId = profile.user_type === 'founder' 
          ? STRIPE_PRICES.PRO_FOUNDER 
          : STRIPE_PRICES.PRO_INVESTOR;
        
        const expectedPlan = profile.user_type === 'founder' ? 'startup_pro' : 'investor_pro';
        
        if (plan && plan !== expectedPlan) {
          logStep('Plan mismatch', { expected: expectedPlan, received: plan });
          return new Response(
            JSON.stringify({ error: `Invalid plan for ${profile.user_type}s` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get or create Stripe customer
        let customerId = profile.stripe_customer_id;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: profile.email,
            metadata: { supabase_user_id: user.id },
          });
          customerId = customer.id;
          
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
          
          logStep('Created Stripe customer', { customerId });
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${req.headers.get('origin')}/settings?subscription=success`,
          cancel_url: `${req.headers.get('origin')}/settings?subscription=canceled`,
          metadata: {
            supabase_user_id: user.id,
            plan: expectedPlan,
          },
        });

        logStep('Checkout session created', { sessionId: session.id, priceId });

        return new Response(
          JSON.stringify({ url: session.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_portal': {
        if (!profile.stripe_customer_id) {
          return new Response(
            JSON.stringify({ error: 'No subscription found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id,
          return_url: `${req.headers.get('origin')}/settings`,
        });

        logStep('Portal session created', { sessionId: portalSession.id });

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'use_spotlight': {
        const { data: subProfile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_expires_at, weekly_spotlight_used_at')
          .eq('id', user.id)
          .single();

        if (!subProfile || subProfile.subscription_status !== 'active') {
          return new Response(
            JSON.stringify({ error: 'Active subscription required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const spotlightUsedAt = subProfile.weekly_spotlight_used_at 
          ? new Date(subProfile.weekly_spotlight_used_at) 
          : null;

        if (spotlightUsedAt && spotlightUsedAt > oneWeekAgo) {
          return new Response(
            JSON.stringify({ error: 'Weekly spotlight already used' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('profiles')
          .update({ weekly_spotlight_used_at: now.toISOString() })
          .eq('id', user.id);

        logStep('Spotlight used', { userId: user.id });

        return new Response(
          JSON.stringify({ success: true, spotlight_expires_at: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }


      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Subscription error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
