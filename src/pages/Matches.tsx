import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopLayout } from "@/components/desktop/DesktopLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { useActiveConversations } from "@/hooks/useActiveConversations";
import { useWeeklyInitiations } from "@/hooks/useWeeklyInitiations";
import { useMatchMessaging } from "@/hooks/useMatchMessaging";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { usePresence, presenceOf, PresenceState } from "@/hooks/usePresence";
import { MenuDrawer } from "@/components/app/MenuDrawer";
import { BottomNav } from "@/components/app/BottomNav";
import { EndorseUserDialog } from "@/components/EndorseUserDialog";
import {
  ArrowLeft,
  Search,
  Star,
  User,
  Settings,
  Send,
  MoreVertical,
  MessageSquare,
  Eye,
  Quote,
  FileText,
  BarChart3,
  Table as TableIcon,
  Wallet,
  Briefcase,
  FileCheck,
  Calendar,
  Inbox,
  CheckCircle,
  UserX,
  CheckCheck,
  Lock,
  Crown,
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const GOLD = "#C6A02C";
const GOLD_LIGHT = "#E7CB7E";
const TEXT = "#F6F5F2";
const TEXT_DIM = "#94908A";
const GREEN = "#5EC98E";

const PAGE_BG =
  "radial-gradient(ellipse 100% 60% at 28% 6%, rgba(212,176,86,0.13) 0%, rgba(212,176,86,0) 46%), radial-gradient(ellipse 90% 50% at 88% 100%, rgba(120,92,30,0.15) 0%, rgba(120,92,30,0) 52%), linear-gradient(137deg, #0B0A07 0%, #060606 55%, #080709 100%)";

const glassCard = {
  background: "rgba(255,255,255,0.06)",
  boxShadow: "0px 14px 34px -16px rgba(0,0,0,0.85), 0px 1px 0px 1px rgba(255,255,255,0.24) inset",
  outline: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(9px)",
} as const;

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
  last_seen_at?: string | null;
}

