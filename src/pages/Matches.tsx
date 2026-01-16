import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Send, Coffee, Eye, ArrowLeft, MessageSquare, UserX, CheckCircle, Lock, Crown, AlertCircle, Quote } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { RequestMenu } from "@/components/RequestMenu";
import { EndorseUserDialog } from "@/components/EndorseUserDialog";
import { AppNavigation } from "@/components/AppNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { useActiveConversations } from "@/hooks/useActiveConversations";
import { useWeeklyInitiations } from "@/hooks/useWeeklyInitiations";
import { useMatchMessaging } from "@/hooks/useMatchMessaging";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
}

interface Match {
  profile: Profile;
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

interface CoffeeChat {
  id: string;
  proposed_date: string | null;
  meeting_location: string | null;
  status: string | null;
  investor_id: string;
  founder_id: string;
}

// Component for hidden investor info (for Basic Founders)
const HiddenInvestorInfo = ({ reveal }: { reveal: boolean }) => {
  if (reveal) return null;
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-xs">
      <Lock className="w-3 h-3" />
      <span>Full details visible after investor messages</span>
    </div>
  );
};

// Component for the chat limit modal
const ChatLimitModal = ({
  open,
  onOpenChange,
  userType,
  isPro,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'founder' | 'investor';
  isPro: boolean;
  onUpgrade: () => void;
}) => {
  const message = userType === 'founder'
    ? "You can only have 1 active conversation at a time. Unmatch your current conversation to start a new one, or upgrade to Pro for unlimited chats."
    : isPro
      ? "You've reached the maximum of 10 active conversations. Unmatch or mark a collaboration as successful to free up a slot."
      : "You can only have 2 active conversations at a time. Unmatch a conversation or upgrade to Pro for 10 active chats.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Chat Limit Reached
          </AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {!isPro && (
            <AlertDialogAction onClick={onUpgrade} className="bg-gradient-to-r from-amber-500 to-orange-500">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Chat actions menu
const ChatActionsMenu = ({
  onUnmatch,
  onMarkSuccessful,
  onEndorse,
  showMarkSuccessful,
  matchStatus,
}: {
  onUnmatch: () => void;
  onMarkSuccessful: () => void;
  onEndorse: () => void;
  showMarkSuccessful: boolean;
  matchStatus: string | null;
}) => {
  if (matchStatus !== 'active') return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEndorse}>
          <Quote className="w-4 h-4 mr-2" />
          Endorse User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {showMarkSuccessful && (
          <>
            <DropdownMenuItem onClick={onMarkSuccessful} className="text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Successful Collaboration
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onUnmatch} className="text-destructive">
          <UserX className="w-4 h-4 mr-2" />
          Unmatch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function Matches() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<'founder' | 'investor' | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChatLimitModal, setShowChatLimitModal] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);
  const [showEndorseDialog, setShowEndorseDialog] = useState(false);

  // Subscription & membership hooks
  const { isPro } = useSubscription(currentUserId);
  const { activeCount, limit: chatLimit, canStartNew, remaining: remainingChats } = useActiveConversations(
    currentUserId,
    currentUserType,
    isPro
  );
  const { remaining: weeklyInitiationsRemaining, canInitiate, increment: useInitiation } = useWeeklyInitiations(
    currentUserId,
    isPro,
    currentUserType
  );

  // Match messaging hook for selected match
  const {
    matchId,
    status: matchStatus,
    firstMessageSenderId,
    investorSentFirstMessage,
    canSendMessage,
    createOrGetMatch,
    recordFirstMessage,
    unmatch,
    markAsSuccessful,
  } = useMatchMessaging({
    currentUserId,
    matchedUserId: selectedMatch?.profile.id || null,
    currentUserType,
    isPro,
  });

  // Determine if investor info should be hidden (for Basic Founders)
  const shouldHideInvestorInfo = useMemo(() => {
    if (currentUserType !== 'founder' || isPro) return false;
    if (!selectedMatch || selectedMatch.profile.user_type !== 'investor') return false;
    return !investorSentFirstMessage;
  }, [currentUserType, isPro, selectedMatch, investorSentFirstMessage]);

  // Get displayed name for investor (hide last name if needed)
  const getDisplayName = (match: Match) => {
    if (shouldHideInvestorInfo && match.profile.user_type === 'investor') {
      const firstName = match.profile.name.split(' ')[0];
      return firstName;
    }
    return match.profile.name;
  };

  useEffect(() => {
    fetchMatches();
    fetchCoffeeChats();
  }, []);

  useEffect(() => {
    if (selectedMatch && currentUserId) {
      fetchMessages(selectedMatch.profile.id);

      // Ensure match record exists
      createOrGetMatch();

      // Subscribe to new messages
      const channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedMatch.profile.id},receiver_id=eq.${currentUserId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedMatch, currentUserId]);

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get user info
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCurrentUserType(profile.user_type as 'founder' | 'investor');
        setCurrentUserName(profile.name);
        setCurrentUserAvatar(profile.avatar_url);
      }

      // Get all users I've liked
      const { data: myLikes } = await supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", user.id)
        .eq("action", "like");

      if (!myLikes || myLikes.length === 0) {
        setLoading(false);
        return;
      }

      const likedIds = myLikes.map(like => like.swiped_id);

      // Get users who liked me back
      const { data: mutualLikes } = await supabase
        .from("swipes")
        .select("swiper_id")
        .eq("action", "like")
        .in("swiper_id", likedIds)
        .eq("swiped_id", user.id);

      if (!mutualLikes || mutualLikes.length === 0) {
        setLoading(false);
        return;
      }

      const matchedIds = mutualLikes.map(like => like.swiper_id);

      // Fetch profiles and match records in parallel
      const [profilesResult, matchRecordsResult] = await Promise.all([
        supabase.from("profiles").select("*").in("id", matchedIds),
        supabase
          .from("matches")
          .select("*")
          .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
      ]);

      const profiles = profilesResult.data;
      const matchRecords = matchRecordsResult.data || [];

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch additional profile details
      const matchesWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          let additionalProfile = null;

          if (profile.user_type === "founder") {
            const { data } = await supabase
              .from("founder_profiles")
              .select("*")
              .eq("profile_id", profile.id)
              .single();
            additionalProfile = data;
          } else if (profile.user_type === "investor") {
            const { data } = await supabase
              .from("investor_profiles")
              .select("*")
              .eq("profile_id", profile.id)
              .single();
            additionalProfile = data;
          }

          // Find the match record for this pair
          const matchRecord = matchRecords.find(
            m => (m.user_1_id === user.id && m.user_2_id === profile.id) ||
              (m.user_2_id === user.id && m.user_1_id === profile.id)
          );

          return {
            profile,
            founderProfile: profile.user_type === "founder" ? additionalProfile : null,
            investorProfile: profile.user_type === "investor" ? additionalProfile : null,
            matchRecord: matchRecord ? {
              id: matchRecord.id,
              status: matchRecord.status,
              first_message_sender_id: matchRecord.first_message_sender_id,
            } : undefined,
          };
        })
      );

      // Filter to only show active matches (or all if no match record yet)
      const activeMatches = matchesWithDetails.filter(
        m => !m.matchRecord || m.matchRecord.status === 'active'
      );

      setMatches(activeMatches);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${matchId}),and(sender_id.eq.${matchId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchCoffeeChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only fetch future coffee chats
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("coffee_chats")
        .select("*")
        .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
        .gte("proposed_date", now)
        .order("proposed_date", { ascending: true });

      if (data) {
        setCoffeeChats(data);
      }
    } catch (error) {
      console.error("Error fetching coffee chats:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !currentUserId) return;

    // Check if Basic Founder trying to send first message
    if (currentUserType === 'founder' && !isPro && !canSendMessage && messages.length === 0) {
      toast.error("Wait for the investor to message you first, or upgrade to Pro");
      return;
    }

    // Check if Pro Founder needs to use weekly initiation
    const isFirstMessage = messages.length === 0 && !firstMessageSenderId;
    if (currentUserType === 'founder' && isPro && isFirstMessage) {
      if (!canInitiate) {
        toast.error("You've used all 10 weekly initiations. Wait for reset or let them message first.");
        return;
      }
      const used = await useInitiation();
      if (!used) {
        toast.error("Failed to use initiation");
        return;
      }
    }

    try {
      // Ensure match record exists
      await createOrGetMatch();

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedMatch.profile.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Record first message if this is the first
      if (isFirstMessage) {
        await recordFirstMessage(currentUserId);
      }

      setNewMessage("");
      fetchMessages(selectedMatch.profile.id);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleUnmatch = async () => {
    const success = await unmatch();
    if (success) {
      toast.success("Unmatched successfully");
      setSelectedMatch(null);
      setMessages([]);
      fetchMatches();
    } else {
      toast.error("Failed to unmatch");
    }
    setShowUnmatchConfirm(false);
  };

  const handleMarkSuccessful = async () => {
    const success = await markAsSuccessful();
    if (success) {
      toast.success("Marked as successful collaboration!");
      setSelectedMatch(null);
      setMessages([]);
      fetchMatches();
    } else {
      toast.error("Failed to mark as successful");
    }
    setShowSuccessConfirm(false);
  };

  const handleSelectMatch = (match: Match) => {
    // Check chat limit before allowing selection of a new match
    if (!canStartNew && !match.matchRecord) {
      setShowChatLimitModal(true);
      return;
    }
    setSelectedMatch(match);
  };

  const handleBackToList = () => {
    setSelectedMatch(null);
    setMessages([]);
  };

  // Determine if messaging is disabled
  const isMessagingDisabled = currentUserType === 'founder' && !isPro && !canSendMessage && messages.length === 0;
  const messagingPlaceholder = isMessagingDisabled
    ? "Waiting for investor to send first message..."
    : "Type a message...";

  // Mobile: Full-screen chat view when a match is selected
  if (isMobile && selectedMatch) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Chat Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedMatch.profile.avatar_url} alt={getDisplayName(selectedMatch)} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {getDisplayName(selectedMatch).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{getDisplayName(selectedMatch)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {shouldHideInvestorInfo ? (
                  <HiddenInvestorInfo reveal={investorSentFirstMessage} />
                ) : (
                  selectedMatch.founderProfile?.startup_name ||
                  selectedMatch.investorProfile?.firm_name ||
                  selectedMatch.profile.user_type
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/profile/${selectedMatch.profile.id}`)}
                disabled={shouldHideInvestorInfo}
              >
                <Eye className="w-5 h-5" />
              </Button>
              <ChatActionsMenu
                onUnmatch={() => setShowUnmatchConfirm(true)}
                onMarkSuccessful={() => setShowSuccessConfirm(true)}
                onEndorse={() => setShowEndorseDialog(true)}
                showMarkSuccessful={currentUserType === 'investor' && isPro}
                matchStatus={matchStatus}
              />
              {((currentUserType === 'investor' && selectedMatch.profile.user_type === 'founder') ||
                (currentUserType === 'founder' && selectedMatch.profile.user_type === 'investor')) && (
                  <RequestMenu
                    targetId={selectedMatch.profile.id}
                    targetName={getDisplayName(selectedMatch)}
                    requesterType={currentUserType as 'founder' | 'investor'}
                  />
                )}
            </div>
          </div>
        </header>

        {/* Mobile Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isMessagingDisabled && messages.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4 text-center">
              <Lock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                As a Basic member, you can only message after the investor sends the first message.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigate('/settings')}
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
          )}
          {messages.length === 0 && !isMessagingDisabled ? (
            <p className="text-muted-foreground text-center py-8">
              No messages yet. Say hi! 👋
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUserId
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-white ${message.sender_id === currentUserId
                      ? "bg-zinc-900 border border-zinc-700"
                      : "bg-zinc-800 border border-zinc-700"
                      }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Chat Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={messagingPlaceholder}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1"
              disabled={isMessagingDisabled}
            />
            <Button onClick={sendMessage} size="icon" disabled={isMessagingDisabled}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog open={showUnmatchConfirm} onOpenChange={setShowUnmatchConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unmatch {getDisplayName(selectedMatch)}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end your conversation and free up a chat slot. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground">
                Unmatch
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showSuccessConfirm} onOpenChange={setShowSuccessConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Successful Collaboration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive this conversation and mark it as a successful collaboration. You'll free up a chat slot without unmatching.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkSuccessful} className="bg-green-600 text-white">
                Mark Successful
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedMatch && (
          <EndorseUserDialog
            isOpen={showEndorseDialog}
            onClose={() => setShowEndorseDialog(false)}
            targetUserId={selectedMatch.profile.id}
            targetUserName={getDisplayName(selectedMatch)}
          />
        )}
      </div>
    );
  }

  // Desktop layout OR Mobile matches list
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <AppNavigation
        userType={currentUserType}
        userName={currentUserName || undefined}
        avatarUrl={currentUserAvatar || undefined}
        pageTitle="Matches"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Membership Status Bar */}
        <div className="mb-4 flex flex-wrap gap-3 items-center text-sm">
          <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white text-black border border-zinc-200 hover:bg-zinc-100"}>
            {isPro ? <Crown className="w-3 h-3 mr-1" /> : null}
            {isPro ? "Pro" : "Basic Plan"}
          </Badge>
          <span className="text-muted-foreground">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Active chats: {activeCount}/{chatLimit === Infinity ? '∞' : chatLimit}
          </span>
          {currentUserType === 'founder' && isPro && (
            <span className="text-muted-foreground">
              Weekly initiations: {weeklyInitiationsRemaining}/10
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <Card className="lg:col-span-1 bg-card/95 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Your Matches ({matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] lg:h-[600px]">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading matches...</p>
                ) : matches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No matches yet. Keep swiping!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div
                        key={match.profile.id}
                        onClick={() => handleSelectMatch(match)}
                        className={`w-full p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedMatch?.profile.id === match.profile.id
                          ? "bg-primary/10 border-2 border-primary text-black"
                          : "bg-white border border-gray-200 text-black shadow-sm"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="flex-shrink-0">
                            <AvatarImage src={match.profile.avatar_url} alt={getDisplayName(match)} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getDisplayName(match).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="font-semibold truncate">{getDisplayName(match)}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {match.founderProfile?.startup_name || match.investorProfile?.firm_name || match.profile.user_type}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap min-w-fit text-black border-zinc-200">
                            {match.profile.user_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area - Desktop Only */}
          {!isMobile && (
            <Card className="lg:col-span-2 bg-card/95 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>
                  {selectedMatch ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={selectedMatch.profile.avatar_url} alt={getDisplayName(selectedMatch)} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getDisplayName(selectedMatch).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{getDisplayName(selectedMatch)}</p>
                          <p className="text-sm font-normal text-muted-foreground">
                            {shouldHideInvestorInfo ? (
                              <HiddenInvestorInfo reveal={investorSentFirstMessage} />
                            ) : (
                              selectedMatch.founderProfile?.one_liner ||
                              selectedMatch.investorProfile?.firm_name ||
                              "Start a conversation"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/profile/${selectedMatch.profile.id}`)}
                          disabled={shouldHideInvestorInfo}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                        <ChatActionsMenu
                          onUnmatch={() => setShowUnmatchConfirm(true)}
                          onMarkSuccessful={() => setShowSuccessConfirm(true)}
                          onEndorse={() => setShowEndorseDialog(true)}
                          showMarkSuccessful={currentUserType === 'investor' && isPro}
                          matchStatus={matchStatus}
                        />
                        {((currentUserType === 'investor' && selectedMatch.profile.user_type === 'founder') ||
                          (currentUserType === 'founder' && selectedMatch.profile.user_type === 'investor')) && (
                            <RequestMenu
                              targetId={selectedMatch.profile.id}
                              targetName={getDisplayName(selectedMatch)}
                              requesterType={currentUserType as 'founder' | 'investor'}
                            />
                          )}
                      </div>
                    </div>
                  ) : (
                    "Select a match to start chatting"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMatch ? (
                  <>
                    <ScrollArea className="h-[450px] mb-4 pr-4">
                      {isMessagingDisabled && messages.length === 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4 text-center">
                          <Lock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            As a Basic member, you can only message after the investor sends the first message.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate('/settings')}
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            Upgrade to Pro
                          </Button>
                        </div>
                      )}
                      {messages.length === 0 && !isMessagingDisabled ? (
                        <p className="text-muted-foreground text-center py-8">
                          No messages yet. Say hi! 👋
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_id === currentUserId
                                ? "justify-end"
                                : "justify-start"
                                }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 text-white ${message.sender_id === currentUserId
                                  ? "bg-zinc-900 border border-zinc-700"
                                  : "bg-zinc-800 border border-zinc-700"
                                  }`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {format(new Date(message.created_at), "HH:mm")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={messagingPlaceholder}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                        disabled={isMessagingDisabled}
                      />
                      <Button onClick={sendMessage} size="icon" disabled={isMessagingDisabled}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    Select a match from the list to view conversation
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Coffee Chats */}
        <Card className="mt-6 bg-card/95 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Coffee Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coffeeChats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming coffee chats scheduled
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coffeeChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={chat.status === 'accepted' ? 'default' : 'secondary'}>
                        {chat.status || 'pending'}
                      </Badge>
                    </div>
                    {chat.proposed_date && (
                      <p className="text-sm">
                        {format(new Date(chat.proposed_date), "PPP 'at' p")}
                      </p>
                    )}
                    {chat.meeting_location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {chat.meeting_location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ChatLimitModal
        open={showChatLimitModal}
        onOpenChange={setShowChatLimitModal}
        userType={currentUserType || 'investor'}
        isPro={isPro}
        onUpgrade={() => navigate('/settings')}
      />

      <AlertDialog open={showUnmatchConfirm} onOpenChange={setShowUnmatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch {selectedMatch ? getDisplayName(selectedMatch) : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your conversation and free up a chat slot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground">
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessConfirm} onOpenChange={setShowSuccessConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Successful Collaboration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive this conversation and mark it as a successful collaboration. You'll free up a chat slot without unmatching.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkSuccessful} className="bg-green-600 text-white">
              Mark Successful
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}