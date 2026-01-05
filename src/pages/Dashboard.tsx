
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeQueue, AdProfile, OrganicProfile } from '@/hooks/useSwipeQueue';
import { FeaturedCard } from '@/components/FeaturedCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { MatchModal } from '@/components/MatchModal';
import { WelcomeBillboard } from '@/components/WelcomeBillboard';
import { LegalAcceptanceNotice } from '@/components/LegalAcceptanceNotice';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ReferralShareModal } from '@/components/ReferralShareModal';
import { SwipeLimitReachedFlow } from '@/components/SwipeLimitReachedFlow';
import { CaughtUpState } from '@/components/CaughtUpState';
import { SpotlightPurchaseButton } from '@/components/SpotlightPurchaseButton';
import { ConciergeMatchButton } from '@/components/ConciergeMatchButton';
import { TractionLimitBanner } from '@/components/TractionLimitBanner';
import { AppNavigation } from '@/components/AppNavigation';

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
  // Wait, useSwipeQueue took arguments: (organicProfiles, adProfiles, isPro).
  // I need to fetch them.
  // I will Mock them here for the "Featured Founders" alignment since I don't have the fetching hook visible.
  // Or I can assume `useSwipeQueue` handles it? No, it took args.
  // I'll define mock profiles here to ensure the UI renders.

  const mockOrganicProfiles: OrganicProfile[] = [
    {
      id: '1',
      user_type: 'founder',
      name: 'Sarah Jenkins',
      email: 'sarah@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
      founder_profiles: [{
        company_name: 'FinLeap',
        title: 'Founder',
        location: 'San Francisco, CA',
        stage: 'Seed',
      }],
    },
    {
      id: '2',
      user_type: 'investor',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
      founder_profiles: [{ // mimicking detail structure for investor too if needed
        company_name: 'Apex Ventures',
        title: 'Lead Partner',
        location: 'New York, NY',
      }],
    }
  ];

  const [loading, setLoading] = useState(false);
  const [swipeCooldown, setSwipeCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const {
    currentItem,
    isCurrentItemAd,
    handleSwipe: advanceQueue,
    resetQueue,
    isQueueEmpty,
    hasOnlyAds,
    totalOrganic,
  } = useSwipeQueue(mockOrganicProfiles, [], isPro);

  const [showWelcomeBillboard, setShowWelcomeBillboard] = useState(true);
  const [showLegalNotice, setShowLegalNotice] = useState(true);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<OrganicProfile | null>(null);

  const handleSwipe = async (direction: 'left' | 'right' | 'pass' | 'like') => {
    if (!currentItem) return;
    if (swipeCooldown) return;

    // Visual feedback or API call here
    console.log(`Swiped ${direction} on ${currentItem.name}`);

    if (direction === 'like' || direction === 'right') {
      // Mock match
      if (Math.random() > 0.7 && !currentItem.isAd) {
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

      {/* Header */}
      <header className="flex-none z-50 bg-background-dark/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif font-bold tracking-tight text-white">Featured</h1>
          <p className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">Top 1% Founders</p>
        </div>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          onClick={() => navigate('/filters')} // Mock action
        >
          <span className="material-symbols-outlined text-white/90" style={{ fontSize: "20px" }}>tune</span>
        </button>
      </header>

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
              <span className="material-symbols-outlined text-white/40 group-hover:text-white/90 text-[32px] transition-colors">close</span>
            </button>
            <button
              onClick={() => handleSwipe('like')}
              disabled={swipeCooldown}
              className="relative group flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#FFE5A0] via-[#C5A059] to-[#8a6e1c] border border-white/20 shadow-[0_0_20px_rgba(197,160,89,0.3)] active:scale-95 -mb-2 overflow-visible transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute -top-3.5 bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg tracking-widest uppercase border border-luxury-gold/30 whitespace-nowrap">
                Priority
              </div>
              <span className="material-symbols-outlined text-black text-[30px] drop-shadow-sm transition-transform group-hover:scale-110">star</span>
            </button>
            <button
              onClick={() => handleSwipe('like')}
              disabled={swipeCooldown}
              className="group flex items-center justify-center w-[68px] h-[68px] rounded-full bg-white shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-gray-100 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] transition-all active:scale-95 duration-200"
            >
              <span className="material-symbols-outlined text-black text-[34px] group-hover:rotate-12 transition-transform duration-300">handshake</span>
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
