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
import { useDailySwipes } from "@/hooks/useDailySwipes";
import { MatchModal } from "@/components/MatchModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isPro, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState<Filters>({ view: "all" });
  const [search, setSearch] = useState("");
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null);
  const [interestSentIds, setInterestSentIds] = useState<Set<string>>(new Set());

  const { excludedIds, loading: historyLoading } = useSwipeHistory(user?.id);
  const { canSwipe, incrementSwipe } = useDailySwipes(
    user?.id ?? null,
    isPro,
    (user?.user_type as "founder" | "investor" | null) ?? null
  );

  // Debounce search into filters
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/onboarding");
  }, [authLoading, user, navigate]);

  const { profiles, loading, hasMore, loadMore, savedIds, refetchSaved, targetType } =
    useDiscoverFeed(
      user?.id,
      (user?.user_type as "founder" | "investor" | null) ?? null,
      filters,
      excludedIds
    );

  const { expressInterest, toggleWatchlist } = useExpressInterest(user?.id);

  // Load existing "interest sent" set so cards reflect prior actions
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
    if (!canSwipe) {
      toast({
        variant: "destructive",
        title: "Daily limit reached",
        description: "Upgrade to Pro for more daily interactions.",
      });
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
    incrementSwipe();
    if (res.matched) {
      setMatchedProfile(p);
    } else {
      toast({ title: "Interest sent", description: `${p.name} will be notified.` });
    }
  };

  const onToggleSave = async (p: DiscoverProfile) => {
    const wasSaved = savedIds.has(p.id);
    await toggleWatchlist(p.id, wasSaved);
    refetchSaved();
    toast({
      title: wasSaved ? "Removed from watchlist" : "Saved to watchlist",
    });
  };

  const viewerType = (user?.user_type as "founder" | "investor" | null) ?? null;
  const effectiveTarget: "founder" | "investor" =
    targetType ?? (viewerType === "founder" ? "investor" : "founder");

  const isLoading = authLoading || historyLoading;

  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters: sidebar on desktop, sheet on mobile */}
          <div className="hidden lg:block">
            <DiscoverFilters
              filters={filters}
              onChange={setFilters}
              targetType={effectiveTarget}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">
                {loading ? "Loading…" : `${profiles.length} ${effectiveTarget}s`}
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Filters
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

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No {effectiveTarget}s match your filters yet. Try clearing some filters.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {profiles.map((p) => (
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
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <MatchModal
        isOpen={!!matchedProfile}
        onClose={() => setMatchedProfile(null)}
        matchedProfile={matchedProfile}
        userType={(viewerType ?? "founder") as "founder" | "investor"}
      />
    </div>
  );
};

export default Dashboard;
