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

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUserId(null); setProfile(null); setLoading(false); return; }
    setUserId(session.user.id);
    const { data: prof } = await (supabase as any)
      .from("match_profiles").select("*").eq("id", session.user.id).maybeSingle();
    setProfile(prof ?? null);

    if (prof) {
      const { data: att } = await (supabase as any)
        .from("match_event_attendees")
        .select("event_id, match_events!inner(id, is_active, starts_at, ends_at)")
        .eq("profile_id", session.user.id);
      const active = (att ?? []).find((a: any) => {
        const e = a.match_events;
        return e?.is_active && new Date(e.starts_at) <= new Date() && new Date(e.ends_at) >= new Date();
      });
      setActiveEventId(active?.event_id ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  return { userId, profile, activeEventId, loading, reload: load };
}
