import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded token packages with actual Stripe price IDs
const TOKEN_PACKAGES = [
  {
    id: 'small',
    name: 'Starter Pack',
    tokens: 10,
    priceCents: 999,
    displayPrice: '$9.99',
    stripePriceId: 'price_1SlKoeInI9cm3k8RoqI9ISRL',
  },
  {
    id: 'medium',
    name: 'Pro Pack',
    tokens: 25,
    priceCents: 1999,
    displayPrice: '$19.99',
    stripePriceId: 'price_1SlKopInI9cm3k8R2YC0fRVw',
  },
  {
    id: 'large',
    name: 'Premium Pack',
    tokens: 50,
    priceCents: 3499,
    displayPrice: '$34.99',
    stripePriceId: 'price_1SlKozInI9cm3k8R1RWW0dSr',
  },
];

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-TOKENS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      logStep('ERROR: Stripe not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    
    if (!user) {
      logStep('ERROR: Unauthorized');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'get_balance': {
        // Return 0 balance since tokens column doesn't exist yet
        return new Response(
          JSON.stringify({ balance: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'purchase_tokens': {
        const { packageId } = body;
        logStep('Purchase tokens request', { packageId });
        
        // Get token package from hardcoded list
        const tokenPackage = TOKEN_PACKAGES.find(p => p.id === packageId);

        if (!tokenPackage) {
          logStep('ERROR: Invalid token package', { packageId, availablePackages: TOKEN_PACKAGES.map(p => p.id) });
          return new Response(
            JSON.stringify({ error: `Invalid token package: ${packageId}. Available packages: ${TOKEN_PACKAGES.map(p => p.id).join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        logStep('Token package found', { packageId, stripePriceId: tokenPackage.stripePriceId });

        // Get user profile for Stripe customer
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('stripe_customer_id, email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logStep('ERROR: Profile fetch failed', { error: profileError.message });
          throw profileError;
        }

        // Get or create Stripe customer
        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
          logStep('Creating new Stripe customer', { email: profile?.email || user.email });
          const customer = await stripe.customers.create({
            email: profile?.email || user.email,
            metadata: { supabase_user_id: user.id },
          });
          customerId = customer.id;
          
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
          logStep('Stripe customer created', { customerId });
        }

        const origin = req.headers.get('origin') || 'https://propel.earth';
        logStep('Creating checkout session', { 
          customerId, 
          priceId: tokenPackage.stripePriceId,
          origin 
        });

        // Create checkout session with the Stripe price ID
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ 
            price: tokenPackage.stripePriceId, 
            quantity: 1 
          }],
          mode: 'payment',
          success_url: `${origin}/settings?tokens=success`,
          cancel_url: `${origin}/settings?tokens=canceled`,
          metadata: {
            supabase_user_id: user.id,
            package_id: packageId,
            tokens: tokenPackage.tokens.toString(),
          },
        });

        logStep('Token purchase checkout created', { sessionId: session.id, packageId, url: session.url });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        logStep('ERROR: Invalid action', { action });
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
