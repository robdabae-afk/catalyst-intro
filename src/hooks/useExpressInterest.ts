import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useExpressInterest(currentUserId: string | undefined) {
  /**
   * Records a "like" swipe from the current user toward `targetId`.
   * Returns { matched: true } if the target has already liked the current user
   * (mutual interest = match).
   */
  const expressInterest = useCallback(
    async (targetId: string): Promise<{ ok: boolean; matched: boolean; error?: string }> => {
      if (!currentUserId) return { ok: false, matched: false, error: "Not signed in" };

      // Insert swipe (idempotent-ish: ignore duplicates)
      const { error: swipeErr } = await supabase
        .from("swipes")
        .insert({ swiper_id: currentUserId, swiped_id: targetId, action: "like" });

      if (swipeErr && !swipeErr.message?.includes("duplicate")) {
        return { ok: false, matched: false, error: swipeErr.message };
      }

      // Check for mutual interest
      const { data: reciprocal } = await supabase
        .from("swipes")
        .select("id")
        .eq("swiper_id", targetId)
        .eq("swiped_id", currentUserId)
        .eq("action", "like")
        .maybeSingle();

      const matched = !!reciprocal;

      if (matched) {
        // Create match row if it doesn't exist
        const [u1, u2] =
          currentUserId < targetId ? [currentUserId, targetId] : [targetId, currentUserId];
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("user_1_id", u1)
          .eq("user_2_id", u2)
          .maybeSingle();
        if (!existing) {
          await supabase
            .from("matches")
            .insert({ user_1_id: u1, user_2_id: u2, status: "active" });
        }
      }

      return { ok: true, matched };
    },
    [currentUserId]
  );

  const toggleWatchlist = useCallback(
    async (targetId: string, currentlySaved: boolean): Promise<boolean> => {
      if (!currentUserId) return currentlySaved;
      if (currentlySaved) {
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", currentUserId)
          .eq("target_id", targetId);
        return false;
      }
      await supabase
        .from("watchlist")
        .insert({ user_id: currentUserId, target_id: targetId });
      return true;
    },
    [currentUserId]
  );

  return { expressInterest, toggleWatchlist };
}
