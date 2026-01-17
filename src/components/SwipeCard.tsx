import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, TrendingUp, Heart, X, User, Briefcase, DollarSign, Target, Link as LinkIcon, FileText, Rocket, ExternalLink, Megaphone, MessageSquare, Star, Handshake, CheckCircle2, Lock, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUNDING_STAGES } from "@/lib/constants";
import type { AdProfile, QueueItem } from "@/hooks/useSwipeQueue";
import { InstantMessageDialog } from "@/components/InstantMessageDialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { ProfileMetrics } from "@/components/FeaturedCard";

interface ProfileMetricsLocal {
  response_rate: number;
  avg_reply_time: string;
  active_deals_count: number;
  activity_heatmap: number[];
  is_history_unlocked: boolean; // This will likely come from 'metrics' prop
}

interface SwipeCardProps {
  profile: QueueItem;
  onSwipe: (direction: 'like' | 'pass') => void;
  userType: 'founder' | 'investor';
  isAd?: boolean;
  isPro?: boolean;
  currentUserId?: string;
  // Enhanced props
  metrics?: ProfileMetricsLocal | null;
  onUnlockHistory?: () => void;
  unlockingHistory?: boolean;
  isMatch?: boolean; // Unused but kept for parity if needed later
  publicDeal?: any;  // Unused but kept for parity if needed later
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
  const { toast } = useToast();
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
  const instantMessageCount = organicProfile?.instant_message_count || 0;
  const isPopular = instantMessageCount >= 5;

  const hasVideo = isShowingFounder && founderProfile?.video_url;
  const videoUrl = founderProfile?.video_url;

  // New Logic: Investor Data
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
  const [dealFlow, setDealFlow] = useState<DealFlowItem[]>([]);

  // TODO: These tables don't exist yet - commented out to fix build
  // useEffect(() => {
  //   const fetchDealFlow = async () => {
  //     if (organicProfile?.user_type === 'investor' && investorProfile?.id) {
  //       const { data } = await supabase
  //         .from('investor_deal_flow')
  //         .select('*')
  //         .eq('investor_id', investorProfile.id)
  //         .order('created_at', { ascending: false })
  //         .limit(3);
  //       if (data) setDealFlow(data as DealFlowItem[]);
  //     }
  //   };
  //   fetchDealFlow();
  // }, [investorProfile?.id, organicProfile?.user_type]);

