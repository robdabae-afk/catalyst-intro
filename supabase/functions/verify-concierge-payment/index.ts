import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CONCIERGE] ${step}${detailsStr}`);
};

const sendPurchaseConfirmationEmail = async (userId: string, supabaseClient: any) => {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not configured, skipping email");
      return;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      logStep("Error fetching profile for email", { error: profileError });
      return;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Catalyst Intro <notifications@catalystintro.com>",
        to: [profile.email],
        subject: "Premium Match Purchase Successful!",
        html: `
          <h1>Hello ${profile.name},</h1>
          <p><strong>Purchase successful!</strong></p>
          <p>In 8-12 hours maximum you will receive your personally curated match.</p>
          <p>Our team is carefully reviewing profiles to find the perfect match for you. You'll be notified as soon as your match is ready.</p>
          <p>Thank you for trusting Catalyst Intro with your networking needs!</p>
          <p>Best regards,<br>The Catalyst Intro Team</p>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    if (!emailResponse.ok) {
      logStep("Error sending confirmation email", { error: emailResult });
    } else {
      logStep("Confirmation email sent successfully", { emailId: emailResult.id });
    }
  } catch (error) {
    logStep("Exception sending email", { error: String(error) });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { matchId } = await req.json();
    if (!matchId) throw new Error("Match ID is required");

    // Get the match request
    const { data: matchRequest, error: fetchError } = await supabaseClient
      .from('manual_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchError || !matchRequest) {
      throw new Error("Match request not found");
    }
    logStep("Match request found", { matchId, status: matchRequest.payment_status });

    // If already paid, return success
    if (matchRequest.payment_status === 'paid' || matchRequest.payment_status === 'fulfilled') {
      return new Response(JSON.stringify({ 
        success: true, 
        status: matchRequest.payment_status,
        paymentTimestamp: matchRequest.payment_timestamp
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify payment with Stripe
    if (!matchRequest.stripe_session_id) {
      return new Response(JSON.stringify({ success: false, status: 'pending' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(matchRequest.stripe_session_id);
    logStep("Stripe session retrieved", { status: session.payment_status });

    if (session.payment_status === 'paid') {
      // Update match request to paid
      const { error: updateError } = await supabaseClient
        .from('manual_matches')
        .update({
          payment_status: 'paid',
          payment_timestamp: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string
        })
        .eq('id', matchId);

      if (updateError) {
        logStep("Error updating match", { error: updateError });
        throw updateError;
      }

      logStep("Payment verified and match updated");

      // Send confirmation email
      await sendPurchaseConfirmationEmail(matchRequest.requester_id, supabaseClient);

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'paid',
        paymentTimestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, status: 'pending' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
