import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Token costs for concierge match - unified pricing
const TOKEN_COST = 60; // 60 tokens for Premium Match (all users)

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONCIERGE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use anon key for auth, service role for data operations
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Parse request body for discount code
    let discountCode: string | undefined;
    try {
      const body = await req.json();
      discountCode = body?.discountCode?.toUpperCase();
    } catch {
      // No body or invalid JSON, continue without discount
    }
    logStep("Request parsed", { discountCode: discountCode || 'none' });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAuth.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user type and token balance (use admin client to bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type, tokens')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logStep("Profile query error", { error: profileError });
      throw new Error("User profile not found");
    }
    if (!profile) throw new Error("User profile not found");
    
    const userType = profile.user_type;
    const tokenCost = TOKEN_COST; // Unified 60 tokens for all users
    const currentBalance = profile.tokens || 0;
    
    logStep("Determined token cost", { userType, tokenCost, currentBalance });

    // Check if user has sufficient tokens
    if (currentBalance < tokenCost) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokens', 
          required: tokenCost, 
          balance: currentBalance 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create the manual match request in pending state (will be marked paid after token deduction)
    const { data: matchRequest, error: insertError } = await supabaseAdmin
      .from('manual_matches')
      .insert({
        requester_id: user.id,
        payment_status: 'pending',
        user_type: userType,
        amount_paid: 0 // No cash payment, using tokens
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error creating match request", { error: insertError });
      throw insertError;
    }
    logStep("Match request created", { matchId: matchRequest.id });

    // Deduct tokens
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'spend',
        amount: tokenCost,
        product_type: 'concierge_match',
        related_id: matchRequest.id,
        description: `Concierge Match (${userType})`,
      })
      .select()
      .single();

    if (transactionError) {
      logStep("Error deducting tokens", { error: transactionError });
      // Clean up match request
      await supabaseAdmin
        .from('manual_matches')
        .delete()
        .eq('id', matchRequest.id);
      throw transactionError;
    }

    // Update match request to paid status
    await supabaseAdmin
      .from('manual_matches')
      .update({ 
        payment_status: 'paid',
        payment_timestamp: new Date().toISOString()
      })
      .eq('id', matchRequest.id);

    logStep("Tokens deducted and match request paid", { 
      matchId: matchRequest.id, 
      tokensSpent: tokenCost,
      newBalance: currentBalance - tokenCost 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchId: matchRequest.id,
        tokensSpent: tokenCost,
        newBalance: currentBalance - tokenCost
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
