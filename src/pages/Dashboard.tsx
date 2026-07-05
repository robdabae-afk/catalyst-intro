import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { DiscoverMenuBar } from "@/components/discover/DiscoverMenuBar";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DiscoverCard } from "@/components/discover/DiscoverCard";
import {
  useDiscoverFeed,
  type DiscoverFilters as Filters,
  type DiscoverProfile,
} from "@/hooks/useDiscoverFeed";
import { useExpressInterest } from "@/hooks/useExpressInterest";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import { MatchModal } from "@/components/MatchModal";
import { RequestIntroModal } from "@/components/discover/RequestIntroModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Loader2, Crown, Lock } from "lucide-react";
import { BASIC_DAILY_DISCOVER_PROFILES } from "@/lib/membership-constants";

const Dashboard = () => {
  const { user, isPro, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState<Filters>({ view: "all" });
  const [search, setSearch] = useState("");
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null);
  const [interestSentIds, setInterestSentIds] = useState<Set<string>>(new Set());
  const [upgrading, setUpgrading] = useState(false);
  const [introTarget, setIntroTarget] = useState<DiscoverProfile | null>(null);

  const { excludedIds, loading: historyLoading } = useSwipeHistory(user?.id);

  // Debounce search into filters
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!cancelled && !authUser) navigate("/auth");
    });
    return () => { cancelled = true; };
  }, [navigate]);

  const { profiles, loading, savedIds, refetchSaved, targetType } =
    useDiscoverFeed(
      user?.id,
      (user?.user_type as "founder" | "investor" | null) ?? null,
      filters,
      excludedIds
    );

  const { expressInterest, toggleWatchlist } = useExpressInterest(user?.id);

  // Cap to 6/day for Basic users
  const visibleProfiles = useMemo(() => {
    if (isPro) return profiles.slice(0, 12); // Pro: show up to 12 in grid
    return profiles.slice(0, BASIC_DAILY_DISCOVER_PROFILES);
  }, [profiles, isPro]);

  const limitReached = !isPro && profiles.length > BASIC_DAILY_DISCOVER_PROFILES;

  // Load existing "interest sent" set
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", user.id)
      .eq("action", "like")
      .then(({ data }) => {
        setInterestSentIds(new Set((data ?? []).map((s: any) => s.swiped_id)));
      });
  }, [user?.id]);

  const onExpressInterest = async (p: DiscoverProfile) => {
    if (!user) return;
    // Investors get the structured Request Intro modal; founders keep one-tap.
    if (targetType === "investor") {
      setIntroTarget(p);
      return;
    }
    setInterestSentIds((prev) => new Set(prev).add(p.id));
    const res = await expressInterest(p.id);
    if (!res.ok) {
      setInterestSentIds((prev) => {
        const n = new Set(prev);
        n.delete(p.id);
        return n;
      });
      toast({ variant: "destructive", title: "Could not send interest", description: res.error });
      return;
    }
    if (res.matched) {
      setMatchedProfile(p);
    } else {
      toast({ title: "Interest sent", description: `${p.name} will be notified.` });
    }
  };

  const onIntroSubmitted = async (p: DiscoverProfile) => {
    setInterestSentIds((prev) => new Set(prev).add(p.id));
    // Fire the underlying like so mutual-interest matching still works if the investor also likes back.
    const res = await expressInterest(p.id);
    if (res.matched) setMatchedProfile(p);
  };

  const onToggleSave = async (p: DiscoverProfile) => {
    const wasSaved = savedIds.has(p.id);
    await toggleWatchlist(p.id, wasSaved);
    refetchSaved();
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action: "create_checkout", plan: "discover_pro" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout failed", description: e.message });
      setUpgrading(false);
    }
  };

  const viewerType = (user?.user_type as "founder" | "investor" | null) ?? null;
  const effectiveTarget: "founder" | "investor" =
    targetType ?? (viewerType === "founder" ? "investor" : "founder");

  const isLoading = authLoading || historyLoading;

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col ">
      <DiscoverMenuBar
        userId={user?.id}
        userType={viewerType}
        userName={user?.name}
        avatarUrl={user?.avatar_url}
        isPro={isPro}
        search={search}
        onSearchChange={setSearch}
        view={filters.view ?? "all"}
        onViewChange={(v) => setFilters((f) => ({ ...f, view: v }))}
      />

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-col">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="text-[11px] text-muted-foreground">
            {loading
              ? "Loading…"
              : isPro
              ? `${visibleProfiles.length} ${effectiveTarget}s`
              : `${visibleProfiles.length}/${BASIC_DAILY_DISCOVER_PROFILES} today`}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] lg:hidden">
                <SlidersHorizontal className="w-3 h-3 mr-1" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-4">
              <DiscoverFilters
                filters={filters}
                onChange={setFilters}
                targetType={effectiveTarget}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Filters sidebar (desktop) */}
          <aside className="hidden lg:block w-60 shrink-0 overflow-y-auto pr-1">
            <DiscoverFilters
              filters={filters}
              onChange={setFilters}
              targetType={effectiveTarget}
            />
          </aside>

          {/* Grid area */}
          <div className="flex-1 min-w-0 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : visibleProfiles.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground text-xs px-6">
                No {effectiveTarget}s match your filters yet. Try clearing some.
              </div>
            ) : (
              <div className="h-full grid grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 gap-2 sm:gap-3">
                {visibleProfiles.map((p) => (
                  <DiscoverCard
                    key={p.id}
                    profile={p}
                    targetType={effectiveTarget}
                    isSaved={savedIds.has(p.id)}
                    interestSent={interestSentIds.has(p.id)}
                    onExpressInterest={onExpressInterest}
                    onToggleSave={onToggleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade banner for Basic users when more profiles exist */}
        {!isPro && limitReached && !isLoading && (
          <div className="shrink-0 mt-2 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 via-amber-500/5 to-primary/5 px-3 py-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight">
                You've seen today's {BASIC_DAILY_DISCOVER_PROFILES} profiles
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                Upgrade to Pro for unlimited daily discovery — $40/mo
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="h-7 px-3 text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            >
              {upgrading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Crown className="w-3 h-3 mr-1" /> Go Pro
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <MatchModal
        isOpen={!!matchedProfile}
        onClose={() => setMatchedProfile(null)}
        matchedProfile={matchedProfile}
        userType={(viewerType ?? "founder") as "founder" | "investor"}
      />

      <RequestIntroModal
        open={!!introTarget}
        onOpenChange={(open) => !open && setIntroTarget(null)}
        investor={introTarget}
        founderId={user?.id}
        onSubmitted={onIntroSubmitted}
      />
    </div>
  );
};

export default Dashboard;
