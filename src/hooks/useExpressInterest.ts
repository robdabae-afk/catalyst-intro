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

      const { data, error } = await (supabase as any).rpc("billing_like", { p_target: targetId });
      if (error) return { ok: false, matched: false, error: error.message };
      return { ok: true, matched: !!data?.matched };
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
