import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Heartbeat: stamps profiles.last_seen_at so others can see online / recently-active status.
export function usePresence(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const beat = async () => {
      if (cancelled) return;
      try {
        await (supabase as any)
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", userId);
      } catch {
        // Column may not exist yet; presence is best-effort
      }
    };

    beat();
    const interval = setInterval(beat, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);
}

export type PresenceState = "online" | "recent" | null;

// Green = heartbeat within 5 min; white = active within 12h
export function presenceOf(lastSeenAt: string | null | undefined): PresenceState {
  if (!lastSeenAt) return null;
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < 5 * 60 * 1000) return "online";
  if (ms < 12 * 60 * 60 * 1000) return "recent";
  return null;
}
