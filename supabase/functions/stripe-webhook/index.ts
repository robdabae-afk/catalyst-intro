import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.log('Stripe keys not configured yet');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const Stripe = (await import("https://esm.sh/stripe@14.21.0")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received Stripe event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        const packageId = session.metadata?.package_id;
        const tokens = session.metadata?.tokens;

        // Handle token purchases (one-time payments)
        if (userId && packageId && tokens && session.mode === 'payment') {
          const tokenAmount = parseInt(tokens, 10);
          await supabase
            .from('token_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'purchase',
              amount: tokenAmount,
              product_type: 'token_package',
              stripe_payment_intent_id: session.payment_intent as string,
              description: `Token purchase - ${tokenAmount} tokens`,
            });

          console.log(`Granted ${tokenAmount} tokens to user ${userId} from token purchase`);
          break;
        }

        // Handle Pro subscription purchases
        if (userId && plan && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Get user type for token grant
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', userId)
            .single();

          await supabase
            .from('profiles')
            .update({
              subscription_plan: plan,
              subscription_status: 'active',
              subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_subscription_id: subscription.id,
            })
            .eq('id', userId);

          // Grant monthly tokens for Pro subscription
          if (profile?.user_type) {
            const tokenAmount = profile.user_type === 'founder' ? 15 : 100; // PRO_MONTHLY_TOKENS
            await supabase
              .from('token_transactions')
              .insert({
                user_id: userId,
                transaction_type: 'grant',
                amount: tokenAmount,
                product_type: 'pro_grant',
                description: `Monthly ${profile.user_type === 'founder' ? 'Founder' : 'Investor'} Pro token grant`,
              });
            
            await supabase
              .from('profiles')
              .update({ tokens_last_granted_at: new Date().toISOString() })
              .eq('id', userId);

            console.log(`Granted ${tokenAmount} tokens to user ${userId} for ${plan} subscription`);
          }

          console.log(`Activated ${plan} subscription for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, user_type, subscription_plan, tokens_last_granted_at')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', profile.id);

          // Grant monthly tokens if subscription is active and it's a renewal
          if (subscription.status === 'active' && profile.subscription_plan && profile.user_type) {
            // Check if tokens were already granted this billing period
            const shouldGrant = !profile.tokens_last_granted_at || 
              (new Date().getTime() - new Date(profile.tokens_last_granted_at).getTime()) > (28 * 24 * 60 * 60 * 1000);
            
            if (shouldGrant) {
              const tokenAmount = profile.user_type === 'founder' ? 15 : 100; // PRO_MONTHLY_TOKENS
              await supabase
                .from('token_transactions')
                .insert({
                  user_id: profile.id,
                  transaction_type: 'grant',
                  amount: tokenAmount,
                  product_type: 'pro_grant',
                  description: `Monthly ${profile.user_type === 'founder' ? 'Founder' : 'Investor'} Pro token grant`,
                });
              
              await supabase
                .from('profiles')
                .update({ tokens_last_granted_at: new Date().toISOString() })
                .eq('id', profile.id);

              console.log(`Granted ${tokenAmount} tokens to user ${profile.id} for subscription renewal`);
            }
          }

          console.log(`Updated subscription status to ${subscription.status} for user ${profile.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_plan: null,
              subscription_status: null,
              subscription_expires_at: null,
              stripe_subscription_id: null,
            })
            .eq('id', profile.id);

          console.log(`Canceled subscription for user ${profile.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);

          console.log(`Payment failed for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
