import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HotProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  user_type: "founder" | "investor";
  subtitle?: string | null;
}

export interface UpcomingEvent {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string | null;
  code: string;
}

export interface NewsItem {
  id: string;
  news_date: string;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
}

function isoWeekStart(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date.toISOString().slice(0, 10);
}

export function useHomeFeed(userId: string | null, userType: "founder" | "investor" | null) {
  const [hotProfiles, setHotProfiles] = useState<HotProfile[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userType) return;
    let cancelled = false;
    const oppositeRole: "founder" | "investor" = userType === "founder" ? "investor" : "founder";

    const load = async () => {
      setLoading(true);

      const weekStart = isoWeekStart();
      const todayIso = new Date().toISOString().slice(0, 10);
      const nowIso = new Date().toISOString();
      const inSevenDaysIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Hot picks: admin pins → most-liked → newest
      let pickIds: string[] = [];
      const { data: pins } = await supabase
        .from("home_hot_picks")
        .select("profile_id, position")
        .eq("week_start", weekStart)
        .eq("role", oppositeRole)
        .order("position", { ascending: true });
      if (pins && pins.length) pickIds = pins.map((p) => p.profile_id);

      if (pickIds.length === 0) {
        const { data: swipes } = await supabase
          .from("swipes")
          .select("swiped_id")
          .eq("action", "like")
          .gte("created_at", sevenDaysAgoIso);
        if (swipes && swipes.length) {
          const counts: Record<string, number> = {};
          for (const s of swipes) counts[s.swiped_id as string] = (counts[s.swiped_id as string] ?? 0) + 1;
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id]) => id);
          // filter by opposite role
          if (sorted.length) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id")
              .in("id", sorted.slice(0, 30))
              .eq("user_type", oppositeRole);
            const validSet = new Set((profs ?? []).map((p) => p.id));
            pickIds = sorted.filter((id) => validSet.has(id)).slice(0, 6);
          }
        }
      }

      if (pickIds.length === 0) {
        const { data: newest } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_type", oppositeRole)
          .order("created_at", { ascending: false })
          .limit(6);
        pickIds = (newest ?? []).map((p) => p.id);
      }

      let profiles: HotProfile[] = [];
      if (pickIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, user_type")
          .in("id", pickIds);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        profiles = pickIds
          .map((id) => map.get(id))
          .filter(Boolean)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url,
            user_type: p.user_type,
          }));
      }

      // 2. Events this week
      const { data: evs } = await supabase
        .from("match_events")
        .select("id, name, starts_at, ends_at, code")
        .eq("is_active", true)
        .gte("starts_at", nowIso)
        .lte("starts_at", inSevenDaysIso)
        .order("starts_at", { ascending: true })
        .limit(5);

      // 3. Today's news
      const { data: n } = await supabase
        .from("home_news")
        .select("id, news_date, title, body, link, image_url")
        .eq("news_date", todayIso)
        .maybeSingle();

      if (cancelled) return;
      setHotProfiles(profiles);
      setEvents((evs ?? []) as UpcomingEvent[]);
      setNews((n ?? null) as NewsItem | null);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, userType]);

  return { hotProfiles, events, news, loading };
}
