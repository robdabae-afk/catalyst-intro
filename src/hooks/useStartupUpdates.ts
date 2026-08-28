import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StartupUpdate } from "@/components/app/StartupUpdateCard";

export function useStartupUpdates(userId: string | null, limit = 60) {
  const [items, setItems] = useState<StartupUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);

      const [{ data: updates }, { data: watch }] = await Promise.all([
        supabase
          .from("startup_updates")
          .select(
            "id, founder_id, title, body, link, category, mrr_snapshot, headcount_snapshot, growth_snapshot, runway_snapshot, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(limit),
        userId
          ? supabase.from("watchlist").select("target_id").eq("user_id", userId)
          : Promise.resolve({ data: [] as { target_id: string }[] }),
      ]);

      const rows = (updates ?? []) as any[];
      const founderIds = [...new Set(rows.map((r) => r.founder_id))];

      const [{ data: profiles }, { data: founderProfiles }] = await Promise.all([
        founderIds.length
          ? supabase.from("profiles").select("id, name, avatar_url").in("id", founderIds)
          : Promise.resolve({ data: [] as any[] }),
        founderIds.length
          ? supabase
              .from("founder_profiles")
              .select(
                "profile_id, startup_name, company_name, stage, growth_mom, logo_url, update_image_source",
              )
              .in("profile_id", founderIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const fpMap = new Map((founderProfiles ?? []).map((p: any) => [p.profile_id, p]));
      const watchSet = new Set(((watch as any[]) ?? []).map((w) => w.target_id));

      const mapped: StartupUpdate[] = rows.map((r) => {
        const p: any = profileMap.get(r.founder_id);
        const fp: any = fpMap.get(r.founder_id);
        const preferLogo = fp?.update_image_source === "logo" && fp?.logo_url;
        return {
          ...r,
          founderName: p?.name ?? "Founder",
          imageUrl: preferLogo ? fp.logo_url : p?.avatar_url ?? fp?.logo_url ?? null,
          startupName: fp?.startup_name ?? fp?.company_name ?? null,
          stage: fp?.stage ?? null,
          growthMom: fp?.growth_mom ?? null,
          watchlisted: watchSet.has(r.founder_id),
        };
      });

      if (!active) return;
      setItems(mapped);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, limit]);

  return { items, setItems, loading };
}
