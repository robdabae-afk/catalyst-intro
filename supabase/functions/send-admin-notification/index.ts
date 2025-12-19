import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: "approved" | "denied" | "edit_suggestion";
  editSuggestion?: string;
  editMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, type, editSuggestion, editMessage }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to user ${userId}`);

    // Get user's email from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      throw new Error("User profile not found");
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "approved":
        subject = "Your Profile Has Been Approved!";
        htmlContent = `
          <h1>Welcome, ${profile.name}!</h1>
          <p>Great news! Your profile has been approved and you now have full access to the platform.</p>
          <p>You can now start exploring, connecting, and making the most of our community.</p>
          <p>Best regards,<br>The Team</p>
        `;
        break;

      case "denied":
        subject = "Profile Application Update";
        htmlContent = `
          <h1>Hello ${profile.name},</h1>
          <p>We regret to inform you that your profile application has not been approved at this time.</p>
          <p>If you believe this was a mistake or would like to discuss this further, please reach out to our support team.</p>
          <p>Best regards,<br>The Team</p>
        `;
        break;

      case "edit_suggestion":
        subject = "Action Required: Profile Edit Suggestions";
        htmlContent = `
          <h1>Hello ${profile.name},</h1>
          <p>An admin has reviewed your profile and has some suggestions for improvement before approval.</p>
          ${editMessage ? `<p><strong>Admin Message:</strong> ${editMessage}</p>` : ""}
          ${editSuggestion ? `<p><strong>Suggested Edits:</strong> ${editSuggestion}</p>` : ""}
          <p>Please log in to review these suggestions and update your profile accordingly.</p>
          <p>Best regards,<br>The Team</p>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Catalyst Intro <notifications@catalystintro.com>",
        to: [profile.email],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
