import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCheck = (cents: number) => {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { event_id, founder_id, message, check_size_cents } = await req.json();
    if (!event_id || !founder_id) {
      return new Response(JSON.stringify({ error: "event_id and founder_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const checkCents = Number(check_size_cents);
    if (!Number.isFinite(checkCents) || checkCents < 100) {
      return new Response(JSON.stringify({ error: "A valid check size (at least $1) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: ev } = await admin.from("match_events").select("*").eq("id", event_id).maybeSingle();
    if (!ev || !ev.is_active) return new Response(JSON.stringify({ error: "Event not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: atts } = await admin.from("match_event_attendees").select("profile_id").eq("event_id", event_id).in("profile_id", [user.id, founder_id]);
    if ((atts?.length ?? 0) < 2) {
      return new Response(JSON.stringify({ error: "Both parties must be in the event" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const checkLabel = formatCheck(checkCents);

    const { data: interest, error: iErr } = await admin.from("match_interests")
      .upsert({ event_id, investor_id: user.id, founder_id, message, check_size_cents: checkCents }, { onConflict: "event_id,investor_id,founder_id" })
      .select().single();
    if (iErr) throw iErr;

    const { data: existingThread } = await admin.from("match_threads")
      .select("*").eq("event_id", event_id).eq("investor_id", user.id).eq("founder_id", founder_id).maybeSingle();
    let thread = existingThread;
    let threadIsNew = false;
    if (!thread) {
      const { data: newThread, error: tErr } = await admin.from("match_threads")
        .insert({ event_id, investor_id: user.id, founder_id }).select().single();
      if (tErr) throw tErr;
      thread = newThread;
      threadIsNew = true;
    }

    // Post the offered check size as the first system-style message in chat (only on new thread)
    if (threadIsNew) {
      const opener = `👋 I'd like to connect — proposed check size: ${checkLabel}.${message ? `\n\n${message}` : ""}`;
      await admin.from("match_messages").insert({
        thread_id: thread.id,
        sender_id: user.id,
        content: opener,
      });
    }

    const { data: investorProfile } = await admin.from("match_profiles").select("name").eq("id", user.id).maybeSingle();
    await admin.from("match_notifications").insert({
      user_id: founder_id,
      type: "interest",
      payload: { thread_id: thread.id, event_id, investor_id: user.id, investor_name: investorProfile?.name, event_name: ev.name, check_size: checkLabel },
    });

    try {
      const { data: founderAuth } = await admin.auth.admin.getUserById(founder_id);
      if (founderAuth?.user?.email) {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "match-interest",
            recipientEmail: founderAuth.user.email,
            idempotencyKey: `match-interest-${interest.id}`,
            templateData: {
              investorName: investorProfile?.name ?? "An investor",
              eventName: ev.name,
              checkSize: checkLabel,
              threadUrl: `${new URL(req.url).origin.replace("supabase.co", "lovable.app")}/match/thread/${thread.id}`,
            },
          },
        });
      }
    } catch (e) {
      console.log("email send skipped:", (e as Error).message);
    }

    return new Response(JSON.stringify({ thread_id: thread.id, interest_id: interest.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
