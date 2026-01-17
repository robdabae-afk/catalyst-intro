import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, User, Briefcase, DollarSign, Target, Link as LinkIcon, FileText, Rocket, ExternalLink, Megaphone, MessageSquare, CheckCircle2, Handshake, Star, X, MessageCircle, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdProfile, QueueItem } from "@/hooks/useSwipeQueue";
import { InstantMessageDialog } from "@/components/InstantMessageDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileMetricsLocal {
  response_rate: number;
  avg_reply_time: string;
  active_deals_count: number;
  activity_heatmap: number[];
  is_history_unlocked: boolean;
}

interface SwipeCardProps {
  profile: QueueItem;
  onSwipe: (direction: 'like' | 'pass') => void;
  onMessage?: () => void;
  userType: 'founder' | 'investor';
  isAd?: boolean;
  isPro?: boolean;
  currentUserId?: string;
  metrics?: ProfileMetricsLocal | null;
  onUnlockHistory?: () => void;
  unlockingHistory?: boolean;
  isMatch?: boolean;
  publicDeal?: any;
  swipeCooldown?: boolean;
}

// Mock endorsements data - in production this would come from database
const mockEndorsements = [
  {
    id: '1',
    text: "One of the most driven founders I've worked with. Exceptional execution.",
    endorserName: "Sarah Chen",
    endorserTitle: "Partner @ Sequoia"
  },
  {
    id: '2', 
    text: "Brilliant product vision and ability to iterate fast based on customer feedback.",
    endorserName: "Michael Ross",
    endorserTitle: "Angel Investor"
  }
];

