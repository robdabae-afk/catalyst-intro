import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { AppNavigation } from "@/components/AppNavigation";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CaughtUpState } from "@/components/CaughtUpState";
import { ConciergeMatchButton } from "@/components/ConciergeMatchButton";
import { SpotlightPurchaseButton } from "@/components/SpotlightPurchaseButton";
import { WelcomeBillboard } from "@/components/WelcomeBillboard";
import { useSwipeQueue, AdProfile, OrganicProfile } from "@/hooks/useSwipeQueue";
import { useSubscription } from "@/hooks/useSubscription";
import { useDailySwipes } from "@/hooks/useDailySwipes";

interface Profile {
  id: string;
  user_type: 'founder' | 'investor';
  name: string;
  email: string;
  avatar_url?: string;
  has_seen_welcome?: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [organicProfiles, setOrganicProfiles] = useState<OrganicProfile[]>([]);
  const [adProfiles, setAdProfiles] = useState<AdProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showWelcomeBillboard, setShowWelcomeBillboard] = useState(false);

  // Check subscription status for ad bypass
  const { isPro } = useSubscription(currentUser?.id || null);
  
  // Track daily swipes for free users
  const { 
    remainingSwipes, 
    canSwipe, 
    shouldShowUpgradePrompt, 
    incrementSwipe,
    baseSwipes 
  } = useDailySwipes(currentUser?.id || null, isPro, currentUser?.user_type || null);

  const {
    currentItem,
    isCurrentItemAd,
    handleSwipe: advanceQueue,
    resetQueue,
    isQueueEmpty,
    hasOnlyAds,
    totalOrganic,
  } = useSwipeQueue(organicProfiles, adProfiles, isPro);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is approved (has any role)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roles || roles.length === 0) {
        navigate('/pending-approval');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        navigate('/');
        return;
      }

      setCurrentUser(profile);
      
      // Show welcome billboard if user hasn't seen it yet
      if (!profile.has_seen_welcome) {
        setShowWelcomeBillboard(true);
      }
      
      await loadProfiles(profile);
    };

    init();
  }, [navigate]);

  const loadProfiles = async (user: Profile) => {
    try {
      // Load profiles of opposite type
      const targetType = user.user_type === 'founder' ? 'investor' : 'founder';
      
      // Fetch base profiles, user's filter preferences, and ad profiles in parallel
      const [profilesResult, filtersResult, adsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_type', targetType)
          .neq('id', user.id),
        supabase
          .from('profiles')
          .select('filter_stages, filter_industries, filter_locations')
          .eq('id', user.id)
          .single(),
        supabase.rpc('get_active_ad_profiles')
      ]);

      const profilesData = profilesResult.data;
      const adsData = adsResult.data;
      const filters = filtersResult.data;

      // Process ad profiles
      if (adsData && adsData.length > 0) {
        const formattedAds: AdProfile[] = adsData.map((ad: any) => ({
          ...ad,
          isAd: true as const,
        }));
        setAdProfiles(formattedAds);
      }

      if (!profilesData || profilesData.length === 0) {
        setOrganicProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch related profile data based on target type
      const profileIds = profilesData.map(p => p.id);
      
      let founderProfiles: any[] = [];
      let investorProfiles: any[] = [];

      if (targetType === 'founder') {
        const { data } = await supabase
          .from('founder_profiles')
          .select('*')
          .in('profile_id', profileIds);
        founderProfiles = data || [];
      } else {
        const { data } = await supabase
          .from('investor_profiles')
          .select('*')
          .in('profile_id', profileIds);
        investorProfiles = data || [];
      }

      // Merge profile data
      let mergedProfiles = profilesData.map(profile => ({
        ...profile,
        isAd: false as const,
        founder_profiles: founderProfiles.filter(fp => fp.profile_id === profile.id),
        investor_profiles: investorProfiles.filter(ip => ip.profile_id === profile.id)
      }));

      // Apply filter preferences
      if (filters) {
        const { filter_stages, filter_industries, filter_locations } = filters;

        mergedProfiles = mergedProfiles.filter(profile => {
          // Get the target profile data
          const founderProfile = profile.founder_profiles?.[0];
          const investorProfile = profile.investor_profiles?.[0];

          // Filter by stages
          if (filter_stages && filter_stages.length > 0) {
            const profileStage = founderProfile?.stage || investorProfile?.preferred_stage;
            if (profileStage && !filter_stages.includes(profileStage)) {
              return false;
            }
          }

          // Filter by industries
          if (filter_industries && filter_industries.length > 0) {
            const profileIndustries = founderProfile?.industry || investorProfile?.sectors_of_interest || [];
            const hasMatchingIndustry = profileIndustries.some((ind: string) => 
              filter_industries.includes(ind)
            );
            if (profileIndustries.length > 0 && !hasMatchingIndustry) {
              return false;
            }
          }

          // Filter by locations
          if (filter_locations && filter_locations.length > 0) {
            const profileLocation = founderProfile?.preferred_city || investorProfile?.location || '';
            const matchesLocation = filter_locations.some(loc => 
              profileLocation.toLowerCase().includes(loc.toLowerCase())
            );
            if (profileLocation && !matchesLocation) {
              return false;
            }
          }

          return true;
        });
      }

      // Get user's swipes to filter out already swiped profiles
      const { data: swipesData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = new Set(swipesData?.map(s => s.swiped_id) || []);
      const unswipedProfiles = mergedProfiles.filter(p => !swipedIds.has(p.id));

      setOrganicProfiles(unswipedProfiles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profiles",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!currentUser || !currentItem) return;

    // For ad profiles, just advance the queue without recording or counting
    if (isCurrentItemAd) {
      advanceQueue();
      return;
    }

    // Check swipe limit for non-Pro users (only for organic profiles)
    if (!canSwipe) {
      setShowUpgradePrompt(true);
      return;
    }

    const swipedProfile = currentItem as OrganicProfile;

    try {
      // Record the swipe
      await supabase.from('swipes').insert({
        swiper_id: currentUser.id,
        swiped_id: swipedProfile.id,
        action: direction
      });

      // Increment daily swipe count
      incrementSwipe();

      // Check if it's a match (they liked us back)
      if (direction === 'like') {
        const { data: matchData } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedProfile.id)
          .eq('swiped_id', currentUser.id)
          .eq('action', 'like')
          .single();

        if (matchData) {
          setMatchedProfile(swipedProfile);
          setMatchModalOpen(true);
        }
      }

      // Advance the queue
      advanceQueue();

      // Show upgrade prompt when reaching limit (at 0 remaining)
      if (!isPro && remainingSwipes <= 1) {
        setShowUpgradePrompt(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording swipe",
        description: error.message
      });
    }
  };

  const handleReset = async () => {
    resetQueue();
    if (currentUser) {
      setLoading(true);
      await loadProfiles(currentUser);
    }
  };

  // Show "all caught up" only when there are no organic profiles AND no ads
  const showAllCaughtUp = isQueueEmpty && !hasOnlyAds;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppNavigation 
        userType={currentUser?.user_type}
        userName={currentUser?.name}
        avatarUrl={currentUser?.avatar_url}
        isPro={isPro}
      />

      {/* Welcome Billboard Modal */}
      {showWelcomeBillboard && currentUser && (
        <WelcomeBillboard
          isOpen={showWelcomeBillboard}
          onClose={() => setShowWelcomeBillboard(false)}
          userId={currentUser.id}
          userType={currentUser.user_type}
        />
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && currentUser && (
        <UpgradePrompt
          userType={currentUser.user_type}
          remainingSwipes={remainingSwipes}
          userId={currentUser.id}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      {/* Main Content - Swipe Interface */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Spotlight and Concierge Buttons Row */}
        {currentUser && (
          <div className="flex gap-2">
            <div className="flex-1">
              <SpotlightPurchaseButton userId={currentUser.id} variant="compact" />
            </div>
            <div className="flex-1">
              <ConciergeMatchButton 
                userId={currentUser.id} 
                userType={currentUser.user_type}
                showBenefits={false}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          </div>
        ) : showAllCaughtUp ? (
          <CaughtUpState
            userType={currentUser?.user_type || 'founder'}
            totalOrganic={totalOrganic}
            isPro={isPro}
            adProfile={adProfiles.length > 0 ? adProfiles[0] : null}
            onReset={handleReset}
            onExpandFilters={() => navigate('/filters')}
          />
        ) : currentItem ? (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isCurrentItemAd ? (
                  <span className="inline-flex items-center gap-1">
                    <span>Sponsored Content</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span>👈 Pass</span>
                    <span className="mx-2">•</span>
                    <span>Interested 👉</span>
                  </span>
                )}
              </p>
              {/* Swipes remaining indicator for free users */}
              {!isPro && !isCurrentItemAd && (
                <p className="text-xs text-muted-foreground mt-1">
                  {remainingSwipes > 0 
                    ? `${remainingSwipes} swipe${remainingSwipes === 1 ? '' : 's'} left today`
                    : 'Daily limit reached'}
                </p>
              )}
            </div>
            <SwipeCard
              profile={currentItem}
              onSwipe={handleSwipe}
              userType={currentUser?.user_type || 'founder'}
              isAd={isCurrentItemAd}
              isPro={isPro}
            />
          </div>
        ) : null}
      </div>

      <MatchModal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
        userType={currentUser?.user_type || 'founder'}
      />
    </div>
  );
};

export default Dashboard;
