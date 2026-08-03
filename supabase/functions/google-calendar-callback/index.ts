// Phase D — Google OAuth callback. Exchanges auth code for tokens and stores them.
//
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

  if (!clientId || !clientSecret || !redirectUri) {
    return errorHtml(
      "Google Calendar integration is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in Supabase secrets."
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateB64 = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return errorHtml(`Google returned error: ${error}`);
  if (!code || !stateB64) return errorHtml("Missing code or state parameter");

  let state: { user_id: string; return_to: string };
  try {
    state = JSON.parse(atob(stateB64));
  } catch {
    return errorHtml("Invalid state parameter");
  }

  // Exchange code → tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    const t = await tokenResp.text();
    return errorHtml(`Token exchange failed: ${t}`);
  }

  const tokens = await tokenResp.json();

  // Fetch google email for the connected account
  let googleEmail: string | null = null;
  try {
    const uiResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (uiResp.ok) {
      const ui = await uiResp.json();
      googleEmail = ui.email;
    }
  } catch { /* non-fatal */ }

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error: upsertErr } = await admin.from("google_oauth_tokens").upsert({
    user_id: state.user_id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope: tokens.scope,
    google_email: googleEmail,
    updated_at: new Date().toISOString(),
  });

  if (upsertErr) return errorHtml(`Failed to store tokens: ${upsertErr.message}`);

  // Redirect user back to the app
  const returnTo = state.return_to || "/matches";
  return new Response(
    `<html><body style="font-family:sans-serif;background:#0b0a07;color:#f6f5f2;padding:2rem;">
      <h2>✅ Google Calendar connected</h2>
      <p>You can close this window — you'll be redirected shortly.</p>
      <script>setTimeout(() => { window.location.href = ${JSON.stringify(returnTo)}; }, 1500);</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
});

function errorHtml(msg: string) {
  return new Response(
    `<html><body style="font-family:sans-serif;background:#0b0a07;color:#f6f5f2;padding:2rem;">
      <h2>❌ Connection failed</h2>
      <p>${msg.replace(/</g, "&lt;")}</p>
      <p><a href="javascript:window.close()" style="color:#c6a02c;">Close</a></p>
    </body></html>`,
    { status: 500, headers: { "Content-Type": "text/html" } }
  );
}