interface Match {
  profile: Profile;
  founderProfile?: any;
  investorProfile?: any;
  matchRecord?: {
    id: string;
    status: string;
    first_message_sender_id: string | null;
    investor_stage: string | null;
  };
  lastMessage?: { content: string; created_at: string; sender_id: string } | null;
  unreadCount: number;
  weeklyCount: number;
  hasDocRequests: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read?: boolean;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24 && d.getDate() === now.getDate()) return `${hours}h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = Math.floor(ms / 86400000);
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "TODAY";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function PresenceBadge({ state }: { state: PresenceState }) {
  if (!state) return null;
  return (
    <div
      style={{
        position: "absolute",
        width: 12,
        height: 12,
        right: 0,
        bottom: 0,
        background: state === "online" ? GREEN : TEXT,
        borderRadius: 6,
        border: "2px solid #090809",
      }}
    />
  );
}

function GlassAvatar({
  url,
  presence,
  size = 48,
}: {
  url?: string | null;
  presence: PresenceState;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: "linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: "0px 1px 0px 1px rgba(255,255,255,0.24) inset",
        outline: `1px solid ${GOLD}`,
        outlineOffset: -1,
      }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" style={{ borderRadius: size / 2 }} />
      ) : (
        <User size={size * 0.45} color={GOLD} strokeWidth={1.5} />
      )}
      <PresenceBadge state={presence} />
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<'founder' | 'investor' | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChatLimitModal, setShowChatLimitModal] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);
  const [showEndorseDialog, setShowEndorseDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<"all" | "unread" | "priority" | "extra">("all");

  // Doc request dialog
  const [docRequestType, setDocRequestType] = useState<{ value: string; label: string } | null>(null);
  const [docRequestMessage, setDocRequestMessage] = useState("");
  const [docRequestSending, setDocRequestSending] = useState(false);

  // Investor pipeline stage
  const [stageSaving, setStageSaving] = useState(false);

  const PIPELINE_STAGES = [
    { value: "screening",       label: "🔍 Screening" },
    { value: "diligence",       label: "🔬 Diligence" },
    { value: "partner_meeting", label: "🤝 Partner Meeting" },
    { value: "term_sheet",      label: "📝 Term Sheet" },
    { value: "passed",          label: "❌ Passed" },
  ];

  const updateStage = async (stage: string) => {
    if (!selectedMatch?.matchRecord?.id) return;
    setStageSaving(true);
    try {
      await supabase
        .from("matches")
        .update({ investor_stage: stage } as any)
        .eq("id", selectedMatch.matchRecord.id);
      setMatches((prev) =>
        prev.map((m) =>
          m.matchRecord?.id === selectedMatch.matchRecord?.id
            ? { ...m, matchRecord: { ...m.matchRecord!, investor_stage: stage } }
            : m
        )
      );
      setSelectedMatch((prev) =>
        prev ? { ...prev, matchRecord: { ...prev.matchRecord!, investor_stage: stage } } : prev
      );
    } finally {
      setStageSaving(false);
    }
  };

  // Meeting proposal dialog
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingSending, setMeetingSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingRequests = usePendingRequests();
  usePresence(currentUserId);

  const { isPro } = useSubscription(currentUserId);
  const { canStartNew } = useActiveConversations(currentUserId, currentUserType, isPro);
  const { canInitiate, increment: useInitiation } = useWeeklyInitiations(currentUserId, isPro, currentUserType);

  const {
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

  const shouldHideInvestorInfo = useMemo(() => {
    if (currentUserType !== 'founder' || isPro) return false;
    if (!selectedMatch || selectedMatch.profile.user_type !== 'investor') return false;
    return !investorSentFirstMessage;
  }, [currentUserType, isPro, selectedMatch, investorSentFirstMessage]);

  const getDisplayName = (match: Match) => {
    if (shouldHideInvestorInfo && match.profile.user_type === 'investor') {
      return match.profile.name.split(' ')[0];
    }
    return match.profile.name;
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch && currentUserId) {
      fetchMessages(selectedMatch.profile.id);
      createOrGetMatch();
      markThreadRead(selectedMatch.profile.id);

      const channel = supabase
        .channel(`messages-${selectedMatch.profile.id}-${Math.random().toString(36).slice(2)}`)
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
            markThreadRead(selectedMatch.profile.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedMatch, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const markThreadRead = async (otherId: string) => {
    if (!currentUserId) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", otherId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
  };

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

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

      const [profilesResult, matchRecordsResult, allMessagesResult, docRequestsResult] = await Promise.all([
        supabase.from("profiles").select("*").in("id", matchedIds),
        supabase.from("matches").select("*").or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`),
        supabase
          .from("messages")
          .select("sender_id, receiver_id, content, created_at, read")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("document_requests")
          .select("requester_id, target_id")
          .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`),
      ]);

      const profiles = profilesResult.data;
      const matchRecords = matchRecordsResult.data || [];
      const allMessages = allMessagesResult.data || [];
      const docRequests = docRequestsResult.data || [];

      if (!profiles) {
        setLoading(false);
        return;
      }

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const matchesWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          let additionalProfile = null;
          if (profile.user_type === "founder") {
            const { data } = await supabase.from("founder_profiles").select("*").eq("profile_id", profile.id).single();
            additionalProfile = data;
          } else if (profile.user_type === "investor") {
            const { data } = await supabase.from("investor_profiles").select("*").eq("profile_id", profile.id).single();
            additionalProfile = data;
          }

          const matchRecord = matchRecords.find(
            m => (m.user_1_id === user.id && m.user_2_id === profile.id) ||
              (m.user_2_id === user.id && m.user_1_id === profile.id)
          );

          const threadMessages = allMessages.filter(
            (m) =>
              (m.sender_id === user.id && m.receiver_id === profile.id) ||
              (m.sender_id === profile.id && m.receiver_id === user.id)
          );
          const lastMessage = threadMessages[0] ?? null;
          const unreadCount = threadMessages.filter(
            (m) => m.sender_id === profile.id && m.read === false
          ).length;
          const weeklyCount = threadMessages.filter(
            (m) => new Date(m.created_at).getTime() > weekAgo
          ).length;
          const hasDocRequests = docRequests.some(
            (r) =>
              (r.requester_id === user.id && r.target_id === profile.id) ||
              (r.requester_id === profile.id && r.target_id === user.id)
          );

          return {
            profile,
            founderProfile: profile.user_type === "founder" ? additionalProfile : null,
            investorProfile: profile.user_type === "investor" ? additionalProfile : null,
            matchRecord: matchRecord ? {
              id: matchRecord.id,
              status: matchRecord.status,
              first_message_sender_id: matchRecord.first_message_sender_id,
              investor_stage: (matchRecord as any).investor_stage ?? null,
            } : undefined,
            lastMessage,
            unreadCount,
            weeklyCount,
            hasDocRequests,
          } as Match;
        })
      );

      const activeMatches = matchesWithDetails
        .filter(m => !m.matchRecord || m.matchRecord.status === 'active')
        .sort((a, b) => {
          const at = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
          const bt = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
          return bt - at;
        });

      setMatches(activeMatches);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
      setLoading(false);
    }
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !currentUserId) return;

    if (currentUserType === 'founder' && !isPro && !canSendMessage && messages.length === 0) {
      toast.error("Wait for the investor to message you first, or upgrade to Pro");
      return;
    }

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
      await createOrGetMatch();
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: selectedMatch.profile.id,
        content: newMessage.trim(),
      });
      if (error) throw error;

      if (isFirstMessage) {
        await recordFirstMessage(currentUserId);
        await fetchMatches();
      }

      setNewMessage("");
      fetchMessages(selectedMatch.profile.id);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const submitDocRequest = async () => {
    if (!docRequestType || !selectedMatch || !currentUserId) return;
    setDocRequestSending(true);
    const { error } = await supabase.from("document_requests").insert({
      requester_id: currentUserId,
      target_id: selectedMatch.profile.id,
      request_type: docRequestType.value,
      message: docRequestMessage.trim() || null,
    });
    setDocRequestSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Request sent to ${getDisplayName(selectedMatch)}`);
    setDocRequestType(null);
    setDocRequestMessage("");
  };

  const submitMeeting = async () => {
    if (!selectedMatch || !currentUserId || !meetingDate || !meetingTime) {
      toast.error("Pick a date and time");
      return;
    }
    setMeetingSending(true);
    const proposedIso = new Date(`${meetingDate}T${meetingTime}`).toISOString();
    const isFounder = currentUserType === "founder";
    const { error } = await supabase.from("coffee_chats").insert({
      founder_id: isFounder ? currentUserId : selectedMatch.profile.id,
      investor_id: isFounder ? selectedMatch.profile.id : currentUserId,
      proposed_date: proposedIso,
      meeting_location: meetingLocation.trim() || null,
      status: "pending",
    });
    if (error) {
      setMeetingSending(false);
      toast.error(error.message);
      return;
    }
    // Drop a note in the chat so the other side sees the proposal
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedMatch.profile.id,
      content: `📅 Proposed a meeting: ${new Date(proposedIso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })}${meetingLocation.trim() ? ` — ${meetingLocation.trim()}` : ""}`,
    });
    setMeetingSending(false);
    setMeetingOpen(false);
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLocation("");
    toast.success("Meeting proposed");
    if (selectedMatch) fetchMessages(selectedMatch.profile.id);
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
    if (!canStartNew && !match.matchRecord) {
      setShowChatLimitModal(true);
      return;
    }
    setSelectedMatch(match);
  };

  const handleBackToList = () => {
    setSelectedMatch(null);
    setMessages([]);
    fetchMatches();
  };

  const isMessagingDisabled = currentUserType === 'founder' && !isPro && !canSendMessage && messages.length === 0;

  const isPriority = (m: Match) => m.weeklyCount >= 5;

  const subtitleFor = (m: Match) => {
    if (m.profile.user_type === "investor") {
      const ip = m.investorProfile;
      const role = ip?.position || "Investor";
      const rest = ip?.firm_name || (ip?.typical_check_size ? `Writes ${ip.typical_check_size}` : "");
      return { role, rest };
    }
    const fp = m.founderProfile;
    const parts = [fp?.startup_name, fp?.stage].filter(Boolean).join(" · ");
    return { role: "Founder", rest: parts };
  };

  const waitingCount = matches.filter((m) => m.unreadCount > 0).length;

  const filteredMatches = matches.filter((m) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const s = subtitleFor(m);
      if (
        !m.profile.name.toLowerCase().includes(q) &&
        !s.rest.toLowerCase().includes(q)
      )
        return false;
    }
    if (chip === "unread") return m.unreadCount > 0;
    if (chip === "priority") return isPriority(m);
    if (chip === "extra") {
      // Founder: "Intro'd" = conversation underway; Investor: "Diligence" = doc requests exchanged
      return currentUserType === "founder" ? !!m.lastMessage : m.hasDocRequests;
    }
    return true;
  });

  const priorityMatches = filteredMatches.filter(isPriority);
  const otherMatches = filteredMatches.filter((m) => !isPriority(m));

  // ---------- Desktop ----------
  if (!isMobile) {
    const currentUser = {
      id: currentUserId,
      user_type: currentUserType,
      name: currentUserName,
      avatar_url: currentUserAvatar
    };
    if (!currentUserId) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    return <DesktopLayout currentUser={currentUser} isPro={isPro} />;
  }

  // ---------- Mobile: thread view ----------
  if (selectedMatch) {
    const presence = presenceOf((selectedMatch.profile as any).last_seen_at);
    const firstName = getDisplayName(selectedMatch).split(" ")[0];
    const isInvestorCounterpart = selectedMatch.profile.user_type === "investor";
    const ip = selectedMatch.investorProfile;
    const fp = selectedMatch.founderProfile;

    const stats = isInvestorCounterpart
      ? [
        { label: "Firm", value: ip?.firm_name || "—" },
        { label: "Check", value: ip?.typical_check_size || "—" },
        { label: "Type", value: ip?.investor_type || "—" },
      ]
      : [
        { label: "Company", value: fp?.startup_name || "—" },
        { label: "Raising", value: fp?.funding_amount || "—" },
        { label: "MRR", value: fp?.mrr || "—" },
      ];

    const docRequestTypes = currentUserType === "investor"
      ? [
        { value: "pitch_deck", label: "Pitch deck", icon: FileText },
        { value: "financials", label: "Financials", icon: BarChart3 },
        { value: "cap_table", label: "Cap table", icon: TableIcon },
      ]
      : [
        { value: "proof_of_funds", label: "Proof of funds", icon: Wallet },
        { value: "investment_portfolio", label: "Investment portfolio", icon: Briefcase },
        { value: "term_sheet", label: "Term sheet", icon: FileCheck },
      ];

    // Group messages by day
    const groups: { label: string; items: Message[] }[] = [];
    for (const msg of messages) {
      const label = dayLabel(msg.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(msg);
      else groups.push({ label, items: [msg] });
    }

    const lastOwnMessage = [...messages].reverse().find((m) => m.sender_id === currentUserId);
    const lastOwnRead = lastOwnMessage && (lastOwnMessage as any).read === true;

    const menuItemCls = "text-[13px] focus:bg-white/10 focus:text-white";

    return (
      <div className="min-h-[100dvh] flex flex-col px-[22px]" style={{ background: PAGE_BG }}>
        {/* Header card */}
        <div className="pt-[54px]">
          <div className="rounded-[20px] overflow-hidden" style={glassCard}>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <button onClick={handleBackToList} aria-label="Back" className="shrink-0 p-1 -ml-1">
                <ArrowLeft size={19} color={TEXT} strokeWidth={1.6} />
              </button>
              <GlassAvatar url={selectedMatch.profile.avatar_url} presence={presence} />
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>
                  {getDisplayName(selectedMatch)}
                </p>
                <div className="flex items-center gap-2">
                  <p style={{ color: presence === "online" ? GREEN : TEXT_DIM, fontSize: 11 }}>
                    {presence === "online" ? "Online" : presence === "recent" ? "Active recently" : "Offline"}
                  </p>
                  {currentUserType === "investor" && selectedMatch.matchRecord?.investor_stage && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(198,160,44,0.15)", color: GOLD_LIGHT, border: "1px solid rgba(198,160,44,0.3)" }}
                    >
                      {PIPELINE_STAGES.find((s) => s.value === selectedMatch.matchRecord?.investor_stage)?.label ?? selectedMatch.matchRecord.investor_stage}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5" aria-label="Conversation menu">
                    <MoreVertical size={17} color={TEXT_DIM} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-0"
                  style={{
                    background: "linear-gradient(138deg, rgba(30,29,26,0.98) 0%, rgba(16,15,14,0.98) 100%)",
                    outline: "1px solid rgba(255,255,255,0.12)",
                    color: TEXT,
                  }}
                >
                  <DropdownMenuItem
                    className={menuItemCls}
                    disabled={shouldHideInvestorInfo}
                    onClick={() => navigate(`/profile/${selectedMatch.profile.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" style={{ color: GOLD }} />
                    View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className={menuItemCls} onClick={() => setShowEndorseDialog(true)}>
                    <Quote className="mr-2 h-4 w-4" style={{ color: GOLD }} />
                    Endorse
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {docRequestTypes.map((t) => (
                    <DropdownMenuItem
                      key={t.value}
                      className={menuItemCls}
                      onClick={() => setDocRequestType({ value: t.value, label: t.label })}
                    >
                      <t.icon className="mr-2 h-4 w-4" style={{ color: GOLD }} />
                      Request {t.label.toLowerCase()}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem className={menuItemCls} onClick={() => navigate("/requests")}>
                    <Inbox className="mr-2 h-4 w-4" style={{ color: GOLD }} />
                    Requests & approvals
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className={menuItemCls} onClick={() => setMeetingOpen(true)}>
                    <Calendar className="mr-2 h-4 w-4" style={{ color: GOLD }} />
                    Propose a meeting
                  </DropdownMenuItem>
                  {currentUserType === "investor" && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {PIPELINE_STAGES.map((s) => (
                        <DropdownMenuItem
                          key={s.value}
                          className={menuItemCls}
                          disabled={stageSaving}
                          onClick={() => updateStage(s.value)}
                          style={
                            selectedMatch.matchRecord?.investor_stage === s.value
                              ? { color: GOLD }
                              : undefined
                          }
                        >
                          <span className="mr-2 text-xs">{selectedMatch.matchRecord?.investor_stage === s.value ? "✓" : " "}</span>
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {currentUserType === 'investor' && isPro && matchStatus === 'active' && (
                    <DropdownMenuItem className={menuItemCls} onClick={() => setShowSuccessConfirm(true)}>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Mark successful
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="text-[13px] text-red-400 focus:bg-white/10 focus:text-red-400"
                    onClick={() => setShowUnmatchConfirm(true)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Unmatch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Context stats */}
            <div className="flex gap-3.5 px-3.5 py-[11px]" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {stats.map((s) => (
                <div key={s.label} className="flex-1 min-w-0">
                  <p style={{ color: TEXT_DIM, fontSize: 9.5, letterSpacing: 0.95, textTransform: "uppercase" }}>
                    {s.label}
                  </p>
                  <p className="truncate" style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {shouldHideInvestorInfo ? "Hidden" : s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {isMessagingDisabled && messages.length === 0 && (
            <div
              className="rounded-2xl p-4 mb-4 text-center"
              style={{ background: "rgba(198,160,44,0.08)", outline: "1px solid rgba(198,160,44,0.32)" }}
            >
              <Lock className="w-5 h-5 mx-auto mb-2" color={GOLD_LIGHT} />
              <p style={{ color: GOLD_LIGHT, fontSize: 12.5, lineHeight: 1.5 }}>
                As a Basic member, you can only message after the investor sends the first message.
              </p>
              <button
                className="mt-3 px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                style={{ background: GOLD, color: "#2A2005", fontSize: 12.5, fontWeight: 600 }}
                onClick={() => navigate('/settings')}
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            </div>
          )}
          {messages.length === 0 && !isMessagingDisabled ? (
            <p className="text-center py-8" style={{ color: TEXT_DIM, fontSize: 13 }}>
              No messages yet. Say hi 👋
            </p>
          ) : (
            <div className="space-y-2.5">
              {groups.map((group) => (
                <div key={group.label} className="space-y-2.5">
                  <p
                    className="text-center pt-2"
                    style={{ color: TEXT_DIM, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" }}
                  >
                    {group.label}
                  </p>
                  {group.items.map((message) => {
                    const own = message.sender_id === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[78%] px-3.5 py-[10px]"
                          style={
                            own
                              ? {
                                background: "linear-gradient(176deg, rgba(255,255,255,0.19) 0%, rgba(255,255,255,0.09) 100%)",
                                outline: "1px solid rgba(255,255,255,0.26)",
                                borderRadius: "19px 19px 6px 19px",
                              }
                              : {
                                background: "rgba(255,255,255,0.04)",
                                outline: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "19px 19px 19px 6px",
                              }
                          }
                        >
                          <p style={{ color: own ? TEXT : "#DED9CF", fontSize: 13.5, lineHeight: "19.6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {message.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {lastOwnRead && (
                <div className="flex justify-end items-center gap-1 pr-1">
                  <CheckCheck size={12} color={TEXT_DIM} />
                  <span style={{ color: TEXT_DIM, fontSize: 10 }}>
                    Read {new Date(lastOwnMessage!.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="pb-6 pt-1">
          <div
            className="flex items-center gap-2 pl-4 pr-[7px] py-[7px] rounded-[26px] overflow-hidden"
            style={glassCard}
          >
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isMessagingDisabled ? "Waiting for their first message…" : `Message ${firstName}`}
              disabled={isMessagingDisabled}
              className="flex-1 min-w-0 bg-transparent outline-none"
              style={{ color: TEXT, fontSize: 13.5 }}
            />
            <button
              onClick={sendMessage}
              disabled={isMessagingDisabled}
              aria-label="Send"
              className="flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "radial-gradient(ellipse 120% 120% at 30% 20%, #E7CB7E 0%, #C6A02C 100%)",
              }}
            >
              <Send size={16} color="#2A2005" strokeWidth={1.9} />
            </button>
          </div>
        </div>

        {/* Doc request dialog */}
        <Dialog open={!!docRequestType} onOpenChange={(v) => !v && setDocRequestType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request {docRequestType?.label.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Send a {docRequestType?.label.toLowerCase()} request to {getDisplayName(selectedMatch)}. They can approve or decline from their Requests dashboard.
              </p>
              <Textarea
                placeholder="Add a message (optional)…"
                value={docRequestMessage}
                onChange={(e) => setDocRequestMessage(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocRequestType(null)}>Cancel</Button>
              <Button onClick={submitDocRequest} disabled={docRequestSending}>
                {docRequestSending ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Meeting dialog */}
        <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose a meeting</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Propose a time to {getDisplayName(selectedMatch)}. It appears in the chat and in their meeting requests.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-date">Date</Label>
                  <Input id="meeting-date" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="meeting-time">Time</Label>
                  <Input id="meeting-time" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meeting-location">Location or video link (optional)</Label>
                <Input
                  id="meeting-location"
                  placeholder="Google Meet / Zoom link, or a place"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMeetingOpen(false)}>Cancel</Button>
              <Button onClick={submitMeeting} disabled={meetingSending}>
                {meetingSending ? "Sending…" : "Propose meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <EndorseUserDialog
          isOpen={showEndorseDialog}
          onClose={() => setShowEndorseDialog(false)}
          targetUserId={selectedMatch.profile.id}
          targetUserName={getDisplayName(selectedMatch)}
        />
      </div>
    );
  }

  // ---------- Mobile: list view ----------
  const oppositeLabel = currentUserType === "founder" ? "investors" : "founders";

  const renderRow = (m: Match) => {
    const s = subtitleFor(m);
    const presence = presenceOf((m.profile as any).last_seen_at);
    const unread = m.unreadCount > 0;
    const preview = m.lastMessage
      ? `${m.lastMessage.sender_id === currentUserId ? "You: " : ""}${m.lastMessage.content}`
      : "New match — say hi";
    return (
      <button
        key={m.profile.id}
        onClick={() => handleSelectMatch(m)}
        className="w-full flex items-center gap-3 px-0.5 py-3 text-left"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <GlassAvatar url={m.profile.avatar_url} presence={presence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate" style={{ color: TEXT, fontSize: 15.5, fontWeight: 700 }}>
                {m.profile.name}
              </span>
              {isPriority(m) && <Star size={13} color={GOLD} fill={GOLD} className="shrink-0" />}
              {currentUserType === "investor" && m.matchRecord?.investor_stage && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(198,160,44,0.12)", color: GOLD_LIGHT }}
                >
                  {PIPELINE_STAGES.find((s) => s.value === m.matchRecord?.investor_stage)?.label.split(" ").slice(1).join(" ") ?? m.matchRecord.investor_stage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span style={{ color: TEXT_DIM, fontSize: 11 }}>
                {m.lastMessage ? timeAgo(m.lastMessage.created_at) : ""}
              </span>
              {unread && <div style={{ width: 8, height: 8, background: TEXT, borderRadius: 4 }} />}
            </div>
          </div>
          <p className="truncate" style={{ fontSize: 11, marginTop: 1 }}>
            <span style={{ color: "#B9B4A9", fontWeight: 600 }}>{s.role}</span>
            {s.rest && <span style={{ color: TEXT_DIM }}> · {s.rest}</span>}
          </p>
          <p className="truncate" style={{ color: unread ? TEXT : TEXT_DIM, fontSize: 13, marginTop: 2, lineHeight: "17.5px" }}>
            {preview}
          </p>
        </div>
      </button>
    );
  };

  const chips: { key: typeof chip; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "priority", label: "Priority" },
    { key: "extra", label: currentUserType === "investor" ? "Diligence" : "Intro'd" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col px-[22px]" style={{ background: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-[54px]">
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "2.38px", fontFamily: "Inter, sans-serif" }}>
          <span style={{ color: TEXT }}>CAT</span>
          <span style={{ color: GOLD }}>A</span>
          <span style={{ color: TEXT }}>LYST</span>
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            background: "linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "0px 1px 0px 1px rgba(255,255,255,0.24) inset",
            outline: `1px solid ${GOLD}`,
            outlineOffset: -1,
            backdropFilter: "blur(10px)",
          }}
        >
          {currentUserAvatar ? (
            <img src={currentUserAvatar} alt="Me" className="w-full h-full object-cover" />
          ) : (
            <Settings size={18} color={GOLD} strokeWidth={1.6} />
          )}
        </button>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 pt-3.5">
        <MessageSquare size={22} color={GOLD} strokeWidth={1.65} />
        <h1 style={{ color: TEXT, fontSize: 28, fontWeight: 600, fontFamily: "Fraunces, serif" }}>Messages</h1>
      </div>
      <p className="pb-2.5" style={{ color: TEXT_DIM, fontSize: 12.5, marginTop: 4 }}>
        {waitingCount > 0 ? `${waitingCount} ${oppositeLabel} waiting on you` : loading ? " " : matches.length === 0 ? "No conversations yet" : "You're all caught up"}
      </p>

      {/* Search */}
      <div className="flex items-center gap-2.5 px-[15px] rounded-[15px]" style={{ ...glassCard, height: 46 }}>
        <Search size={17} color={TEXT_DIM} strokeWidth={1.35} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations"
          className="flex-1 min-w-0 bg-transparent outline-none"
          style={{ color: TEXT, fontSize: 14 }}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-[7px] pt-2.5 pb-3">
        {chips.map((c) => {
          const active = chip === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setChip(c.key)}
              className="h-[30px] px-3 rounded-full"
              style={{
                background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                outline: `1px solid ${active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)"}`,
                outlineOffset: -1,
                color: active ? TEXT : TEXT_DIM,
                fontSize: active ? 11 : 12,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative pb-[11px]">
          <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>Messages</span>
          <div className="absolute left-0 bottom-0" style={{ width: 55, height: 2, background: TEXT, borderRadius: 2 }} />
        </div>
        <button className="flex items-center gap-[7px] pb-[11px]" onClick={() => navigate("/requests")}>
          <span style={{ color: TEXT_DIM, fontSize: 13 }}>Requests</span>
          {pendingRequests > 0 && (
            <span
              className="flex items-center justify-center rounded-full px-1.5"
              style={{ minWidth: 19, height: 19, background: "rgba(255,255,255,0.13)", color: TEXT, fontSize: 11 }}
            >
              {pendingRequests}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center pt-16">
            <div className="w-8 h-8 border-2 border-[#C6A02C]/30 border-t-[#C6A02C] rounded-full animate-spin" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center pt-[110px] text-center">
            <div className="flex items-center justify-center mb-5" style={{ width: 84, height: 84, borderRadius: 42, ...glassCard }}>
              <MessageSquare size={32} color={GOLD_LIGHT} strokeWidth={2} />
            </div>
            <p style={{ color: TEXT, fontSize: 21, fontWeight: 600, fontFamily: "Fraunces, serif" }}>
              No conversations yet
            </p>
            <p className="mt-2 max-w-[280px]" style={{ color: TEXT_DIM, fontSize: 13.5, lineHeight: "21.6px" }}>
              Conversations start once a connection is accepted. Head to Discover and send a few requests.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 flex items-center justify-center"
              style={{
                width: 210,
                height: 44,
                borderRadius: 13,
                background: "linear-gradient(175deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                outline: "1px solid rgba(198,160,44,0.35)",
                outlineOffset: -1,
                color: GOLD_LIGHT,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Go to Discover
            </button>
          </div>
        ) : (
          <div className="pt-3">
            {priorityMatches.length > 0 && (
              <>
                <div className="flex items-center gap-[7px]">
                  <Star size={12} color={GOLD} fill={GOLD} />
                  <span style={{ color: GOLD, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" }}>
                    Priority
                  </span>
                </div>
                {priorityMatches.map(renderRow)}
                {otherMatches.length > 0 && (
                  <p className="pt-[18px]" style={{ color: TEXT_DIM, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" }}>
                    All conversations
                  </p>
                )}
              </>
            )}
            {otherMatches.map(renderRow)}
          </div>
        )}
      </div>

      <BottomNav userType={currentUserType} />
      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userType={currentUserType}
        userId={currentUserId ?? undefined}
        isPro={isPro}
      />

      {/* Chat limit modal */}
      <AlertDialog open={showChatLimitModal} onOpenChange={setShowChatLimitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chat Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              {currentUserType === 'founder'
                ? "You can only have 1 active conversation at a time. Unmatch your current conversation to start a new one, or upgrade to Pro for unlimited chats."
                : isPro
                  ? "You've reached the maximum of 10 active conversations. Unmatch or mark a collaboration as successful to free up a slot."
                  : "You can only have 2 active conversations at a time. Unmatch a conversation or upgrade to Pro for 10 active chats."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {!isPro && (
              <AlertDialogAction onClick={() => navigate('/settings')}>
                Upgrade to Pro
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
