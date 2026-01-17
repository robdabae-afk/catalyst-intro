import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, User, Briefcase, DollarSign, Target, Link as LinkIcon, FileText, Rocket, ExternalLink, Megaphone, MessageSquare, CheckCircle2, Lock, Quote, Handshake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdProfile, QueueItem } from "@/hooks/useSwipeQueue";
import { InstantMessageDialog } from "@/components/InstantMessageDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileMetrics } from "@/components/FeaturedCard";

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
  userType: 'founder' | 'investor';
  isAd?: boolean;
  isPro?: boolean;
  currentUserId?: string;
  metrics?: ProfileMetricsLocal | null;
  onUnlockHistory?: () => void;
  unlockingHistory?: boolean;
  isMatch?: boolean;
  publicDeal?: any;
}

export const SwipeCard = ({
  profile,
  onSwipe,
  userType,
  isAd = false,
  isPro = false,
  currentUserId,
  metrics,
  onUnlockHistory
}: SwipeCardProps) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);
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

  useEffect(() => {
    setDragDirection(null);
    setDragOffset({ x: 0, y: 0 });
    setDragStart(null);
    setIsDragging(false);
  }, [profile]);

  const handleDragStart = (clientX: number, clientY: number, target: EventTarget) => {
    if (adLocked) return;
    const contentElement = contentRef.current;
    if (contentElement && contentElement.contains(target as Node)) {
      const isScrollable = contentElement.scrollHeight > contentElement.clientHeight;
      if (isScrollable) return;
    }
    setDragStart({ x: clientX, y: clientY });
    setDragDirection(null);
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || adLocked) return;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    if (!dragDirection && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
      const isHorizontal = angle < 30 || angle > 150;
      setDragDirection(isHorizontal ? 'horizontal' : 'vertical');
      if (!isHorizontal) {
        setIsDragging(false); setDragStart(null); setDragOffset({ x: 0, y: 0 }); return;
      }
    }
    if (dragDirection === 'horizontal') setDragOffset({ x: deltaX, y: 0 });
  };

  const handleDragEnd = () => {
    if (!dragStart || adLocked || dragDirection !== 'horizontal') {
      setDragStart(null); setDragOffset({ x: 0, y: 0 }); setIsDragging(false); setDragDirection(null); return;
    }
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? 'like' : 'pass');
    }
    setDragStart(null); setDragOffset({ x: 0, y: 0 }); setIsDragging(false); setDragDirection(null);
  };

  const rotation = dragOffset.x / 20;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

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

  // Portfolio state (currently not fetched due to missing tables)
  interface PortfolioItem {
    id: string;
    company_name: string;
    investment_year: number | null;
    sector: string | null;
    investment_stage: string | null;
    is_lead: boolean | null;
    company_image_url: string | null;
  }
  const [portfolio] = useState<PortfolioItem[]>([]);

  // Deal flow state (currently not fetched due to missing tables)
  interface DealFlowItem {
    id: string;
    startup_name: string;
    amount: string | null;
    stage: string | null;
    key_co_investors: string | null;
    verticals: string[] | null;
    notes: string | null;
    status: string | null;
  }
  const [dealFlow] = useState<DealFlowItem[]>([]);

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

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-md mx-auto h-[480px] sm:h-[600px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl overflow-hidden bg-zinc-900 border-zinc-800"
        style={{
          transform: `translateX(${dragOffset.x}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging && dragDirection === 'horizontal' ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
          touchAction: 'pan-y'
        }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY, e.target)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target)}
        onTouchMove={(e) => {
          if (isDragging && dragDirection === 'horizontal') e.preventDefault();
          handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleDragEnd}
      >
        {/* Ad Badge */}
        {isAdProfile && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500"><Megaphone className="w-3 h-3 mr-1" />Ad</Badge>
          </div>
        )}
        {adLocked && <div className="absolute inset-0 z-10 bg-transparent" />}

        {/* Video Card Layout */}
        {hasVideo ? (
          <div className="relative w-full h-full bg-black">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              controls
              onError={(e) => console.error('Video load error:', e)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:p-6 pb-20 sm:pb-24">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-2xl font-bold text-white">
                  {companyName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {founderProfile?.stage && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs sm:text-sm">
                      {formatStage(founderProfile.stage)}
                    </Badge>
                  )}
                  {founderProfile?.funding_amount && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs sm:text-sm">
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
            <div className="relative h-40 sm:h-52 bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              {adProfile.image_url ? (
                <img src={adProfile.image_url} alt={adProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Megaphone className="w-16 h-16 text-amber-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{adProfile.company_name || adProfile.name}</h3>
              </div>
            </div>
            <CardContent ref={contentRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
              {(adProfile.one_liner || adProfile.description) && (
                <p className="text-sm text-zinc-300">{adProfile.one_liner || adProfile.description}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {adProfile.stage && <Badge variant="outline" className="border-zinc-700 text-zinc-300">{formatStage(adProfile.stage)}</Badge>}
                {adProfile.industry?.map((ind: string) => <Badge key={ind} className="bg-zinc-800 text-zinc-300">{ind}</Badge>)}
                {adProfile.sectors_of_interest?.map((sector: string) => <Badge key={sector} className="bg-zinc-800 text-zinc-300">{sector}</Badge>)}
              </div>
              {adProfile.ad_type === 'investment_fund' && adProfile.typical_check_size && (
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs uppercase tracking-wider">Typical Check</span></div>
                  <p className="text-lg font-semibold text-white">{adProfile.typical_check_size}</p>
                </div>
              )}
              {adProfile.cta_url && (
                <a href={adProfile.cta_url} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black"><ExternalLink className="w-4 h-4 mr-2" />{adProfile.cta_text || 'Learn More'}</Button>
                </a>
              )}
            </CardContent>
          </div>
        ) : isShowingFounder && founderProfile ? (
          /* FOUNDER PROFILE - New Design matching reference */
          <div className="h-full flex flex-col">
            {/* Featured Badge - Top Left */}
            {isFeatured && (
              <div className="absolute top-3 left-3 z-20">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-[#C5A059]/30">
                  <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-serif text-white leading-none">Featured</span>
                    <span className="text-[8px] text-[#C5A059] uppercase tracking-widest leading-none mt-0.5">TOP 1% FOUNDERS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Background Image Section */}
            <div className="relative h-56 sm:h-72 flex-shrink-0">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <User className="w-20 h-20 text-zinc-700" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

              {/* Stage & Location Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                {!isFeatured && founderProfile?.stage && (
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-[10px] sm:text-xs uppercase tracking-wider">
                    {formatStage(founderProfile.stage)}
                  </Badge>
                )}
                {isFeatured && founderProfile?.stage && (
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-[10px] sm:text-xs uppercase tracking-wider mt-12">
                    {formatStage(founderProfile.stage)}
                  </Badge>
                )}
                {location && (
                  <Badge className={`bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-[10px] sm:text-xs ${isFeatured ? 'mt-12' : ''}`}>
                    <MapPin className="w-3 h-3 mr-1" />{location}
                  </Badge>
                )}
              </div>

              {/* Name and Company - Bottom of image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-sm">Founder @ {companyName}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <CardContent
              ref={contentRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto bg-zinc-900"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              {/* Industry Tags */}
              {founderProfile.industry && founderProfile.industry.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {founderProfile.industry.map((ind: string) => (
                    <Badge key={ind} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-0 text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              )}

              {/* MRR and Backed By Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 hover:bg-zinc-800/70 transition-colors">
                  <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">MRR</span>
                  </div>
                  <p className="text-xl font-serif font-semibold text-white">{founderProfile.mrr || '$0'}</p>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 hover:bg-zinc-800/70 transition-colors">
                  <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                    <Rocket className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Backed By</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{founderProfile.backed_by || '-'}</p>
                </div>
              </div>

              {/* One-liner */}
              {founderProfile.one_liner && (
                <p className="text-sm text-zinc-400 leading-relaxed">{founderProfile.one_liner}</p>
              )}

              {/* Traction */}
              {founderProfile.traction && (
                <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Traction</p>
                  <p className="text-xs text-zinc-300 line-clamp-2">{founderProfile.traction}</p>
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
            </CardContent>
          </div>
        ) : investorProfile ? (
          /* INVESTOR PROFILE */
          <div className="h-full flex flex-col">
            {/* Background Image Section */}
            <div className="relative h-48 sm:h-56 flex-shrink-0">
              {displayImage ? (
                <img src={displayImage} alt={profileName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <User className="w-20 h-20 text-zinc-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

              {/* Stage Badge */}
              {investorProfile.preferred_stage && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm text-white border-0 text-[10px] sm:text-xs uppercase tracking-wider">
                    {formatStage(investorProfile.preferred_stage)}
                  </Badge>
                </div>
              )}

              {/* Name and Firm - Bottom of image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight mb-1">
                  {profileName}
                </h2>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-sm">{investorProfile.firm_name || 'Angel Investor'}</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <CardContent
              ref={contentRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto bg-zinc-900"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {investorStats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-2 bg-zinc-800/50 rounded-lg text-center border border-zinc-700/50">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{stat.label}</span>
                    <p className="text-sm font-bold text-white truncate w-full">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Sectors */}
              {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {investorProfile.sectors_of_interest.map((sector: string) => (
                    <Badge key={sector} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-0 text-xs">{sector}</Badge>
                  ))}
                </div>
              )}

              {/* Recent Investments */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                  <Handshake size={12} /> Recent Investments
                </h4>
                {portfolio.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No public investment history.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-white">{portfolio[0].company_name}</span>
                        {portfolio[0].is_lead && <Badge variant="outline" className="text-[9px] h-4 border-zinc-600">Lead</Badge>}
                      </div>
                      <p className="text-[10px] text-zinc-500">{portfolio[0].investment_year ? `Inv. ${portfolio[0].investment_year}` : 'Undisclosed'} • {portfolio[0].investment_stage || 'Stage N/A'}</p>
                    </div>
                    {portfolio.length > 1 && (
                      <div className="relative">
                        {metrics?.is_history_unlocked ? (
                          <div className="space-y-2">
                            {portfolio.slice(1).map(item => (
                              <div key={item.id} className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50">
                                <div className="flex justify-between items-start">
                                  <span className="text-sm font-bold text-white">{item.company_name}</span>
                                  {item.is_lead && <Badge variant="outline" className="text-[9px] h-4 border-zinc-600">Lead</Badge>}
                                </div>
                                <p className="text-[10px] text-zinc-500">{item.investment_year ? `Inv. ${item.investment_year}` : ''} • {item.investment_stage || 'N/A'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="blur-sm opacity-50 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 select-none">
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-bold text-white">Hidden Co.</span>
                                <Badge variant="outline" className="text-[9px] h-4 border-zinc-600">Follow-on</Badge>
                              </div>
                              <p className="text-[10px] text-zinc-500">2023 • Series A</p>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Button size="sm" variant="secondary" className="h-6 text-[10px] bg-zinc-700 hover:bg-zinc-600" onClick={onUnlockHistory}>
                                <Lock size={10} className="mr-1" /> Unlock
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deal Flow */}
              {dealFlow.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                    <Target size={12} /> Currently Looking At
                  </h4>
                  <div className="space-y-1.5">
                    {dealFlow.map(deal => (
                      <div key={deal.id} className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{deal.startup_name}</span>
                            {deal.stage && <span className="text-[9px] bg-zinc-700 px-1.5 rounded text-zinc-400 uppercase">{deal.stage}</span>}
                          </div>
                          {deal.amount && <span className="text-[10px] text-emerald-400 font-mono">{deal.amount}</span>}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment Thesis */}
              {investorProfile.investment_thesis && (
                <div className="bg-zinc-800/30 rounded-lg p-3 relative border border-zinc-700/30">
                  <Quote className="absolute top-2 left-2 text-zinc-700 w-4 h-4 rotate-180" />
                  <p className="text-xs text-center italic pt-2 px-2 pb-1 text-zinc-400">"{investorProfile.investment_thesis}"</p>
                </div>
              )}

              {/* Footer Links */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                {investorProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} /> {investorProfile.location}
                  </div>
                )}
                {investorProfile.portfolio_link && (
                  <a href={investorProfile.portfolio_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#C5A059] hover:text-[#D4AF6B]">
                    <LinkIcon size={12} /> Portfolio
                  </a>
                )}
              </div>
            </CardContent>
          </div>
        ) : (
          /* Fallback for empty profile */
          <div className="h-full flex items-center justify-center bg-zinc-900">
            <User className="w-20 h-20 text-zinc-700" />
          </div>
        )}

        {/* Swipe Indicators */}
        <div className="absolute top-24 left-4 text-4xl font-bold text-red-500 opacity-0 rotate-[-20deg] pointer-events-none" style={{ opacity: dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0 }}>PASS</div>
        <div className="absolute top-24 right-4 text-4xl font-bold text-green-500 opacity-0 rotate-[20deg] pointer-events-none" style={{ opacity: dragOffset.x > 50 ? Math.min(dragOffset.x / 150, 1) : 0 }}>LIKE</div>
      </Card>

      {/* Popular Profile Prompt */}
      {showPopularPrompt && !isAd && profileId && (
        <Alert className="absolute top-4 left-4 right-4 z-30 bg-blue-950/80 border-blue-500/30 backdrop-blur-sm">
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
