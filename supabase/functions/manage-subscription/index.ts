import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      console.log('Stripe key not configured yet');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Please add STRIPE_SECRET_KEY.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dynamic import Stripe only when key is available
    const Stripe = (await import("https://esm.sh/stripe@14.21.0")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
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

    const { action, plan, priceId } = await req.json();

    // Get user profile
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

    switch (action) {
      case 'create_checkout': {
        // Validate plan matches user type
        if (profile.user_type === 'founder' && plan !== 'startup_pro') {
          return new Response(
            JSON.stringify({ error: 'Invalid plan for founders' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (profile.user_type === 'investor' && plan !== 'investor_pro') {
          return new Response(
            JSON.stringify({ error: 'Invalid plan for investors' }),
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
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${req.headers.get('origin')}/settings?subscription=success`,
          cancel_url: `${req.headers.get('origin')}/settings?subscription=canceled`,
          metadata: {
            supabase_user_id: user.id,
            plan: plan,
          },
        });

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

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'use_spotlight': {
        // Check if user has active subscription
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

        // Check weekly limit
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

        // Mark spotlight as used and create ad profile
        await supabase
          .from('profiles')
          .update({ weekly_spotlight_used_at: now.toISOString() })
          .eq('id', user.id);

        return new Response(
          JSON.stringify({ success: true, spotlight_expires_at: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_spotlight_checkout': {
        // One-time spotlight purchase for non-Pro users
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
        }

        // Spotlight price ID - $9.99 one-time
        const SPOTLIGHT_PRICE_ID = 'price_spotlight_one_time'; // This should be a real Stripe price ID
        
        // Create checkout session for one-time spotlight
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'payment', // One-time payment
          payment_method_types: ['card'],
          line_items: [{ 
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Spotlight Boost',
                description: 'Boost your profile for 8 hours',
              },
              unit_amount: 999, // $9.99
            },
            quantity: 1 
          }],
          success_url: `${req.headers.get('origin')}/dashboard?spotlight=success`,
          cancel_url: `${req.headers.get('origin')}/dashboard?spotlight=canceled`,
          metadata: {
            supabase_user_id: user.id,
            type: 'spotlight',
          },
        });

        console.log('[MANAGE-SUBSCRIPTION] Spotlight checkout created:', session.id);

        return new Response(
          JSON.stringify({ url: session.url }),
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
