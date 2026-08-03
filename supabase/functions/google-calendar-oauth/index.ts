// Phase D — Google Calendar OAuth start endpoint.
// Redirects the user to Google's OAuth consent screen.
//
// Requires the following Supabase secrets to be set BEFORE this can succeed:
//   GOOGLE_CLIENT_ID
//   GOOGLE_REDIRECT_URI  (must match one you registered in Google Cloud Console)
//
// Until secrets are provided, returns a 501 with instructions.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({
        error: "not_configured",
        message:
          "Google Calendar integration is not yet configured. " +
          "Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in Supabase secrets.",
      }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Pass user_id as `state` so the callback knows who to associate tokens with.
  // Frontend should include ?user_id=<supabase user id>&return_to=<url>.
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const returnTo = url.searchParams.get("return_to") ?? "";
  if (!userId) {
    return new Response(JSON.stringify({ error: "missing_user_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const state = btoa(JSON.stringify({ user_id: userId, return_to: returnTo }));

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
});
