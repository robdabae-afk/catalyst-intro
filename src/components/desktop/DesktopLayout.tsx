import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { SwipePanel } from './SwipePanel';
import { PendingApprovalOverlay } from './PendingApprovalOverlay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppNavigation } from '@/components/AppNavigation';
import { BottomNavigation } from '@/components/BottomNavigation';
import { MatchModal } from '@/components/MatchModal';
import { InstantMessageModal } from '@/components/InstantMessageModal';
import { TokenPurchaseModal } from '@/components/TokenPurchaseModal';
import { BoostPurchaseDialog } from '@/components/BoostPurchaseDialog';
import { OrganicProfile, useSwipeQueue } from '@/hooks/useSwipeQueue';
import { useSwipeHistory } from '@/hooks/useSwipeHistory';
import { useApprovalCheck } from '@/hooks/useApprovalCheck';
import { useDailySwipes } from '@/hooks/useDailySwipes';
import { SwipeLimitReachedFlow } from '@/components/SwipeLimitReachedFlow';
import { CaughtUpState } from '@/components/CaughtUpState';

interface Match {
  profile: {
    id: string;
    name: string;
    email: string;
    user_type: string;
    avatar_url?: string;
  };
  founderProfile?: any;
  investorProfile?: any;
  matchRecord?: {
    id: string;
    status: string;
    first_message_sender_id: string | null;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface DesktopLayoutProps {
  currentUser: any;
  isPro: boolean;
}

type ViewMode = 'swipe' | 'chat';

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ currentUser, isPro }) => {
  const navigate = useNavigate();
  
  // Approval check for pending users
  const { isApproved, isLoading: approvalLoading } = useApprovalCheck();
  const [showPendingBanner, setShowPendingBanner] = useState(true);
  
  // View mode state - binary swipe/chat
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
  
  // Matches state for sidebar
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  // Messages state for chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Profiles state for swiping
  const [organicProfiles, setOrganicProfiles] = useState<OrganicProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  
  // Modal states
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<OrganicProfile | null>(null);
  const [showInstantMessageModal, setShowInstantMessageModal] = useState(false);
  const [showTokenPurchaseModal, setShowTokenPurchaseModal] = useState(false);
  const [showBoostDialog, setShowBoostDialog] = useState(false);
  const [boostCredits, setBoostCredits] = useState(0);
  const [hasMutualMatch, setHasMutualMatch] = useState(false);

  // If pending user, block swiping and show overlay
  const isPendingUser = !approvalLoading && isApproved === false;

  // Swipe history for filtering out recently swiped profiles
  const { filterProfiles, loading: historyLoading, refetch: refetchHistory, resetSwipeHistory, addSwipedId } = useSwipeHistory(currentUser?.id);

  // Daily swipe limits
  const {
    canSwipe,
    remainingSwipes,
    incrementSwipe,
    dailyLimit,
  } = useDailySwipes(currentUser?.id ?? null, isPro, currentUser?.user_type as 'founder' | 'investor' | null);

  // State for swipe limit flow
  const [showSwipeLimitFlow, setShowSwipeLimitFlow] = useState(false);

  // Initialize swipe queue
  const {
    currentItem,
    handleSwipe: advanceQueue,
    isQueueEmpty,
    resetQueue,
    totalOrganic,
  } = useSwipeQueue(organicProfiles, [], isPro, isTestMode);

  // Fetch profiles for swiping
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentUser) return;
      try {
        setLoadingProfiles(true);
        
        const { data: userData } = await supabase
          .from('profiles')
          .select('is_test_mode, spotlight_credits')
          .eq('id', currentUser.id)
          .single();

        const isTestModeValue = userData?.is_test_mode || false;
        setIsTestMode(isTestModeValue);
        setBoostCredits(userData?.spotlight_credits || 0);

        let query = supabase
          .from('profiles')
          .select(`*, founder_profiles(*), investor_profiles(*)`)
          .neq('id', currentUser.id);

        if (isTestModeValue) {
          query = query.eq('is_test_account', true);
        } else {
          const targetType = currentUser.user_type === 'founder' ? 'investor' : 'founder';
          query = query.eq('is_test_account', false).eq('user_type', targetType);
        }

        const { data, error } = await query.limit(50); // Fetch more to account for filtering
        if (error) throw error;

        if (data) {
          const profiles = data.map((p: any) => ({
            ...p,
            isAd: false,
            founder_profiles: p.founder_profiles || null,
            investor_profiles: p.investor_profiles || null
          })).sort((a: any, b: any) => {
            if (a.is_featured === b.is_featured) return 0;
            return a.is_featured ? -1 : 1;
          });
          
          // Filter out recently swiped profiles (within 14-day cooldown)
          const filteredProfiles = filterProfiles(profiles);
          setOrganicProfiles(filteredProfiles);
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
      } finally {
        setLoadingProfiles(false);
      }
    };

    // Wait for history to load before fetching
    if (!historyLoading) {
      fetchProfiles();
    }
  }, [currentUser, historyLoading, filterProfiles]);

  // Fetch matches for sidebar
  useEffect(() => {
    if (!currentUser) return;

    const fetchMatches = async () => {
      try {
        setLoadingMatches(true);
        
        const { data: myLikes } = await supabase
          .from("swipes")
          .select("swiped_id")
          .eq("swiper_id", currentUser.id)
          .eq("action", "like");
          
        if (!myLikes || myLikes.length === 0) {
          setLoadingMatches(false);
          return;
        }
        
        const likedIds = myLikes.map(l => l.swiped_id);
        
        const { data: mutualLikes } = await supabase
          .from("swipes")
          .select("swiper_id")
          .eq("action", "like")
          .in("swiper_id", likedIds)
          .eq("swiped_id", currentUser.id);
          
        if (!mutualLikes || mutualLikes.length === 0) {
          setLoadingMatches(false);
          return;
        }
        
        const matchedIds = mutualLikes.map(l => l.swiper_id);
        
        const [profilesResult, matchRecordsResult] = await Promise.all([
          supabase.from("profiles").select("*").in("id", matchedIds),
          supabase.from("matches").select("*").or(`user_1_id.eq.${currentUser.id},user_2_id.eq.${currentUser.id}`)
        ]);

        const profiles = profilesResult.data || [];
        const matchRecords = matchRecordsResult.data || [];

        const matchesWithDetails = await Promise.all(profiles.map(async (profile) => {
          let additional = null;
          if (profile.user_type === 'founder') {
            const { data } = await supabase.from("founder_profiles").select("*").eq("profile_id", profile.id).single();
            additional = data;
          } else if (profile.user_type === 'investor') {
            const { data } = await supabase.from("investor_profiles").select("*").eq("profile_id", profile.id).single();
            additional = data;
          }

          const matchRecord = matchRecords.find(m =>
            (m.user_1_id === currentUser.id && m.user_2_id === profile.id) ||
            (m.user_2_id === currentUser.id && m.user_1_id === profile.id)
          );

          return {
            profile,
            founderProfile: profile.user_type === 'founder' ? additional : null,
            investorProfile: profile.user_type === 'investor' ? additional : null,
            matchRecord: matchRecord ? {
              id: matchRecord.id,
              status: matchRecord.status,
              first_message_sender_id: matchRecord.first_message_sender_id
            } : undefined
          };
        }));

        const activeMatches = matchesWithDetails.filter(m => !m.matchRecord || m.matchRecord.status === 'active');
        setMatches(activeMatches as Match[]);
      } catch (err) {
        console.error("Error fetching matches", err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [currentUser]);

  // Check for mutual match when current profile changes
  useEffect(() => {
    if (!currentUser || !currentItem) {
      setHasMutualMatch(false);
      return;
    }

    const checkMatch = async () => {
      const { data } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', currentItem.id)
        .eq('swiped_id', currentUser.id)
        .eq('action', 'like')
        .maybeSingle();

      setHasMutualMatch(!!data);
    };

    checkMatch();
  }, [currentItem, currentUser]);

  // Fetch messages when match is selected
  useEffect(() => {
    if (!selectedMatch || !currentUser) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedMatch.profile.id}),and(sender_id.eq.${selectedMatch.profile.id},receiver_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setLoadingMessages(false);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('desktop-chat-' + selectedMatch.profile.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${selectedMatch.profile.id}`
      }, (payload) => {
        if (payload.new.receiver_id === currentUser.id) {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatch, currentUser]);

  // Handle selecting a match - switch to chat mode
  const handleSelectMatch = useCallback((match: Match) => {
    setSelectedMatch(match);
    setViewMode('chat');
  }, []);

  // Handle exiting chat - back to swipe mode
  const handleExitChat = useCallback(() => {
    setViewMode('swipe');
    setSelectedMatch(null);
    setMessages([]);
  }, []);

  // Handle sending message
  const handleSendMessage = async (content: string) => {
    if (!selectedMatch || !currentUser) return;

    const tempId = Math.random().toString();
    const tempMessage = {
      id: tempId,
      sender_id: currentUser.id,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedMatch.profile.id,
      content
    });

    if (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Handle swipe action
  const handleSwipe = async (direction: 'pass' | 'like' | 'priority_like') => {
    if (!currentItem || !currentUser) return;

    // Check daily swipe limit
    if (!canSwipe) {
      setShowSwipeLimitFlow(true);
      return;
    }

    // Record swipe
    const actionMap = { 'pass': 'pass', 'like': 'like', 'priority_like': 'priority' };
    supabase.from('swipes').insert({
      swiper_id: currentUser.id,
      swiped_id: currentItem.id,
      action: actionMap[direction]
    }).then(({ error }) => {
      if (error) console.error("Error recording swipe:", error);
    });

    // Check for match
    if ((direction === 'like' || direction === 'priority_like') && hasMutualMatch) {
      setMatchedProfile(currentItem as OrganicProfile);
      setMatchModalOpen(true);
    }

    // Track this swiped ID locally to prevent re-showing
    if (currentItem) {
      addSwipedId(currentItem.id);
    }

    advanceQueue();
    incrementSwipe();
  };

  const handleResetHistory = async () => {
    await resetSwipeHistory();
    refetchHistory();
  };

  const handleInstantMessageClick = () => {
    setShowInstantMessageModal(true);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-black text-white">
      {/* Top Navigation */}
      <AppNavigation
        userId={currentUser?.id}
        userType={currentUser?.user_type}
        userName={currentUser?.name}
        avatarUrl={currentUser?.avatar_url}
        isPro={isPro}
      />

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 overflow-hidden pb-24">
        {/* Left Sidebar - Always Visible */}
        <Sidebar
          matches={matches}
          selectedMatchId={selectedMatch?.profile.id || null}
          onSelectMatch={handleSelectMatch}
          loading={loadingMatches}
        />

        {/* Right Panel - Swipe Mode or Chat Mode */}
        <div className="flex-1 overflow-hidden relative">
          {/* Pending Approval Overlay - blocks swipe panel */}
          {isPendingUser && showPendingBanner && viewMode === 'swipe' && (
            <PendingApprovalOverlay onDismiss={() => setShowPendingBanner(false)} />
          )}
          
          {viewMode === 'swipe' ? (
            isQueueEmpty ? (
              <div className="h-full flex flex-col items-center justify-center p-6">
                <CaughtUpState
                  userType={currentUser?.user_type || 'founder'}
                  totalOrganic={totalOrganic}
                  isPro={isPro}
                  adProfile={null}
                  onReset={resetQueue}
                  onExpandFilters={() => navigate('/filters')}
                  onResetHistory={handleResetHistory}
                />
              </div>
            ) : (
              <SwipePanel
                profile={isPendingUser ? null : (currentItem as OrganicProfile)}
                onSwipe={handleSwipe}
                onMessage={handleInstantMessageClick}
                isPro={isPro}
                boostCredits={boostCredits}
                isBoostActive={false}
                onBoostClick={() => setShowBoostDialog(true)}
                loading={loadingProfiles && !isPendingUser}
              />
            )
          ) : (
            <ChatPanel
              match={selectedMatch}
              messages={messages}
              currentUserId={currentUser?.id}
              onSendMessage={handleSendMessage}
              loading={loadingMessages}
              onBack={handleExitChat}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation - Desktop */}
      <BottomNavigation userType={currentUser?.user_type} />

      {/* Modals */}
      <MatchModal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
        userType={currentUser?.user_type || 'founder'}
      />

      {showInstantMessageModal && currentItem && (
        <InstantMessageModal
          receiverId={currentItem.id}
          receiverName={currentItem.name}
          tokenBalance={(currentUser as any)?.tokens || 0}
          cost={isPro ? 0 : 30}
          freeRemaining={isPro ? 3 : undefined}
          onClose={() => setShowInstantMessageModal(false)}
          onSuccess={() => {}}
          onOpenPurchase={() => {
            setShowInstantMessageModal(false);
            setShowTokenPurchaseModal(true);
          }}
        />
      )}

      {showTokenPurchaseModal && (
        <TokenPurchaseModal
          onClose={() => setShowTokenPurchaseModal(false)}
          onSuccess={() => setShowTokenPurchaseModal(false)}
        />
      )}

      {currentUser && (
        <BoostPurchaseDialog
          userId={currentUser.id}
          open={showBoostDialog}
          onOpenChange={setShowBoostDialog}
        />
      )}

      {/* Swipe Limit Reached Flow */}
      {showSwipeLimitFlow && currentUser && (
        <SwipeLimitReachedFlow
          adProfile={null}
          userId={currentUser.id}
          userType={currentUser.user_type}
          onClose={() => setShowSwipeLimitFlow(false)}
        />
      )}
    </div>
  );
};
