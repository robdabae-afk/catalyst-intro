// Phase D — Creates a Google Calendar event with an auto-generated Google Meet link
// on the proposer's calendar, and invites the other party.
//
// Body: { chat_id: string }
// Reads the coffee_chat row, resolves both parties, uses the proposer's stored
// OAuth tokens (refreshing if needed), calls Google Calendar API, and stores the
// generated Meet link back on the coffee_chat.meeting_location field.
//
// Returns { ok: true, meet_link } on success, { ok: false, reason } otherwise.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return json({ ok: false, reason: "not_configured", message: "Google secrets not set" }, 501);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { chat_id } = await req.json();
    if (!chat_id) return json({ ok: false, reason: "missing_chat_id" }, 400);

    const { data: chat, error: chatErr } = await admin
      .from("coffee_chats")
      .select("*")
      .eq("id", chat_id)
      .single();
    if (chatErr || !chat) return json({ ok: false, reason: "chat_not_found" }, 404);

    const proposerId = chat.sender_id;
    const inviteeId = proposerId === chat.founder_id ? chat.investor_id : chat.founder_id;

    // Fetch invitee email
    const { data: invitee } = await admin.from("profiles").select("email, name").eq("id", inviteeId).single();
    if (!invitee?.email) return json({ ok: false, reason: "invitee_no_email" }, 400);

    // Fetch proposer's OAuth tokens
    let { data: tokens } = await admin
      .from("google_oauth_tokens")
      .select("*")
      .eq("user_id", proposerId)
      .single();

    if (!tokens) return json({ ok: false, reason: "not_connected", message: "Proposer has not connected Google Calendar" }, 400);

    // Refresh if expired
    if (new Date(tokens.expires_at).getTime() < Date.now() + 60_000) {
      const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      if (!refreshResp.ok) return json({ ok: false, reason: "refresh_failed" }, 500);
      const newTokens = await refreshResp.json();
      const newExpires = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
      await admin
        .from("google_oauth_tokens")
        .update({ access_token: newTokens.access_token, expires_at: newExpires })
        .eq("user_id", proposerId);
      tokens = { ...tokens, access_token: newTokens.access_token, expires_at: newExpires };
    }

    // Build calendar event
    const start = chat.proposed_date ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const startDt = new Date(start);
    const endDt = new Date(startDt.getTime() + 30 * 60 * 1000);

    const event = {
      summary: `Catalyst intro — ${invitee.name ?? "Meeting"}`,
      description: chat.notes ?? "Meeting arranged via Catalyst.",
      start: { dateTime: startDt.toISOString(), timeZone: "UTC" },
      end: { dateTime: endDt.toISOString(), timeZone: "UTC" },
      attendees: [{ email: invitee.email }],
      conferenceData: {
        createRequest: {
          requestId: `catalyst-${chat.id}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const gcalResp = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!gcalResp.ok) {
      const t = await gcalResp.text();
      return json({ ok: false, reason: "gcal_error", message: t }, 500);
    }

    const created = await gcalResp.json();
    const meetLink = created.hangoutLink ?? null;

    // Save the Meet link back onto the chat
    if (meetLink) {
      await admin.from("coffee_chats").update({ meeting_location: meetLink }).eq("id", chat.id);
    }

    return json({ ok: true, meet_link: meetLink, event_id: created.id });
  } catch (e: any) {
    return json({ ok: false, reason: "exception", message: e.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
