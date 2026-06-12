import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MatchProfile {
  id: string;
  role: "founder" | "investor";
  name: string;
  email: string | null;
  avatar_url: string | null;
}

export function useMatchSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFor = async (uid: string | null) => {
    if (!uid) { setUserId(null); setProfile(null); setActiveEventId(null); setLoading(false); return; }
    setUserId(uid);
    const { data: prof } = await (supabase as any)
      .from("match_profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(prof ?? null);

    if (prof) {
      const { data: att } = await (supabase as any)
        .from("match_event_attendees")
        .select("event_id, match_events!inner(id, is_active)")
        .eq("profile_id", uid);
      const active = (att ?? []).find((a: any) => a.match_events?.is_active);
      setActiveEventId(active?.event_id ?? null);
    } else {
      setActiveEventId(null);
    }
    setLoading(false);
  };

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await loadFor(session?.user.id ?? null);
  };

  useEffect(() => {
    // Set up listener FIRST, defer supabase calls to avoid deadlock
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setTimeout(() => { loadFor(uid); }, 0);
    });
    // Then check existing session
    load();
    return () => sub.subscription.unsubscribe();
  }, []);

  return { userId, profile, activeEventId, loading, reload: load };
}
