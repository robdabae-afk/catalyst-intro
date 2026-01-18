import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, TrendingUp, User, Briefcase, DollarSign, Target, Link as LinkIcon, FileText, Rocket, ExternalLink, Megaphone, CheckCircle2, Handshake, Star, X, MessageSquare, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdProfile, QueueItem } from "@/hooks/useSwipeQueue";
import { InstantMessageDialog } from "@/components/InstantMessageDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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

// Island Component for distinct sections
const Island = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-zinc-900 rounded-3xl p-5 border border-zinc-800/50 shadow-sm", // Lighter black island on pure black background
      className
    )}
  >
    {children}
  </div>
);

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
    if (cardRef.current) {
      cardRef.current.scrollTop = 0;
    }
  }, [profile]);

  // Handle button press with haptic feedback
  const handleButtonPress = (action: 'like' | 'pass' | 'message') => {
    if (swipeCooldown || adLocked) return;
    if (navigator.vibrate) navigator.vibrate(10);

    if (action === 'message') {
      onMessage?.();
    } else {
      onSwipe(action);
    }
  };

  const isAdProfile = profile.isAd === true;
  const adProfile = isAdProfile ? (profile as AdProfile) : null;
  const organicProfile = !isAdProfile ? profile : null;

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

  // Helpers
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

  const displayImage = avatarUrl || bannerUrl;
  const companyName = founderProfile?.company_name || founderProfile?.startup_name;
  const location = founderProfile?.preferred_city || investorProfile?.location;

  // Endorsements
  const EndorsementsSection = ({ endorsements = [] }: { endorsements: any[] }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-500 pl-1">
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Endorsements</span>
      </div>
      {endorsements.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {endorsements.map((endorsement) => (
            <Island key={endorsement.id} className="flex-shrink-0 w-[280px] p-5">
              <Quote className="w-6 h-6 text-[#C5A059]/80 mb-3" />
              <p className="text-sm text-zinc-300 italic leading-relaxed mb-4">"{endorsement.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{endorsement.endorserName}</p>
                  <p className="text-xs text-zinc-500">{endorsement.endorserTitle}</p>
                </div>
              </div>
            </Island>
          ))}
        </div>
      ) : (
        <Island className="py-8 border-dashed border-zinc-800">
          <div className="text-center text-zinc-500 text-sm">No endorsements yet.</div>
        </Island>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-black"> {/* Pure Black Background */}
      <Card
        ref={cardRef}
        className="relative w-full flex-1 overflow-y-auto overflow-x-hidden bg-black border-none rounded-none shadow-none mx-auto"
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
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
          <div className="relative w-full min-h-full bg-black flex flex-col pb-48">
            <video
              src={videoUrl}
              className="w-full aspect-video object-cover"
              autoPlay
              loop
              playsInline
              controls
              onError={(e) => console.error('Video load error:', e)}
            />
            <div className="p-4 space-y-4">
              <Island>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{companyName}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {founderProfile?.stage && (
                    <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700">{formatStage(founderProfile.stage)}</Badge>
                  )}
                  {founderProfile?.funding_amount && (
                    <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700">${founderProfile.funding_amount}</Badge>
                  )}
                </div>
              </Island>
            </div>
          </div>
        ) : isAdProfile && adProfile ? (
          /* Ad Profile Layout */
          <div className="min-h-full flex flex-col pb-48">
            <div className="relative h-[40vh] flex-shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              {adProfile.image_url ? (
                <img src={adProfile.image_url} alt={adProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Megaphone className="w-20 h-20 text-amber-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">{adProfile.company_name || adProfile.name}</h3>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Island>
                {(adProfile.one_liner || adProfile.description) && (
                  <p className="text-base text-zinc-300 mb-4">{adProfile.one_liner || adProfile.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {adProfile.stage && <Badge variant="outline" className="border-zinc-700 text-zinc-300">{formatStage(adProfile.stage)}</Badge>}
                  {adProfile.industry?.map((ind: string) => <Badge key={ind} className="bg-zinc-800 text-zinc-300 pointer-events-none">{ind}</Badge>)}
                </div>
              </Island>

              {adProfile.cta_url && (
                <a href={adProfile.cta_url} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                  <Button className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-lg">
                    {adProfile.cta_text || 'Learn More'} <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        ) : isShowingFounder && founderProfile ? (
          /* FOUNDER PROFILE */
          <div className="min-h-full pb-48">
            {/* Featured Badge - Sticky Top Left */}
            {isFeatured && (
              <div className="absolute top-4 left-4 z-20 w-fit">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-[#C5A059]/30">
                  <Star className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white leading-none">FEATURED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Image Section */}
            <div className="relative w-full aspect-[3/4] max-h-[55vh]">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <User className="w-24 h-24 text-zinc-800" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Location & Name Information Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-gradient-to-t from-black to-transparent">
                {location && (
                  <div className="flex items-center gap-1.5 text-zinc-300 text-sm mb-2 font-inter font-semibold uppercase">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{location}</span>
                  </div>
                )}
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-2 text-[#C5A059]">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-base font-inter font-normal">Founder @ {companyName}</span>
                </div>
              </div>

              {/* Stage Badge on Image */}
              {founderProfile?.stage && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/40 backdrop-blur-md text-white border border-white/10 px-3 py-1 text-xs tracking-wider uppercase font-inter font-semibold">
                    {formatStage(founderProfile.stage)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="px-4 py-4 space-y-4">

              {/* Industry Tags - Using Islands logic or simple horizontal scroll */}
              {founderProfile.industry && founderProfile.industry.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {founderProfile.industry.map((ind: string) => (
                    <Badge key={ind} variant="outline" className="bg-zinc-900/50 text-zinc-300 border-zinc-700 px-3 py-1.5 text-xs tracking-wide">
                      {ind}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Vitals Islands - MRR and Backed By */}
              <div className="grid grid-cols-2 gap-3">
                <Island className="flex flex-col justify-between min-h-[90px] hover:bg-zinc-800/80 transition-colors cursor-default relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest">MRR</span>
                  </div>
                  <div className="z-10">
                    <p className="text-xl sm:text-2xl font-serif font-medium text-white tracking-tight">{founderProfile.mrr || '-'}</p>
                    <div className="w-8 h-0.5 bg-[#C5A059]/50 mt-2 rounded-full"></div>
                  </div>
                  <TrendingUp className="absolute top-4 right-4 w-12 h-12 text-zinc-800/50 group-hover:text-zinc-800 transition-colors" />
                </Island>

                <Island className="flex flex-col justify-between min-h-[90px] hover:bg-zinc-800/80 transition-colors cursor-default relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Backed By</span>
                  </div>
                  <div className="z-10">
                    <p className="text-lg sm:text-xl font-serif font-medium text-white truncate">{founderProfile.backed_by || '-'}</p>
                    <div className="w-8 h-0.5 bg-[#C5A059]/50 mt-2 rounded-full"></div>
                  </div>
                  <Rocket className="absolute top-4 right-4 w-12 h-12 text-zinc-800/50 group-hover:text-zinc-800 transition-colors" />
                </Island>
              </div>

              {/* One Liner Island */}
              {founderProfile.one_liner && (
                <Island>
                  <div className="flex items-center gap-2 text-zinc-500 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Superpower</span>
                  </div>
                  <p className="text-lg sm:text-xl font-serif text-white leading-relaxed">
                    {founderProfile.one_liner}
                  </p>
                </Island>
              )}

              {/* Traction / Looking For Island */}
              {founderProfile.traction && (
                <Island>
                  <div className="flex items-center gap-2 text-zinc-500 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Looking For</span>
                  </div>
                  <p className="text-base text-zinc-300 leading-relaxed font-light">{founderProfile.traction}</p>
                </Island>
              )}

              {/* Pitch Deck Link Island */}
              {founderProfile.pitch_deck_url && founderProfile.pitch_deck_visibility === 'public' && (
                <a
                  href={founderProfile.pitch_deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block"
                >
                  <Island className="flex items-center justify-between border-dashed border-zinc-700 hover:border-[#C5A059]/50 hover:bg-zinc-900/80 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-[#C5A059]/10 transition-colors">
                        <FileText className="w-5 h-5 text-zinc-400 group-hover:text-[#C5A059]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Pitch Deck</p>
                        <p className="text-xs text-zinc-500">View presentation</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-[#C5A059]" />
                  </Island>
                </a>
              )}

              {/* Endorsements Section */}
              <EndorsementsSection endorsements={[]} />
            </div>
          </div>
        ) : investorProfile ? (
          /* INVESTOR PROFILE */
          <div className="min-h-full pb-48">
            {/* Hero Image Section */}
            <div className="relative w-full aspect-[3/4] max-h-[55vh]">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <User className="w-24 h-24 text-zinc-800" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-gradient-to-t from-black to-transparent">
                {investorProfile.location && (
                  <div className="flex items-center gap-1.5 text-zinc-300 text-sm mb-2 font-inter font-semibold uppercase">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{investorProfile.location}</span>
                  </div>
                )}
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-2 text-[#C5A059]">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-base font-inter font-normal">{investorProfile.firm_name || 'Angel Investor'}</span>
                </div>
              </div>

              {investorProfile.preferred_stage && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black/40 backdrop-blur-md text-white border border-white/10 px-3 py-1 text-xs tracking-wider uppercase">
                    {formatStage(investorProfile.preferred_stage)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="px-4 py-4 space-y-4">

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {investorStats.map((stat, idx) => (
                  <Island key={idx} className="p-3 text-center flex flex-col items-center justify-center min-h-[90px] gap-2 hover:bg-zinc-800/80 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center mb-1">
                      <stat.icon className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white leading-tight">{stat.value}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</p>
                    </div>
                  </Island>
                ))}
              </div>

              {/* Investment Thesis Island */}
              {investorProfile.investment_thesis && (
                <Island className="relative overflow-hidden">
                  <Quote className="absolute top-4 left-4 w-6 h-6 text-zinc-800" />
                  <div className="relative z-10 pt-4 px-2 pb-2 text-center">
                    <p className="text-lg sm:text-xl font-serif text-white leading-relaxed italic">
                      "{investorProfile.investment_thesis}"
                    </p>
                  </div>
                </Island>
              )}

              {/* Sectors of Interest */}
              {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                <Island>
                  <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sectors of Interest</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investorProfile.sectors_of_interest.map((sector: string) => (
                      <Badge key={sector} className="bg-black border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm px-3 py-1.5">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </Island>
              )}

              {/* Portfolio Link */}
              {investorProfile.portfolio_link && (
                <a href={investorProfile.portfolio_link} target="_blank" rel="noopener noreferrer" className="block">
                  <Island className="flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors border-dashed border-zinc-700">
                    <LinkIcon size={16} className="text-[#C5A059]" />
                    <span className="text-sm font-medium text-zinc-200">View Public Portfolio</span>
                  </Island>
                </a>
              )}

              <EndorsementsSection endorsements={[]} />
            </div>
          </div>
        ) : (
          <div className="min-h-full flex flex-col items-center justify-center pb-48">
            <User className="w-24 h-24 text-zinc-800" />
            <p className="text-zinc-600 mt-4">Profile not found</p>
          </div>
        )}
      </Card>

      {/* Floating Action Tray */}
      <div className="fixed bottom-[110px] left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="flex items-center justify-center gap-5 mx-auto max-w-xs pointer-events-auto">
          {/* Pass */}
          <button
            onClick={() => handleButtonPress('pass')}
            disabled={swipeCooldown || adLocked}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-black/80 backdrop-blur-md border border-zinc-800 shadow-2xl hover:border-red-500/50 hover:bg-red-950/20 transition-all active:scale-95"
          >
            <X className="text-zinc-400 group-hover:text-red-500" size={24} />
          </button>

          {/* Priority */}
          <button
            onClick={() => handleButtonPress('message')}
            disabled={swipeCooldown || adLocked}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-t from-[#C5A059] to-[#E5C585] shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:scale-105 transition-all active:scale-95"
          >
            <Star className="text-black fill-black" size={24} />
          </button>

          {/* Like */}
          <button
            onClick={() => handleButtonPress('like')}
            disabled={swipeCooldown || adLocked}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            <Handshake className="text-black" size={24} />
          </button>
        </div>
      </div>

      {/* Popular Prompt & Instant Message Dialog */}
      {showPopularPrompt && !isAd && profileId && (
        <Alert className="absolute top-20 left-4 right-4 z-40 bg-zinc-900/95 border-blue-900/50 text-white backdrop-blur-md animate-in slide-in-from-top-4">
          <AlertDescription className="text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-400">🔥 Trending Profile</p>
                <p className="text-xs text-zinc-400 mt-0.5">High response rate detected.</p>
              </div>
              <Button size="sm" onClick={() => { setShowPopularPrompt(false); setShowInstantMessage(true); }} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8">
                Message
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