  interface PortfolioItem {
    id: string;
    company_name: string;
    investment_year: number | null;
    sector: string | null;
    investment_stage: string | null;
    is_lead: boolean | null;
    company_image_url: string | null;
  }
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // TODO: These tables don't exist yet - commented out to fix build
  // useEffect(() => {
  //   const fetchPortfolio = async () => {
  //     if (organicProfile?.user_type === 'investor' && investorProfile?.id) {
  //       const { data } = await supabase
  //         .from('investor_portfolio')
  //         .select('*')
  //         .eq('investor_id', investorProfile.id)
  //         .order('investment_year', { ascending: false });
  //       if (data) setPortfolio(data as PortfolioItem[]);
  //     }
  //   };
  //   fetchPortfolio();
  // }, [investorProfile?.id, organicProfile?.user_type]);

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

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-md mx-auto h-[480px] sm:h-[600px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl overflow-hidden bg-card border-border/50"
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
        {isAdProfile && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500"><Megaphone className="w-3 h-3 mr-1" />Ad</Badge>
          </div>
        )}
        {adLocked && <div className="absolute inset-0 z-10 bg-transparent" />}

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
                  {founderProfile?.company_name || founderProfile?.startup_name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {founderProfile?.stage && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs sm:text-sm">
                      {founderProfile.stage.replace('-', ' ')}
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
        ) : (
          <>
            <div className="relative h-24 sm:h-44 bg-gradient-to-br from-primary/20 to-accent/20">
              {bannerUrl ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" /> :
                isAdProfile && adProfile?.image_url ? <img src={adProfile.image_url} alt={adProfile.name} className="w-full h-full object-cover" /> :
                  avatarUrl ? <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 sm:w-24 sm:h-24 text-muted-foreground/30" /></div>}
              <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-20 bg-gradient-to-t from-card to-transparent" />
            </div>

            <CardHeader className="pb-0 sm:pb-2 pt-1 sm:pt-4 px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Avatar className="w-10 h-10 sm:w-16 sm:h-16 border-2 sm:border-4 border-background -mt-6 sm:-mt-12 relative z-10">
                  <AvatarImage src={isAdProfile ? adProfile?.image_url || '' : avatarUrl} alt={profile.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm sm:text-xl">{profile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm sm:text-xl truncate leading-tight flex items-center gap-2">
                    {isAdProfile ? adProfile?.company_name || adProfile?.name : isShowingFounder ? founderProfile?.startup_name || profile.name : investorProfile?.firm_name || profile.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs truncate">{profile.name}</p>
                </div>
              </div>
            </CardHeader>
          </>
        )}

        {!hasVideo && (
          <CardContent
            ref={contentRef}
            className="space-y-1.5 sm:space-y-3 pt-1 sm:pt-2 px-3 sm:px-6 overflow-y-auto max-h-[200px] sm:max-h-[250px] scrollbar-hide"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
          >
            {/* Ad Profile */}
            {isAdProfile && adProfile && (
              <>
                {(adProfile.one_liner || adProfile.description) && (
                  <p className="text-xs sm:text-sm leading-snug text-foreground">
                    {adProfile.one_liner || adProfile.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1">
                  {adProfile.stage && <Badge variant="outline" className="text-[10px] sm:text-xs">{adProfile.stage.replace('-', ' ')}</Badge>}
                  {adProfile.industry?.map((ind: string) => <Badge key={ind} variant="secondary" className="text-[10px] sm:text-xs">{ind}</Badge>)}
                  {adProfile.sectors_of_interest?.map((sector: string) => <Badge key={sector} variant="secondary" className="text-[10px] sm:text-xs">{sector}</Badge>)}
                </div>
                {adProfile.ad_type === 'investment_fund' && adProfile.typical_check_size && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="flex items-center gap-1 mb-0.5"><DollarSign className="w-3 h-3 text-primary" /><p className="text-[10px] font-medium text-muted-foreground">Typical Check</p></div>
                    <p className="text-xs font-medium">{adProfile.typical_check_size}</p>
                  </div>
                )}
                {adProfile.cta_url && (
                  <a href={adProfile.cta_url} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => e.stopPropagation()}>
                    <Button className="w-full" size="sm"><ExternalLink className="w-3 h-3 mr-2" />{adProfile.cta_text || 'Learn More'}</Button>
                  </a>
                )}
                {(adProfile.website_url || adProfile.portfolio_link) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                    <a href={adProfile.website_url || adProfile.portfolio_link || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Visit Website</a>
                  </div>
                )}
              </>
            )}

            {/* Founder Profile */}
            {isShowingFounder && founderProfile && (
              <>
                {founderProfile.one_liner && <p className="text-xs sm:text-sm leading-snug text-foreground">{founderProfile.one_liner}</p>}
                <div className="flex flex-wrap items-center gap-1">
                  {founderProfile.stage && <Badge variant="outline" className="text-[10px] sm:text-xs">{founderProfile.stage.replace('-', ' ')}</Badge>}
                  {founderProfile.industry?.map((ind: string) => <Badge key={ind} variant="secondary" className="text-[10px] sm:text-xs">{ind}</Badge>)}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-3 relative overflow-hidden group hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="w-3 h-3" /><p className="text-[10px] font-medium uppercase tracking-wider">MRR</p></div>
                      <p className="text-lg font-serif font-medium text-foreground">{founderProfile.mrr || '$0'}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-3 relative overflow-hidden group hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><Rocket className="w-3 h-3" /><p className="text-[10px] font-medium uppercase tracking-wider">Backed By</p></div>
                      <p className="text-sm font-medium text-foreground truncate">{founderProfile.backed_by || '-'}</p>
                    </div>
                  </div>
                </div>
                {founderProfile.traction && (
                  <div className="bg-muted/30 rounded-md p-2 mt-2">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Traction Highlights</p>
                    <p className="text-xs line-clamp-3">{founderProfile.traction}</p>
                  </div>
                )}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
                  {founderProfile.preferred_city && (
                    <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 flex-shrink-0" /><span>{founderProfile.preferred_city}</span></div>
                  )}
                </div>
                {founderProfile.pitch_deck_url && founderProfile.pitch_deck_visibility === 'public' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <a href={founderProfile.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>View Pitch Deck</a>
                  </div>
                )}
              </>
            )}

            {/* Investor Profile */}
            {!isShowingFounder && investorProfile && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {investorStats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg text-center border border-border/50">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">{stat.label}</span>
                      <p className="text-sm font-bold truncate w-full">{stat.value}</p>
                      <p className="text-[8px] text-muted-foreground truncate w-full">{stat.sub}</p>
                    </div>
                  ))}
                </div>
                {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {investorProfile.sectors_of_interest.map((sector: string) => <Badge key={sector} variant="secondary" className="text-[10px]">{sector}</Badge>)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Handshake size={12} /> Recent Investments</h4>
                  {portfolio.length === 0 ? <p className="text-xs text-muted-foreground italic">No public investment history.</p> : (
                    <div className="space-y-2">
                      <div className="bg-muted/30 p-2 rounded-lg border border-border/50">
                        <div className="flex justify-between items-start"><span className="text-sm font-bold">{portfolio[0].company_name}</span>{portfolio[0].is_lead && <Badge variant="outline" className="text-[9px] h-4">Lead</Badge>}</div>
                        <p className="text-[10px] text-muted-foreground">{portfolio[0].investment_year ? `Inv. ${portfolio[0].investment_year}` : 'Undisclosed'} • {portfolio[0].investment_stage || 'Stage N/A'}</p>
                      </div>
                      {portfolio.length > 1 && (
                        <div className="relative">
                          {metrics?.is_history_unlocked ? (
                            <div className="space-y-2">
                              {portfolio.slice(1).map(item => (
                                <div key={item.id} className="bg-muted/30 p-2 rounded-lg border border-border/50">
                                  <div className="flex justify-between items-start"><span className="text-sm font-bold">{item.company_name}</span>{item.is_lead && <Badge variant="outline" className="text-[9px] h-4">Lead</Badge>}</div>
                                  <p className="text-[10px] text-muted-foreground">{item.investment_year ? `Inv. ${item.investment_year}` : ''} • {item.investment_stage || 'N/A'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="blur-sm opacity-50 bg-muted/30 p-2 rounded-lg border border-border/50 select-none">
                                <div className="flex justify-between items-start"><span className="text-sm font-bold">Hidden Co.</span><Badge variant="outline" className="text-[9px] h-4">Follow-on</Badge></div>
                                <p className="text-[10px] text-muted-foreground">2023 • Series A</p>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Button size="sm" variant="secondary" className="h-6 text-[10px]" onClick={onUnlockHistory}><Lock size={10} className="mr-1" /> Unlock</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {dealFlow.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Target size={12} /> Currently Looking At</h4>
                    <div className="space-y-1.5">
                      {dealFlow.map(deal => (
                        <div key={deal.id} className="bg-muted/30 p-2 rounded-lg border border-border/50 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2"><span className="text-sm font-medium">{deal.startup_name}</span>{deal.stage && <span className="text-[9px] bg-white/5 px-1.5 rounded text-muted-foreground uppercase">{deal.stage}</span>}</div>
                            {deal.amount && <span className="text-[10px] text-emerald-400 font-mono">{deal.amount}</span>}
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {investorProfile.investment_thesis && (
                  <div className="bg-muted/50 rounded-lg p-3 relative border border-border/50">
                    <Quote className="absolute top-2 left-2 text-muted-foreground/20 w-4 h-4 rotate-180" />
                    <p className="text-xs text-center italic pt-2 px-2 pb-1 text-muted-foreground">"{investorProfile.investment_thesis}"</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                  {investorProfile.location && (<div className="flex items-center gap-1"><MapPin size={12} /> {investorProfile.location}</div>)}
                  {investorProfile.portfolio_link && (<a href={investorProfile.portfolio_link} target="_blank" className="flex items-center gap-1 text-primary hover:underline"><LinkIcon size={12} /> Portfolio</a>)}
                </div>
              </div>
            )}
          </CardContent>
        )}

        <div className="absolute top-24 left-4 text-4xl font-bold text-red-500 opacity-0 rotate-[-20deg] pointer-events-none" style={{ opacity: dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0 }}>PASS</div>
        <div className="absolute top-24 right-4 text-4xl font-bold text-green-500 opacity-0 rotate-[20deg] pointer-events-none" style={{ opacity: dragOffset.x > 50 ? Math.min(dragOffset.x / 150, 1) : 0 }}>LIKE</div>
      </Card>

      {showPopularPrompt && !isAd && profileId && (
        <Alert className="absolute top-4 left-4 right-4 z-30 bg-blue-50 dark:bg-blue-950/50 border-blue-500/30">
          <AlertDescription className="text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">{profileName} is popular and receives many messages!</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Send an instant message to stand out from the crowd.</p>
              </div>
              <Button size="sm" onClick={() => { setShowPopularPrompt(false); setShowInstantMessage(true); }} className="bg-blue-600 hover:bg-blue-700"><MessageSquare className="w-4 h-4 mr-1" />Message</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 -translate-x-1/2 flex gap-4 sm:gap-6 items-center">
        <Button size="lg" variant="outline" className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 hover:border-red-500 hover:text-red-500 ${adLocked ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !adLocked && onSwipe('pass')} disabled={adLocked}><X className="w-5 h-5 sm:w-8 sm:h-8" /></Button>
        {!isAd && profileId && currentUserId && (
          <Button size="lg" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg relative -mt-4 transition-transform hover:scale-105" onClick={() => setShowInstantMessage(true)} title="Send Priority Message">
            <div className="absolute -top-3 bg-white text-black px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-black/5 shadow-sm">Priority</div>
            <Star className="w-8 h-8 sm:w-10 sm:h-10 fill-black" />
          </Button>
        )}
        <Button size="lg" variant="outline" className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 hover:border-green-500 hover:text-green-500 ${adLocked ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !adLocked && onSwipe('like')} disabled={adLocked}><Heart className="w-5 h-5 sm:w-8 sm:h-8" /></Button>
      </div>

      {!isAd && profileId && currentUserId && (
        <InstantMessageDialog open={showInstantMessage} onOpenChange={setShowInstantMessage} senderId={currentUserId} receiverId={profileId} receiverName={profileName} userType={userType} isPopular={isPopular} onMessageSent={() => { }} />
      )}
    </div>
  );
};