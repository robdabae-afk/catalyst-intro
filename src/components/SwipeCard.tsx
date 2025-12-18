import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, TrendingUp, Heart, X, User, Briefcase, DollarSign, Target, Link as LinkIcon, FileText, Rocket, ExternalLink, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUNDING_STAGES } from "@/lib/constants";
import type { AdProfile, QueueItem } from "@/hooks/useSwipeQueue";

interface SwipeCardProps {
  profile: QueueItem;
  onSwipe: (direction: 'like' | 'pass') => void;
  userType: 'founder' | 'investor';
  isAd?: boolean;
}

export const SwipeCard = ({ profile, onSwipe, userType, isAd = false }: SwipeCardProps) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [adLocked, setAdLocked] = useState(isAd);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset ad lock when profile changes
  useEffect(() => {
    if (isAd) {
      setAdLocked(true);
      const timer = setTimeout(() => setAdLocked(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setAdLocked(false);
    }
  }, [isAd, profile]);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (adLocked) return;
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || adLocked) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!dragStart || adLocked) return;

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? 'like' : 'pass');
    }

    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const rotation = dragOffset.x / 20;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  // Type guards for profile types
  const isAdProfile = profile.isAd === true;
  const adProfile = isAdProfile ? (profile as AdProfile) : null;
  const organicProfile = !isAdProfile ? profile : null;

  // userType is the CURRENT user's type, so we need to show the OPPOSITE type's profile
  const founderProfile = organicProfile?.founder_profiles?.[0];
  const investorProfile = organicProfile?.investor_profiles?.[0];
  
  // If current user is investor, show founder profiles; if founder, show investor profiles
  const isShowingFounder = userType === 'investor';
  const profileData = isShowingFounder ? founderProfile : investorProfile;
  const bannerUrl = isAdProfile ? adProfile?.banner_url : profileData?.banner_url;
  const avatarUrl = organicProfile?.avatar_url;

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-md mx-auto h-[480px] sm:h-[600px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl overflow-hidden"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
        }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => isDragging && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        {/* Ad Badge */}
        {isAdProfile && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">
              <Megaphone className="w-3 h-3 mr-1" />
              Ad
            </Badge>
          </div>
        )}

        {/* Ad Lock Overlay */}
        {adLocked && (
          <div className="absolute inset-0 z-10 bg-transparent" />
        )}

        {/* Banner/Profile Image Section */}
        <div className="relative h-24 sm:h-44 bg-gradient-to-br from-primary/20 to-accent/20">
          {bannerUrl ? (
            <img 
              src={bannerUrl} 
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : isAdProfile && adProfile?.image_url ? (
            <img 
              src={adProfile.image_url} 
              alt={adProfile.name}
              className="w-full h-full object-cover"
            />
          ) : avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-12 h-12 sm:w-24 sm:h-24 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-20 bg-gradient-to-t from-card to-transparent" />
        </div>

        <CardHeader className="pb-0 sm:pb-2 pt-1 sm:pt-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Avatar className="w-10 h-10 sm:w-16 sm:h-16 border-2 sm:border-4 border-background -mt-6 sm:-mt-12 relative z-10">
              <AvatarImage src={isAdProfile ? adProfile?.image_url || '' : avatarUrl} alt={profile.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm sm:text-xl">
                {profile.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-xl truncate leading-tight">
                {isAdProfile 
                  ? adProfile?.company_name || adProfile?.firm_name || adProfile?.name
                  : isShowingFounder 
                    ? founderProfile?.startup_name || profile.name
                    : investorProfile?.firm_name || profile.name}
              </CardTitle>
              <p className="text-muted-foreground text-xs truncate">{profile.name}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-1.5 sm:space-y-3 pt-1 sm:pt-2 px-3 sm:px-6 overflow-y-auto max-h-[320px] sm:max-h-[340px]">
          {/* Ad Profile Display */}
          {isAdProfile && adProfile && (
            <>
              {/* One-liner / Description */}
              {(adProfile.one_liner || adProfile.description) && (
                <p className="text-xs sm:text-sm leading-snug text-foreground">
                  {adProfile.one_liner || adProfile.description}
                </p>
              )}

              {/* Stage & Industries/Sectors inline */}
              <div className="flex flex-wrap items-center gap-1">
                {adProfile.stage && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {adProfile.stage.replace('-', ' ')}
                  </Badge>
                )}
                {adProfile.industry?.map((ind: string) => (
                  <Badge key={ind} variant="secondary" className="text-[10px] sm:text-xs">
                    {ind}
                  </Badge>
                ))}
                {adProfile.sectors_of_interest?.map((sector: string) => (
                  <Badge key={sector} variant="secondary" className="text-[10px] sm:text-xs">
                    {sector}
                  </Badge>
                ))}
              </div>

              {/* Check Size for investment_fund ads */}
              {adProfile.ad_type === 'investment_fund' && adProfile.typical_check_size && (
                <div className="bg-muted/50 rounded-md p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <DollarSign className="w-3 h-3 text-primary" />
                    <p className="text-[10px] font-medium text-muted-foreground">Typical Check</p>
                  </div>
                  <p className="text-xs font-medium">{adProfile.typical_check_size}</p>
                </div>
              )}

              {/* CTA Button */}
              {adProfile.cta_url && (
                <a
                  href={adProfile.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button className="w-full" size="sm">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {adProfile.cta_text || 'Learn More'}
                  </Button>
                </a>
              )}

              {/* Website/Portfolio Link */}
              {(adProfile.website_url || adProfile.portfolio_link) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <a 
                    href={adProfile.website_url || adProfile.portfolio_link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </>
          )}

          {/* Founder Profile Display (shown to investors) */}
          {isShowingFounder && founderProfile && (
            <>
              {/* One-liner */}
              {founderProfile.one_liner && (
                <p className="text-xs sm:text-sm leading-snug text-foreground">{founderProfile.one_liner}</p>
              )}

              {/* Stage & Industries inline */}
              <div className="flex flex-wrap items-center gap-1">
                {founderProfile.stage && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {founderProfile.stage.replace('-', ' ')}
                  </Badge>
                )}
                {founderProfile.industry?.map((ind: string) => (
                  <Badge key={ind} variant="secondary" className="text-[10px] sm:text-xs">
                    {ind}
                  </Badge>
                ))}
              </div>

              {/* Traction */}
              {founderProfile.traction && (
                <div className="bg-muted/50 rounded-md p-2 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Traction</p>
                  </div>
                  <p className="text-xs sm:text-sm">{founderProfile.traction}</p>
                </div>
              )}

              {/* Location & Company inline */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {founderProfile.preferred_city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{founderProfile.preferred_city}</span>
                  </div>
                )}
                {(founderProfile.company_name || founderProfile.company_state) && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {founderProfile.company_name}
                      {founderProfile.company_state && ` (${founderProfile.company_state})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Pitch Deck Link */}
              {founderProfile.pitch_deck_url && founderProfile.pitch_deck_visibility === 'public' && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <a 
                    href={founderProfile.pitch_deck_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Pitch Deck
                  </a>
                </div>
              )}
              {founderProfile.pitch_deck_url && founderProfile.pitch_deck_visibility === 'private' && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="text-muted-foreground italic">Pitch deck available upon request</span>
                </div>
              )}
            </>
          )}

          {/* Investor Profile Display (shown to founders) */}
          {!isShowingFounder && investorProfile && (
            <>
              {/* Firm Name */}
              {investorProfile.firm_name && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{investorProfile.firm_name}</span>
                </div>
              )}

              {/* Check Size & Stage inline */}
              <div className="grid grid-cols-2 gap-1.5">
                {investorProfile.typical_check_size && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <DollarSign className="w-3 h-3 text-primary" />
                      <p className="text-[10px] font-medium text-muted-foreground">Check</p>
                    </div>
                    <p className="text-xs font-medium">{investorProfile.typical_check_size}</p>
                  </div>
                )}
                {investorProfile.preferred_stage && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Target className="w-3 h-3 text-primary" />
                      <p className="text-[10px] font-medium text-muted-foreground">Stage</p>
                    </div>
                    <p className="text-xs font-medium capitalize">
                      {investorProfile.preferred_stage.replace('-', ' ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Sectors of Interest */}
              {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {investorProfile.sectors_of_interest.map((sector: string) => (
                    <Badge key={sector} variant="secondary" className="text-[10px] sm:text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Location */}
              {investorProfile.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span>{investorProfile.location}</span>
                </div>
              )}

              {/* Portfolio Link */}
              {investorProfile.portfolio_link && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <a 
                    href={investorProfile.portfolio_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Portfolio
                  </a>
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Swipe indicators */}
        <div 
          className="absolute top-24 left-4 text-4xl font-bold text-red-500 opacity-0 rotate-[-20deg] pointer-events-none"
          style={{ opacity: dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0 }}
        >
          PASS
        </div>
        <div 
          className="absolute top-24 right-4 text-4xl font-bold text-green-500 opacity-0 rotate-[20deg] pointer-events-none"
          style={{ opacity: dragOffset.x > 50 ? Math.min(dragOffset.x / 150, 1) : 0 }}
        >
          LIKE
        </div>
      </Card>

      {/* Action buttons */}
      <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 -translate-x-1/2 flex gap-4 sm:gap-6">
        <Button
          size="lg"
          variant="outline"
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 hover:border-red-500 hover:text-red-500 ${adLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !adLocked && onSwipe('pass')}
          disabled={adLocked}
        >
          <X className="w-5 h-5 sm:w-8 sm:h-8" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 hover:border-green-500 hover:text-green-500 ${adLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !adLocked && onSwipe('like')}
          disabled={adLocked}
        >
          <Heart className="w-5 h-5 sm:w-8 sm:h-8" />
        </Button>
      </div>
    </div>
  );
};