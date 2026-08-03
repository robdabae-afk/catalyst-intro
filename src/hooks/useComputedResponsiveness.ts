import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ComputedResponsiveness {
  responseRatePct: number | null;
  medianReplyHours: number | null;
  totalThreads: number;
  label: string | null;
}

/**
 * Phase D: reads computed investor responsiveness from `v_investor_responsiveness`.
 * Values are derived from the actual messages table, not from self-reported
 * `investor_profiles.response_rate` / `avg_reply_time` fields.
 *
 * Returns `null` fields (with a graceful label) if the investor has < 3 threads
 * in the last 90 days (the view's HAVING threshold).
 */
export function useComputedResponsiveness(investorId: string | null | undefined) {
  const [data, setData] = useState<ComputedResponsiveness | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!investorId) {
      setData(null);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: row } = await (supabase as any)
        .from("v_investor_responsiveness")
        .select("*")
        .eq("investor_id", investorId)
        .maybeSingle();

      if (!row) {
        setData({
          responseRatePct: null,
          medianReplyHours: null,
          totalThreads: 0,
          label: null,
        });
      } else {
        const hours = row.median_reply_hours as number | null;
        setData({
          responseRatePct: row.response_rate_pct != null ? Number(row.response_rate_pct) : null,
          medianReplyHours: hours != null ? Number(hours) : null,
          totalThreads: Number(row.total_threads ?? 0),
          label: hoursToLabel(hours),
        });
      }
      setLoading(false);
    })();
  }, [investorId]);

  return { data, loading };
}

function hoursToLabel(h: number | null | undefined): string | null {
  if (h == null) return null;
  if (h < 4) return "Usually within hours";
  if (h < 24) return "Usually within a day";
  if (h < 72) return "Within a few days";
  if (h < 168) return "Within a week";
  return "Sometimes takes over a week";
}
