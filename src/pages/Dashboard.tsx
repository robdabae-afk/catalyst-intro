import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeQueue, AdProfile, OrganicProfile } from '@/hooks/useSwipeQueue';
import { FeaturedCard, ProfileMetrics } from '@/components/FeaturedCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { MatchModal } from '@/components/MatchModal';
import { WelcomeBillboard } from '@/components/WelcomeBillboard';
import LegalAcceptanceNotice from '@/components/LegalAcceptanceNotice';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ReferralShareModal } from '@/components/ReferralShareModal';
import { SwipeLimitReachedFlow } from '@/components/SwipeLimitReachedFlow';
import { CaughtUpState } from '@/components/CaughtUpState';
import { SpotlightPurchaseButton } from '@/components/SpotlightPurchaseButton';
import { ConciergeMatchButton } from '@/components/ConciergeMatchButton';
import { TractionLimitBanner } from '@/components/TractionLimitBanner';
import { AppNavigation } from '@/components/AppNavigation';
import { supabase } from '@/integrations/supabase/client';
import { SlidersHorizontal, X, Star, Handshake } from "lucide-react";

const Dashboard = () => {
  const { user: currentUser, isPro } = useAuth();
  const navigate = useNavigate();

  // Mock profiles if needed, or assume useSwipeQueue fetches them
  // In a real scenario, useSwipeQueue likely fetches inside or takes props.
  // Based on previous view, it takes props. So we need to fetch data.
  // Simplifying for this task: We'll assume the hook handles fetching or we pass empty and it mocks.
  // Actually, looking at Turn 1 code: const { organicProfiles, adProfiles, loading, error } = useProfiles();
  // I need to fetch profiles. But I can't see useProfiles hook code.
  // I will try to use useSwipeQueue with empty arrays and rely on its internal mocks or useEffect fetching if it has it. 
  // I need to fetch them.
  // I will Mock them here for the "Featured Founders" alignment since I don't have the fetching hook visible.
  // Or I can assume `useSwipeQueue` handles it? No, it took args.
  // I'll define mock profiles here to ensure the UI renders.

  // Fetch Profiles State
  const [organicProfiles, setOrganicProfiles] = useState<OrganicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeCooldown, setSwipeCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);

  // Initial Profile Fetch
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        // Fetch profiles excluding current user
        // We'll join with founder_profiles to get details
        // 1. Get current user's preferences (is_test_mode)
        const { data: userData } = await supabase
          .from('profiles')
          .select('is_test_mode')
          .eq('id', currentUser.id)
          .single();

        const isTestModeValue = userData?.is_test_mode || false;
        setIsTestMode(isTestModeValue);
        console.log("Fetching profiles. Test Mode:", isTestModeValue);

        let query = supabase
          .from('profiles')
          .select(`
                *,
                founder_profiles(*)
            `)
          .neq('id', currentUser.id); // Don't show self

        // Apply Test Mode Filter
        if (isTestModeValue) {
          query = query.eq('is_test_account', true);
        } else {
          query = query
            .eq('is_test_account', false)
            .eq('user_type', 'founder'); // Only show founders for now
        }

        const { data, error } = await query.limit(20);

        if (error) throw error;

        if (data) {
          console.log("Raw fetched data:", data);
          const profiles = data.map((p: any) => ({
            ...p,
            isAd: false,
            // Ensure founder_profiles array structure matches hook expectation
            founder_profiles: p.founder_profiles || []
          }));
          console.log("Processed profiles for queue:", profiles);
          setOrganicProfiles(profiles);
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [currentUser]);

  const {
    currentItem,
    isCurrentItemAd,
    handleSwipe: advanceQueue,
    resetQueue,
    isQueueEmpty,
    hasOnlyAds,
    totalOrganic,
  } = useSwipeQueue(organicProfiles, [], isPro, isTestMode);

  const [showWelcomeBillboard, setShowWelcomeBillboard] = useState(false);
  const [showLegalNotice, setShowLegalNotice] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<OrganicProfile | null>(null);

  // New State for Metrics
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [unlockingHistory, setUnlockingHistory] = useState(false);

  // New Match & Deal Logic State
  const [hasMutualMatch, setHasMutualMatch] = useState(false);
  const [publicDeal, setPublicDeal] = useState<{ company_name: string; round: string; date: string; sector: string; } | null>(null);

  useEffect(() => {
    if (currentUser) {
      // Only show if explicitly false/null in DB
      setShowWelcomeBillboard(!currentUser.has_seen_welcome);
      setShowLegalNotice(!currentUser.legal_acknowledged);
    }
  }, [currentUser]);

  // Metrics are disabled until backend RPCs are implemented
  // For now, we just set null metrics when currentItem changes
  useEffect(() => {
    if (!currentItem || isCurrentItemAd) {
      setMetrics(null);
      setPublicDeal(null);
      return;
    }
    // Set default empty metrics (features disabled)
    setMetrics({
      response_rate: 0,
      avg_reply_time: 'N/A',
      active_deals_count: 0,
      activity_heatmap: [],
      is_history_unlocked: false
    });
    setPublicDeal(null);
  }, [currentItem, isCurrentItemAd]);

  // Check for mutual match when currentItem changes
  useEffect(() => {
    if (!currentUser || !currentItem) {
      setHasMutualMatch(false);
      return;
    }

    const checkMatch = async () => {
      // Check if the current profile (swiped_id) has already liked the current user (swiper_id)
      const { data, error } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', currentItem.id)
        .eq('swiped_id', currentUser.id)
        .eq('action', 'like')
        .maybeSingle();

      if (data) {
        setHasMutualMatch(true);
      } else {
        setHasMutualMatch(false);
      }
    };

    checkMatch();
  }, [currentItem, currentUser]);

  // handleUnlockHistory is disabled until backend RPC is implemented
  const handleUnlockHistory = async () => {
    // Feature disabled - backend RPC not yet available
    console.log("Unlock history feature not yet implemented");
  };

  // Update handleSwipe signature to accept 'priority_like'
  const handleSwipe = async (direction: 'left' | 'right' | 'pass' | 'like' | 'priority_like') => {
    if (!currentItem) return;
    if (swipeCooldown) return;

    // Priority Logic Check
    if (direction === 'priority_like') {
      // If not Pro, check credits
      if (!isPro) {
        const credits = (currentUser as any)?.spotlight_credits || 0;
        if (credits <= 0) {
          // In real app, open purchase modal
          alert("You need Priority tokens to use this feature. Please purchase tokens.");
          return;
        }

        // Deduct Credit via independent RPC or Update for now (Optimistic)
        // Ideally we use an RPC to ensure transaction safety: `deduct_spotlight_credit`
        // Since we don't have that RPC validated in plan, we'll do a client-side update (less secure but functional for task)
        const { error: creditError } = await supabase
          .from('profiles')
          .update({ spotlight_credits: credits - 1 })
          .eq('id', currentUser.id);

        if (creditError) {
          console.error("Failed to deduct credit", creditError);
          return; // Stop if failed
        }
      }
    }

    // Visual feedback or API call here
    console.log(`Swiped ${direction} on ${currentItem.name}`);

    // Record Swipe in DB
    if (currentUser) {
      const actionMap = {
        'left': 'pass',
        'pass': 'pass',
        'right': 'like',
        'like': 'like',
        'priority_like': 'priority'
      };
      const dbAction = actionMap[direction];

      // Fire and forget swipe recording
      supabase.from('swipes').insert({
        swiper_id: currentUser.id,
        swiped_id: currentItem.id,
        action: dbAction
      }).then(({ error }) => {
        if (error) console.error("Error recording swipe:", error);
      });
    }

    // If swiping right/like/priority, check for Match
    if (direction === 'like' || direction === 'right' || direction === 'priority_like') {
      // Logic: If hasMutualMatch is true, then this swipe completes the match!
      if (hasMutualMatch && !currentItem.isAd) {
        // Create the Match Record (Optional: Back-end triggers usually handle this)
        // For UI feedback immediately:
        setMatchedProfile(currentItem as OrganicProfile);
        setMatchModalOpen(true);
      }
    }

    // Advance queue
    advanceQueue();
  };

  const handleReset = () => {
    resetQueue();
  };

  const showAllCaughtUp = isQueueEmpty && !hasOnlyAds;
  const currentProfile = currentItem as OrganicProfile | AdProfile | null;

  return (
    <div className="bg-background-dark font-sans antialiased overflow-hidden h-screen w-full flex flex-col text-white selection:bg-luxury-gold selection:text-black transition-colors duration-500">

      {/* Top Navigation - Restores Settings, Admin, Inbox, etc. */}
      <AppNavigation
        userType={currentUser?.user_type}
        userName={currentUser?.name || currentUser?.email?.split('@')[0]}
        avatarUrl={currentUser?.avatar_url}
        isPro={isPro}
      />

      {/* Featured Header - Sub-header for context */}
      <div className="flex-none px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif font-bold tracking-tight text-white">Featured</h1>
          <p className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">Top 1% Founders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Restore Purchase Options */}
          {!isPro && currentUser?.user_type === 'founder' && (
            <>
              <SpotlightPurchaseButton userId={currentUser.id} />
              <ConciergeMatchButton userId={currentUser.id} userType={currentUser.user_type} variant="compact" showBenefits={false} />
            </>
          )}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/filters')}
          >
            <SlidersHorizontal size={20} className="text-white/90" />
          </button>
        </div>
      </div>

      {/* Main Swipe/Scroll Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full pb-40 bg-background-dark scroll-smooth">

        {/* Modals & Overlays - Conditionally rendered */}
        {showWelcomeBillboard && currentUser && (
          <WelcomeBillboard
            isOpen={showWelcomeBillboard}
            onClose={() => setShowWelcomeBillboard(false)}
            userId={currentUser.id}
            userType={currentUser.user_type}
          />
        )}
        {currentUser && (
          <LegalAcceptanceNotice
            open={showLegalNotice}
            onAcknowledge={() => setShowLegalNotice(false)}
            userId={currentUser.id}
          />
        )}
        {currentUser && !showWelcomeBillboard && !showLegalNotice && (
          <FeedbackModal userId={currentUser.id} />
        )}
        {showReferralModal && currentUser && !isPro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <ReferralShareModal
              userId={currentUser.id}
              userType={currentUser.user_type}
              onClose={() => {
                setShowReferralModal(false);
                setShowUpgradePrompt(true);
              }}
            />
          </div>
        )}
        {showUpgradePrompt && currentUser && !showReferralModal && (
          <SwipeLimitReachedFlow
            adProfile={null}
            userId={currentUser.id}
            userType={currentUser.user_type}
            onClose={() => setShowUpgradePrompt(false)}
          />
        )}

        <MatchModal
          isOpen={matchModalOpen}
          onClose={() => setMatchModalOpen(false)}
          matchedProfile={matchedProfile}
          userType={currentUser?.user_type || 'founder'}
        />

        {loading ? (
          <div className="flex items-center justify-center h-full pt-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059] mx-auto mb-4"></div>
              <p className="text-white/50 text-sm tracking-widest uppercase">Curating Profiles...</p>
            </div>
          </div>
        ) : showAllCaughtUp ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <CaughtUpState
              userType={currentUser?.user_type || 'founder'}
              totalOrganic={totalOrganic}
              isPro={isPro}
              adProfile={null}
              onReset={handleReset}
              onExpandFilters={() => navigate('/filters')}
            />
          </div>
        ) : currentProfile ? (
          <div className="flex flex-col w-full px-3 pt-3 gap-4 pb-10">
            {/* Cooldown Overlay */}
            {swipeCooldown && (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center shadow-lg border border-white/20 animate-scale-in">
                  <span className="text-3xl font-bold text-white">{cooldownSeconds}</span>
                </div>
              </div>
            )}

            <FeaturedCard
              profile={currentProfile}
              userType={currentUser?.user_type || 'founder'}
              metrics={metrics}
              onUnlockHistory={handleUnlockHistory}
              unlockingHistory={unlockingHistory}
              isPro={isPro}
              isMatch={hasMutualMatch}
              publicDeal={publicDeal}
            />
            <div className="h-8"></div>
          </div>
        ) : null}
      </main>

      {/* Floating Action Buttons */}
      {!loading && !showAllCaughtUp && currentProfile && (
        <div className="absolute bottom-[90px] left-0 w-full px-6 pointer-events-none z-40">
          <div className="flex items-center justify-center gap-5 pointer-events-auto">
            <button
              onClick={() => handleSwipe('pass')}
              disabled={swipeCooldown}
              className="group flex items-center justify-center w-[68px] h-[68px] rounded-full bg-[#1A1A1A] border border-white/5 shadow-2xl hover:border-white/20 hover:bg-[#222] transition-all active:scale-95 duration-200"
            >
              <X className="text-white/40 group-hover:text-white/90 transition-colors" size={32} />
            </button>
            <button
              onClick={() => handleSwipe('priority_like')}
              disabled={swipeCooldown}
              className="relative group flex flex-col items-center justify-center w-[75px] h-[75px] rounded-full bg-gradient-to-br from-[#FFE5A0] via-[#C5A059] to-[#8a6e1c] border border-white/20 shadow-[0_0_20px_rgba(197,160,89,0.3)] active:scale-95 -mb-2 overflow-visible transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute -top-3.5 bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg tracking-widest uppercase border border-luxury-gold/30 whitespace-nowrap">
                Priority
              </div>
              <Star className="text-black drop-shadow-sm transition-transform group-hover:scale-110" size={36} fill="black" />
            </button>
            <button
              onClick={() => handleSwipe('like')}
              disabled={swipeCooldown}
              className="group flex items-center justify-center w-[68px] h-[68px] rounded-full bg-white shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] transition-all active:scale-95 duration-200"
            >
              <Handshake className="text-black group-hover:rotate-12 transition-transform duration-300" size={34} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
