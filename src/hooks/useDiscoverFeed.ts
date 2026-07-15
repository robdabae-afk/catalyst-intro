import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscoverProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  user_type: "founder" | "investor";
  is_verified?: boolean | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  founder_profiles?: any[] | any;
  investor_profiles?: any[] | any;
}

export interface DiscoverFilters {
  search?: string;
  industries?: string[]; // founders: industry; investors: sectors_of_interest
  stages?: string[]; // founders: stage; investors: preferred_stage
  locations?: string[]; // city/state contains
  mrrBand?: "" | "0" | "1-10k" | "10k-50k" | "50k+"; // founders only
  checkBand?: "" | "0-100k" | "100k-500k" | "500k-2m" | "2m+"; // investors only
  verifiedOnly?: boolean;
  view?: "all" | "trending" | "new" | "featured" | "saved";
}

const PAGE_SIZE = 24;

export function useDiscoverFeed(
  currentUserId: string | undefined,
  viewerType: "founder" | "investor" | null,
  filters: DiscoverFilters,
  excludedIds: Set<string>
) {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Target type is opposite of viewer
  const targetType: "founder" | "investor" | null = viewerType
    ? viewerType === "founder"
      ? "investor"
      : "founder"
    : null;

  const fetchSaved = useCallback(async () => {
    if (!currentUserId) return;
    const { data } = await supabase
      .from("watchlist")
      .select("target_id")
      .eq("user_id", currentUserId);
    setSavedIds(new Set((data ?? []).map((r: any) => r.target_id)));
  }, [currentUserId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (!currentUserId || !targetType) return;
      setLoading(true);

      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query: any = supabase
        .from("profiles")
        .select(`*, founder_profiles(*), investor_profiles(*)`, { count: "exact" })
        .neq("id", currentUserId)
        .eq("user_type", targetType)
        .eq("is_hidden", false)
        .eq("is_test_account", false);

      if (filters.search && filters.search.trim()) {
        query = query.ilike("name", `%${filters.search.trim()}%`);
      }

      if (filters.view === "new") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
        query = query.gte("created_at", sevenDaysAgo.toISOString());
      }
      if (filters.view === "featured") {
        query = query.eq("is_featured", true);
      }
      if (filters.verifiedOnly) {
        query = query.eq("is_verified", true);
      }
      if (filters.view === "saved") {
        const ids = Array.from(savedIds);
        if (ids.length === 0) {
          setProfiles([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        query = query.in("id", ids);
      }

      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) {
        console.error("Discover fetch error", error);
        setLoading(false);
        return;
      }

      let rows = (data ?? []) as DiscoverProfile[];

      // Client-side filters that need the joined detail rows
      rows = rows.filter((p) => !excludedIds.has(p.id));

      const detail = (p: DiscoverProfile) =>
        targetType === "founder"
          ? Array.isArray(p.founder_profiles)
            ? p.founder_profiles[0]
            : p.founder_profiles
          : Array.isArray(p.investor_profiles)
          ? p.investor_profiles[0]
          : p.investor_profiles;

      if (filters.industries && filters.industries.length) {
        rows = rows.filter((p) => {
          const d = detail(p);
          const tags: string[] = targetType === "founder" ? d?.industry ?? [] : d?.sectors_of_interest ?? [];
          return tags?.some((t) => filters.industries!.includes(t));
        });
      }
      if (filters.stages && filters.stages.length) {
        rows = rows.filter((p) => {
          const d = detail(p);
          const stage = targetType === "founder" ? d?.stage : d?.preferred_stage;
          return stage && filters.stages!.includes(stage);
        });
      }
      if (filters.locations && filters.locations.length) {
        const needles = filters.locations.map((l) => l.toLowerCase());
        rows = rows.filter((p) => {
          const d = detail(p);
          const loc = (
            targetType === "founder"
              ? `${d?.preferred_city ?? ""} ${d?.company_state ?? ""}`
              : `${d?.location ?? ""}`
          ).toLowerCase();
          return needles.some((n) => loc.includes(n));
        });
      }
      if (targetType === "founder" && filters.mrrBand) {
        rows = rows.filter((p) => (detail(p)?.mrr ?? "") === filters.mrrBand);
      }
      if (targetType === "investor" && filters.checkBand) {
        rows = rows.filter((p) => (detail(p)?.typical_check_size ?? "") === filters.checkBand);
      }

      setProfiles((prev) => (nextPage === 0 ? rows : [...prev, ...rows]));
      setHasMore((count ?? 0) > to + 1);
      setPage(nextPage);
      setLoading(false);
    },
    [currentUserId, targetType, filters, excludedIds, savedIds]
  );

  useEffect(() => {
    setProfiles([]);
    setPage(0);
    fetchPage(0);
  }, [fetchPage]);

  return {
    profiles,
    loading,
    hasMore,
    loadMore: () => fetchPage(page + 1),
    savedIds,
    refetchSaved: fetchSaved,
    targetType,
  };
}
