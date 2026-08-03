import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType =
  | "profile_view"
  | "deck_open"
  | "video_play"
  | "share_profile";

// Fire-and-forget event logging. Never throws, never blocks UI.
// Requires the analytics_events table (20260803120000 migration).
export function logEvent(
  eventType: AnalyticsEventType,
  targetId?: string | null,
  metadata?: Record<string, unknown>
) {
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await (supabase as any).from("analytics_events").insert({
        user_id: user.id,
        event_type: eventType,
        target_id: targetId ?? null,
        metadata: metadata ?? {},
      });
    } catch {
      // best-effort only
    }
  })();
}
