import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId?: string;
  type: "approved" | "denied" | "edit_suggestion" | "custom";
  editSuggestion?: string;
  editMessage?: string;
  // For custom emails
  recipientIds?: string[];
  subject?: string;
  message?: string;
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

    const { userId, type, editSuggestion, editMessage, recipientIds, subject, message }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification`);

    // Handle custom bulk emails
    if (type === "custom") {
      if (!recipientIds || recipientIds.length === 0) {
        throw new Error("No recipients specified for custom email");
      }
      if (!subject || !message) {
        throw new Error("Subject and message are required for custom emails");
      }

      // Get all recipient emails
      const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("email, name")
        .in("id", recipientIds);

      if (profilesError || !profiles) {
        console.error("Error fetching profiles:", profilesError);
        throw new Error("Failed to fetch recipient profiles");
      }

      // Send emails to all recipients
      const results = await Promise.allSettled(
        profiles.map(async (profile) => {
          const htmlContent = `
            <h1>Hello ${profile.name},</h1>
            ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
            <p>Best regards,<br>The Catalyst Intro Team</p>
          `;

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
            throw new Error(emailResult.message || "Failed to send email");
          }
          return emailResult;
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Custom emails sent: ${successful} successful, ${failed} failed`);

      return new Response(JSON.stringify({ success: true, sent: successful, failed }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle individual notification emails (approved, denied, edit_suggestion)
    if (!userId) {
      throw new Error("userId is required for notification emails");
    }

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

    let emailSubject = "";
    let htmlContent = "";

    switch (type) {
      case "approved":
        emailSubject = "Your Profile Has Been Approved! - Terms & Conditions";
        htmlContent = `
          <h1>Welcome to Catalyst Intro, ${profile.name}!</h1>
          <p>Great news! Your profile has been approved and you now have full access to the platform.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2 style="margin-top: 0;">Terms & Conditions</h2>
            <p><strong>Legal Disclaimer:</strong> Catalyst Intro, to the fullest extent of the law, is not responsible for the outcome of any relationships or interpersonal communications made on the platform. Catalyst Intro executes background checks on users to develop a standard of trust, but this does not eliminate the need for any due diligence on a user's part.</p>
            <p>Catalyst Intro is a public-facing discovery platform. Represent your company and yourself in the best way possible at all times. Users must be over the age of 18 to use the application.</p>
          </div>
          
          <p><strong>Important:</strong> By continuing to use Catalyst Intro after this approval, you acknowledge and agree to our Terms & Conditions outlined above.</p>
          
          <p>You can now start exploring, connecting, and making the most of our community.</p>
          <p>Best regards,<br>The Catalyst Intro Team</p>
        `;
        break;

      case "denied":
        emailSubject = "Profile Application Update";
        htmlContent = `
          <h1>Hello ${profile.name},</h1>
          <p>We regret to inform you that your profile application has not been approved at this time.</p>
          <p>If you believe this was a mistake or would like to discuss this further, please reach out to our support team.</p>
          <p>Best regards,<br>The Catalyst Intro Team</p>
        `;
        break;

      case "edit_suggestion":
        emailSubject = "Action Required: Profile Edit Suggestions";
        htmlContent = `
          <h1>Hello ${profile.name},</h1>
          <p>An admin has reviewed your profile and has some suggestions for improvement before approval.</p>
          ${editMessage ? `<p><strong>Admin Message:</strong> ${editMessage}</p>` : ""}
          ${editSuggestion ? `<p><strong>Suggested Edits:</strong> ${editSuggestion}</p>` : ""}
          <p>Please log in to review these suggestions and update your profile accordingly.</p>
          <p>Best regards,<br>The Catalyst Intro Team</p>
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
        subject: emailSubject,
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