export const SwipeCard = ({
  profile,
  onSwipe,
  onMessage,
  userType,
  isAd = false,
  isPro = false,
  currentUserId,
  metrics,
  onUnlockHistory,
  swipeCooldown = false
}: SwipeCardProps) => {
  const [adLocked, setAdLocked] = useState(isAd && !isPro);
  const [showInstantMessage, setShowInstantMessage] = useState(false);
  const [showPopularPrompt, setShowPopularPrompt] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAd && !isPro) {
      setAdLocked(true);
      const timer = setTimeout(() => setAdLocked(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setAdLocked(false);
    }
  }, [isAd, profile, isPro]);

  // Reset scroll position when profile changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [profile]);

  // Handle button press with haptic feedback and scale animation
  const handleButtonPress = (action: 'like' | 'pass' | 'message') => {
    if (swipeCooldown || adLocked) return;
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (action === 'message') {
      onMessage?.();
    } else {
      onSwipe(action);
    }
  };

  const isAdProfile = profile.isAd === true;
  const adProfile = isAdProfile ? (profile as AdProfile) : null;
  const organicProfile = !isAdProfile ? profile : null;

  // Handle both array and object formats from database
  const founderProfile = Array.isArray(organicProfile?.founder_profiles)
    ? organicProfile.founder_profiles[0]
    : organicProfile?.founder_profiles;
  const investorProfile = Array.isArray(organicProfile?.investor_profiles)
    ? organicProfile.investor_profiles[0]
    : organicProfile?.investor_profiles;

  const isShowingFounder = userType === 'investor';
  const profileData = isShowingFounder ? founderProfile : investorProfile;
  const bannerUrl = isAdProfile ? adProfile?.banner_url : profileData?.banner_url;
  const avatarUrl = organicProfile?.avatar_url;
  const profileId = organicProfile?.id;
  const profileName = organicProfile?.name || 'User';
  const instantMessageCount = (organicProfile as any)?.instant_message_count || 0;
  const isPopular = instantMessageCount >= 5;
  const isFeatured = (organicProfile as any)?.is_featured === true;

  const hasVideo = isShowingFounder && founderProfile?.video_url;
  const videoUrl = founderProfile?.video_url;

  // Helper functions
  const formatCheckSize = (size: string | null | undefined): string => {
    if (!size) return "-";
    let cleaned = size.trim();
    if (cleaned.toLowerCase().startsWith('k$')) return '$' + cleaned.substring(2) + 'k';
    if (/^\d+$/.test(cleaned)) {
      const val = parseInt(cleaned);
      if (val < 1000) return `$${val}k`;
      if (val >= 1000) return `$${val / 1000}k`;
    }
    return cleaned;
  };

  const formatStage = (stage: string | null | undefined): string => {
    if (!stage) return "";
    return stage.replace(/-/g, ' ').toUpperCase();
  };

  // Investor stats
  const investorStats = [
    { label: "Check Size", value: formatCheckSize(investorProfile?.typical_check_size), sub: "Typical Amount", icon: DollarSign },
    { label: "Focus", value: investorProfile?.preferred_stage || "-", sub: "Preferred Stage", icon: Target },
    { label: "Lead?", value: (investorProfile as any)?.leads_rounds ? "Yes" : "No", sub: "Leads Rounds", icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (!isAd && profileId && currentUserId && (userType === 'founder' || !isPro) && isPopular) {
      const shouldShow = Math.random() < 0.3;
      if (shouldShow) {
        setShowPopularPrompt(true);
        const timer = setTimeout(() => setShowPopularPrompt(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [profileId, currentUserId, userType, isPro, isPopular, isAd]);

  // Get display image - prefer avatar, then banner
  const displayImage = avatarUrl || bannerUrl;
  const companyName = founderProfile?.company_name || founderProfile?.startup_name;
  const location = founderProfile?.preferred_city || investorProfile?.location;

  // Endorsements Component
  const EndorsementsSection = ({ endorsements = [] as typeof mockEndorsements }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400">
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Endorsements</span>
      </div>
      {endorsements.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {endorsements.map((endorsement) => (
            <div 
              key={endorsement.id}
              className="flex-shrink-0 w-[280px] bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50"
            >
              <Quote className="w-6 h-6 text-[#C5A059]/60 mb-2" />
              <p className="text-sm text-zinc-300 italic leading-relaxed mb-3">
                "{endorsement.text}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{endorsement.endorserName}</p>
                  <p className="text-xs text-zinc-500">{endorsement.endorserTitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-zinc-500 text-sm">
          No endorsements yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col">
      <Card
        ref={cardRef}
        className="relative w-full flex-1 overflow-hidden bg-zinc-900 border-zinc-800 rounded-3xl shadow-2xl mx-auto"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        {/* Ad Badge */}
        {isAdProfile && (
          <div className="absolute top-4 right-4 z-20">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500"><Megaphone className="w-3 h-3 mr-1" />Ad</Badge>
          </div>
        )}
        {adLocked && <div className="absolute inset-0 z-10 bg-transparent" />}

        {/* Video Card Layout */}
        {hasVideo ? (
          <div className="relative w-full h-full bg-black flex flex-col">
            <video
              src={videoUrl}
              className="w-full flex-1 object-cover"
              autoPlay
              loop
              playsInline
              controls
              onError={(e) => console.error('Video load error:', e)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pb-8">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  {companyName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {founderProfile?.stage && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-sm">
                      {formatStage(founderProfile.stage)}
                    </Badge>
                  )}
                  {founderProfile?.funding_amount && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-sm">
                      ${founderProfile.funding_amount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : isAdProfile && adProfile ? (
          /* Ad Profile Layout */
          <div className="h-full flex flex-col">
            <div className="relative h-[40%] bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              {adProfile.image_url ? (
                <img src={adProfile.image_url} alt={adProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Megaphone className="w-20 h-20 text-amber-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">{adProfile.company_name || adProfile.name}</h3>
              </div>
            </div>
            <div ref={contentRef} className="flex-1 p-4 space-y-4 overflow-y-auto pb-8">
              {(adProfile.one_liner || adProfile.description) && (
                <p className="text-base text-zinc-300">{adProfile.one_liner || adProfile.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {adProfile.stage && <Badge variant="outline" className="border-zinc-700 text-zinc-300">{formatStage(adProfile.stage)}</Badge>}
                {adProfile.industry?.map((ind: string) => <Badge key={ind} className="bg-zinc-800 text-zinc-300">{ind}</Badge>)}
                {adProfile.sectors_of_interest?.map((sector: string) => <Badge key={sector} className="bg-zinc-800 text-zinc-300">{sector}</Badge>)}
              </div>
              {adProfile.ad_type === 'investment_fund' && adProfile.typical_check_size && (
                <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">Typical Check</span></div>
                  <p className="text-xl font-semibold text-white">{adProfile.typical_check_size}</p>
                </div>
              )}
              {adProfile.cta_url && (
                <a href={adProfile.cta_url} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black"><ExternalLink className="w-4 h-4 mr-2" />{adProfile.cta_text || 'Learn More'}</Button>
                </a>
              )}
            </div>
          </div>
        ) : isShowingFounder && founderProfile ? (
          /* FOUNDER PROFILE - Full Height Design */
          <div className="h-full flex flex-col overflow-hidden">
            {/* Featured Badge - Top Left */}
            {isFeatured && (
              <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#C5A059]/30">
                  <Star className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-serif text-white leading-none">Featured</span>
                    <span className="text-[9px] text-[#C5A059] uppercase tracking-widest leading-none mt-0.5">TOP 1% FOUNDERS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Image Section - 40% of card height with 3:4 aspect feel */}
            <div className="relative h-[45%] flex-shrink-0">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <User className="w-24 h-24 text-zinc-700" />
                </div>
              )}
              {/* Subtle dark gradient overlay at bottom for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

              {/* Stage & Location Badges - Top of image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2" style={{ marginTop: isFeatured ? '3.5rem' : 0 }}>
                {founderProfile?.stage && (
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-xs uppercase tracking-wider">
                    {formatStage(founderProfile.stage)}
                  </Badge>
                )}
                {location && (
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-xs">
                    <MapPin className="w-3 h-3 mr-1" />{location}
                  </Badge>
                )}
              </div>

              {/* Name and Company - Bottom of image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-base">Founder @ {companyName}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Section */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto bg-zinc-900 pb-44 no-scrollbar"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              <div className="p-4 space-y-5">
                {/* One-Liner Pitch - High Impact Typography */}
                {founderProfile.one_liner && (
                  <div className="py-2">
                    <p className="text-xl font-serif text-white leading-relaxed italic">
                      "{founderProfile.one_liner}"
                    </p>
                  </div>
                )}

                {/* Industry Tags - Pill Cloud */}
                {founderProfile.industry && founderProfile.industry.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {founderProfile.industry.map((ind: string) => (
                      <Badge key={ind} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-0 text-sm px-3 py-1">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Vitals Row - MRR and Backed By with glassmorphism */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/60 backdrop-blur-[10px] border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">MRR</span>
                    </div>
                    <p className="text-2xl font-serif font-semibold text-white">{founderProfile.mrr || '$0'}</p>
                  </div>
                  <div className="bg-zinc-800/60 backdrop-blur-[10px] border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800/80 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                      <Rocket className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Backed By</span>
                    </div>
                    <p className="text-base font-medium text-white truncate">{founderProfile.backed_by || 'Bootstrapped'}</p>
                  </div>
                </div>

                {/* Traction */}
                {founderProfile.traction && (
                  <div className="bg-zinc-800/40 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/30">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Traction</span>
                    </div>
                    <p className="text-base text-zinc-200">{founderProfile.traction}</p>
                  </div>
                )}

                {/* Pitch Deck Link */}
                {founderProfile.pitch_deck_url && founderProfile.pitch_deck_visibility === 'public' && (
                  <a
                    href={founderProfile.pitch_deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#C5A059] hover:text-[#D4AF6B] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Pitch Deck</span>
                  </a>
                )}

                {/* Endorsements Section */}
                <EndorsementsSection endorsements={mockEndorsements} />
              </div>
            </div>
          </div>
        ) : investorProfile ? (
          /* INVESTOR PROFILE */
          <div className="h-full flex flex-col overflow-hidden">
            {/* Background Image Section */}
            <div className="relative h-[45%] flex-shrink-0">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <User className="w-24 h-24 text-zinc-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

              {/* Stage Badge */}
              {investorProfile.preferred_stage && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-xs uppercase tracking-wider">
                    {formatStage(investorProfile.preferred_stage)}
                  </Badge>
                </div>
              )}

              {/* Name and Firm - Bottom of image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-base">{investorProfile.firm_name || 'Angel Investor'}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto bg-zinc-900 pb-44 no-scrollbar"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              <div className="p-4 space-y-5">
                {/* Investment Thesis - High Impact Quote */}
                {investorProfile.investment_thesis && (
                  <div className="py-2">
                    <p className="text-xl font-serif text-white leading-relaxed italic">
                      "{investorProfile.investment_thesis}"
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {investorStats.map((stat, idx) => (
                    <div key={idx} className="bg-zinc-800/60 backdrop-blur-sm rounded-xl p-3 border border-zinc-700/50 text-center">
                      <stat.icon className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                      <p className="text-lg font-semibold text-white">{stat.value}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Sectors of Interest */}
                {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {investorProfile.sectors_of_interest.map((sector: string) => (
                      <Badge key={sector} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-0 text-sm px-3 py-1">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Footer Links */}
                <div className="flex items-center justify-between text-sm text-zinc-400 pt-2 border-t border-zinc-800">
                  {investorProfile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} /> {investorProfile.location}
                    </div>
                  )}
                  {investorProfile.portfolio_link && (
                    <a href={investorProfile.portfolio_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#C5A059] hover:text-[#D4AF6B]">
                      <LinkIcon size={14} /> Portfolio
                    </a>
                  )}
                </div>

                {/* Endorsements Section */}
                <EndorsementsSection endorsements={mockEndorsements} />
              </div>
            </div>
          </div>
        ) : (
          /* Fallback for empty profile */
          <div className="h-full flex flex-col items-center justify-center bg-zinc-900">
            <User className="w-24 h-24 text-zinc-700" />
          </div>
        )}
      </Card>

      {/* Floating Action Tray - Fixed position above bottom nav */}
      <div className="absolute bottom-24 left-0 right-0 z-40 px-4">
        <div className="flex items-center justify-center gap-4 bg-black/60 backdrop-blur-md rounded-full py-3 px-6 border border-white/10 mx-auto max-w-xs shadow-2xl">
          {/* Pass Button */}
          <button
            onClick={() => handleButtonPress('pass')}
            disabled={swipeCooldown || adLocked}
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900/90 border border-white/10 shadow-lg hover:border-red-500/50 hover:bg-zinc-800 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <X className="text-white/70 group-hover:text-red-400 transition-colors" size={26} strokeWidth={2.5} />
          </button>
          
          {/* Priority / Instant Message Button - Center & Gold */}
          <button
            onClick={() => handleButtonPress('message')}
            disabled={swipeCooldown || adLocked}
            className="group relative flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C5A059] via-[#D4AF6B] to-[#B8956A] shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 transition-all duration-300 active:scale-95 border border-[#D4AF6B]/50 disabled:opacity-50"
          >
            <Star className="text-black fill-black" size={24} />
            <span className="absolute -bottom-6 text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">Priority</span>
          </button>
          
          {/* Connect Button */}
          <button
            onClick={() => handleButtonPress('like')}
            disabled={swipeCooldown || adLocked}
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <Handshake className="text-black group-hover:rotate-12 transition-transform duration-300" size={26} />
          </button>
        </div>
      </div>

      {/* Popular Profile Prompt */}
      {showPopularPrompt && !isAd && profileId && (
        <Alert className="absolute top-4 left-4 right-4 z-40 bg-blue-950/80 border-blue-500/30 backdrop-blur-sm">
          <AlertDescription className="text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-100">{profileName} is popular!</p>
                <p className="text-xs text-blue-300 mt-1">Send an instant message to stand out.</p>
              </div>
              <Button size="sm" onClick={() => { setShowPopularPrompt(false); setShowInstantMessage(true); }} className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-1" />Message
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Instant Message Dialog */}
      {!isAd && profileId && currentUserId && (
        <InstantMessageDialog
          open={showInstantMessage}
          onOpenChange={setShowInstantMessage}
          senderId={currentUserId}
          receiverId={profileId}
          receiverName={profileName}
          userType={userType}
          isPopular={isPopular}
          onMessageSent={() => { }}
        />
      )}
    </div>
  );
};
