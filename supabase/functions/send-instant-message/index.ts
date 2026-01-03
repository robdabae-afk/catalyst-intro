import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token costs for instant messages
const TOKEN_COSTS = {
  FOUNDER: 35,
  INVESTOR: 30,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-INSTANT-MESSAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { receiverId, content } = body;

    if (!receiverId || !content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Receiver ID and message content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user type and token balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type, tokens')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenCost = profile.user_type === 'founder' ? TOKEN_COSTS.FOUNDER : TOKEN_COSTS.INVESTOR;
    const currentBalance = profile.tokens || 0;

    logStep('Determined token cost', { userType: profile.user_type, tokenCost, currentBalance });

    // Check if user has sufficient tokens
    if (currentBalance < tokenCost) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokens', 
          required: tokenCost, 
          balance: currentBalance 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct tokens
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'spend',
        amount: tokenCost,
        product_type: 'instant_message',
        description: `Instant message to user`,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Create instant message
    const { data: instantMessage, error: messageError } = await supabaseAdmin
      .from('instant_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        tokens_spent: tokenCost,
      })
      .select()
      .single();

    if (messageError) {
      // Refund tokens if message creation fails
      await supabaseAdmin
        .from('token_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'refund',
          amount: tokenCost,
          product_type: 'instant_message',
          description: 'Refund for failed instant message',
        });
      throw messageError;
    }

    logStep('Instant message sent', { 
      messageId: instantMessage.id, 
      tokensSpent: tokenCost,
      newBalance: currentBalance - tokenCost 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: instantMessage.id,
        tokensSpent: tokenCost,
        newBalance: currentBalance - tokenCost
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logStep('Error', { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

