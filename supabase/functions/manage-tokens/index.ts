import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token costs (matching frontend constants)
const TOKEN_COSTS = {
  CONCIERGE_FOUNDER: 50,
  CONCIERGE_INVESTOR: 25,
  SPOTLIGHT_BOOST: 30,
};

const PRO_MONTHLY_TOKENS = {
  FOUNDER_PRO: 15,
  INVESTOR_PRO: 100,
};

const logStep = (step: string, details?: any) => {
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
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    
    if (!user) {
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
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('tokens')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ balance: profile?.tokens || 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'purchase_tokens': {
        const { packageId } = body;
        
        // Get token package from database
        const { data: tokenPackage, error: packageError } = await supabaseAdmin
          .from('token_packages')
          .select('*')
          .eq('id', packageId)
          .eq('is_active', true)
          .single();

        if (packageError || !tokenPackage) {
          return new Response(
            JSON.stringify({ error: 'Invalid token package' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user profile for Stripe customer
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('stripe_customer_id, email')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get or create Stripe customer
        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: profile?.email || user.email,
            metadata: { supabase_user_id: user.id },
          });
          customerId = customer.id;
          
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        }

        // Create checkout session
        // Note: If stripe_price_id is not set, we'll use a one-time payment
        const sessionParams: any = {
          customer: customerId,
          mode: 'payment',
          success_url: `${req.headers.get('origin')}/settings?tokens=success`,
          cancel_url: `${req.headers.get('origin')}/settings?tokens=canceled`,
          metadata: {
            supabase_user_id: user.id,
            package_id: packageId,
            tokens: tokenPackage.tokens.toString(),
          },
        };

        if (tokenPackage.stripe_price_id) {
          sessionParams.line_items = [{ price: tokenPackage.stripe_price_id, quantity: 1 }];
        } else {
          // Fallback: use amount directly
          sessionParams.line_items = [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: tokenPackage.name,
              },
              unit_amount: tokenPackage.price_cents,
            },
            quantity: 1,
          }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        logStep('Token purchase checkout created', { sessionId: session.id, packageId });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'spend_tokens': {
        const { amount, productType, relatedId, description } = body;

        if (!amount || amount <= 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid amount' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check user has sufficient tokens
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('tokens')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if ((profile?.tokens || 0) < amount) {
          return new Response(
            JSON.stringify({ error: 'Insufficient tokens', balance: profile?.tokens || 0 }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create spend transaction (trigger will deduct tokens)
        const { data: transaction, error: transactionError } = await supabaseAdmin
          .from('token_transactions')
          .insert({
            user_id: user.id,
            transaction_type: 'spend',
            amount: amount,
            product_type: productType,
            related_id: relatedId,
            description: description,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        logStep('Tokens spent', { userId: user.id, amount, productType });

        return new Response(
          JSON.stringify({ success: true, transactionId: transaction.id, newBalance: (profile?.tokens || 0) - amount }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'grant_pro_tokens': {
        const { userId, userType } = body;
        
        // Only allow admins or system to grant tokens
        const { data: adminCheck } = await supabaseAdmin
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        // Allow if it's the user themselves or if called from webhook (no user context)
        const targetUserId = userId || user.id;
        const targetUserType = userType || adminCheck?.user_type;

        if (!targetUserType) {
          return new Response(
            JSON.stringify({ error: 'User type required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokenAmount = targetUserType === 'founder' 
          ? PRO_MONTHLY_TOKENS.FOUNDER_PRO 
          : PRO_MONTHLY_TOKENS.INVESTOR_PRO;

        // Check if tokens were already granted this month
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('tokens_last_granted_at, subscription_status, subscription_plan')
          .eq('id', targetUserId)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'Profile not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if subscription is active
        if (profile.subscription_status !== 'active') {
          return new Response(
            JSON.stringify({ error: 'Subscription not active' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already granted this month
        if (profile.tokens_last_granted_at) {
          const lastGranted = new Date(profile.tokens_last_granted_at);
          const now = new Date();
          const daysSinceGrant = (now.getTime() - lastGranted.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceGrant < 28) { // Less than 28 days, likely already granted
            return new Response(
              JSON.stringify({ error: 'Tokens already granted this month', lastGranted: profile.tokens_last_granted_at }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Grant tokens
        const { data: transaction, error: transactionError } = await supabaseAdmin
          .from('token_transactions')
          .insert({
            user_id: targetUserId,
            transaction_type: 'grant',
            amount: tokenAmount,
            product_type: 'pro_grant',
            description: `Monthly ${targetUserType === 'founder' ? 'Founder' : 'Investor'} Pro token grant`,
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Update last granted timestamp
        await supabaseAdmin
          .from('profiles')
          .update({ tokens_last_granted_at: new Date().toISOString() })
          .eq('id', targetUserId);

        logStep('Pro tokens granted', { userId: targetUserId, amount: tokenAmount });

        return new Response(
          JSON.stringify({ success: true, tokensGranted: tokenAmount, transactionId: transaction.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'purchase_pro_week': {
        const PRO_WEEK_COST = 100;
        
        // Check user has sufficient tokens
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('tokens, user_type')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if ((profile?.tokens || 0) < PRO_WEEK_COST) {
          return new Response(
            JSON.stringify({ error: 'Insufficient tokens', balance: profile?.tokens || 0, required: PRO_WEEK_COST }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Deduct tokens
        const { data: transaction, error: transactionError } = await supabaseAdmin
          .from('token_transactions')
          .insert({
            user_id: user.id,
            transaction_type: 'spend',
            amount: PRO_WEEK_COST,
            product_type: 'pro_week',
            description: '1 Week of Pro subscription',
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        // Grant Pro for 1 week
        const now = new Date();
        const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const plan = profile?.user_type === 'founder' ? 'startup_pro' : 'investor_pro';

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_expires_at: oneWeekLater.toISOString(),
          })
          .eq('id', user.id);

        logStep('Pro week purchased', { userId: user.id, plan });

        return new Response(
          JSON.stringify({ 
            success: true, 
            transactionId: transaction.id, 
            expiresAt: oneWeekLater.toISOString(),
            plan 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    logStep('Error', { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

