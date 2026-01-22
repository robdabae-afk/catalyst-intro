import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  ExternalLink, 
  ArrowUp, 
  ArrowDown, 
  X, 
  Star, 
  Handshake,
  Zap,
  Briefcase,
  Play
} from "lucide-react";
import { OrganicProfile } from '@/hooks/useSwipeQueue';

interface SwipePanelProps {
  profile: OrganicProfile | null;
  onSwipe: (direction: 'pass' | 'like' | 'priority_like') => void;
  onMessage?: () => void;
  isPro: boolean;
  boostCredits: number;
  isBoostActive: boolean;
  onBoostClick: () => void;
  loading?: boolean;
}

export const SwipePanel: React.FC<SwipePanelProps> = ({
  profile,
  onSwipe,
  onMessage,
  isPro,
  boostCredits,
  isBoostActive,
  onBoostClick,
  loading
}) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Reset section index when profile changes
  useEffect(() => {
    setActiveSectionIndex(0);
  }, [profile?.id]);

  const isFounderProfile = profile?.user_type === 'founder';
  const founderData = profile?.founder_profiles;
  const investorData = profile?.investor_profiles;

  // Build sections based on profile type and available data
  const sections = useMemo(() => {
    if (!profile) return [];
    const list: { id: string; title: string; content: React.ReactNode }[] = [];

    if (isFounderProfile && founderData) {
      // Section 1: MRR & Backed By
      if (founderData.mrr || founderData.backed_by) {
        list.push({
          id: 'traction',
          title: 'Traction & Backing',
          content: (
            <div className="space-y-6">
              {founderData.mrr && (
                <div>
                  <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">MRR / Revenue</h4>
                  <p className="text-white text-2xl font-semibold">{founderData.mrr}</p>
                </div>
              )}
              {founderData.backed_by && (
                <div>
                  <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">Backed By</h4>
                  <p className="text-white text-lg">{founderData.backed_by}</p>
                </div>
              )}
            </div>
          )
        });
      }

      // Section 2: One-liner / Super Power
      if (founderData.one_liner) {
        list.push({
          id: 'pitch',
          title: 'Super Power',
          content: (
            <div>
              <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-3">The Pitch</h4>
              <p className="text-white/90 text-lg leading-relaxed font-playfair italic">
                "{founderData.one_liner}"
              </p>
            </div>
          )
        });
      }

      // Section 3: Pitch Deck
      if (founderData.pitch_deck_url) {
        list.push({
          id: 'deck',
          title: 'Pitch Deck',
          content: (
            <div className="space-y-4">
              <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">Resources</h4>
              <a
                href={founderData.pitch_deck_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-white hover:text-luxury-gold transition-colors border border-luxury-gold/50 hover:border-luxury-gold px-6 py-3 rounded-xl group"
              >
                <Briefcase className="w-5 h-5 text-luxury-gold group-hover:scale-110 transition-transform" />
                <span className="font-medium">View Pitch Deck</span>
                <ExternalLink className="w-4 h-4 opacity-50" />
              </a>
            </div>
          )
        });
      }

      // Section 4: Website / Demo
      const hasLinks = founderData.website_url || founderData.demo_url;
      if (hasLinks) {
        list.push({
          id: 'links',
          title: 'Links',
          content: (
            <div className="space-y-4">
              {founderData.website_url && (
                <a 
                  href={founderData.website_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 text-white hover:text-luxury-gold transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-luxury-gold" />
                  <span className="underline decoration-luxury-gold/30 underline-offset-4">
                    {founderData.website_url.replace(/^https?:\/\//, '').split('/')[0]}
                  </span>
                </a>
              )}
              {founderData.demo_url && (
                <a 
                  href={founderData.demo_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 text-white hover:text-luxury-gold transition-colors"
                >
                  <Play className="w-5 h-5 text-luxury-gold" />
                  <span className="underline decoration-luxury-gold/30 underline-offset-4">Watch Demo</span>
                </a>
              )}
            </div>
          )
        });
      }
    } else if (!isFounderProfile && investorData) {
      // Investor Section 1: Check Size, Focus, Lead Rounds
      const hasCheckInfo = investorData.typical_check_size || investorData.preferred_stage || investorData.leads_rounds !== undefined;
      if (hasCheckInfo) {
        list.push({
          id: 'focus',
          title: 'Investment Focus',
          content: (
            <div className="space-y-5">
              {investorData.typical_check_size && (
                <div>
                  <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">Check Size</h4>
                  <p className="text-white text-2xl font-semibold">{investorData.typical_check_size}</p>
                </div>
              )}
              <div className="flex gap-6">
                {investorData.preferred_stage && (
                  <div>
                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">Stage Focus</h4>
                    <Badge variant="outline" className="border-zinc-600 text-white px-3 py-1">
                      {investorData.preferred_stage}
                    </Badge>
                  </div>
                )}
                {investorData.leads_rounds !== undefined && (
                  <div>
                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-2">Leads Rounds</h4>
                    <Badge variant="outline" className={investorData.leads_rounds ? "border-green-500/50 text-green-400" : "border-zinc-700 text-zinc-500"}>
                      {investorData.leads_rounds ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )
        });
      }

      // Investor Section 2: Investment Thesis
      if (investorData.investment_thesis) {
        list.push({
          id: 'thesis',
          title: 'Investment Thesis',
          content: (
            <div>
              <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-3">Thesis</h4>
              <p className="text-white/90 leading-relaxed text-base">
                {investorData.investment_thesis}
              </p>
            </div>
          )
        });
      }

      // Investor Section 3: Sectors of Interest
      if (investorData.sectors_of_interest && investorData.sectors_of_interest.length > 0) {
        list.push({
          id: 'sectors',
          title: 'Sectors',
          content: (
            <div>
              <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-3">Sectors of Interest</h4>
              <div className="flex flex-wrap gap-2">
                {investorData.sectors_of_interest.map((sector: string) => (
                  <Badge key={sector} variant="outline" className="border-luxury-gold/40 text-luxury-gold px-3 py-1.5">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          )
        });
      }

      // Investor Section 4: Portfolio (if available)
      if (investorData.portfolio_link) {
        list.push({
          id: 'portfolio',
          title: 'Portfolio',
          content: (
            <div>
              <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-3">Portfolio</h4>
              <a
                href={investorData.portfolio_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-white hover:text-luxury-gold transition-colors border border-luxury-gold/50 hover:border-luxury-gold px-6 py-3 rounded-xl"
              >
                <ExternalLink className="w-5 h-5" />
                View Portfolio
              </a>
            </div>
          )
        });
      }
    }

    return list;
  }, [profile, isFounderProfile, founderData, investorData]);

  // Keyboard navigation
  useEffect(() => {
    if (!profile || sections.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSectionIndex(prev => (prev + 1) % sections.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSectionIndex(prev => (prev - 1 + sections.length) % sections.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections.length, profile]);

  const currentSection = sections.length > 0 ? sections[activeSectionIndex] : null;

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
          <p className="text-white/50 text-sm tracking-widest uppercase">Curating Profiles...</p>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center text-zinc-600">
          <p className="text-lg font-playfair mb-2">All Caught Up!</p>
          <p className="text-sm">Check back later for new profiles</p>
        </div>
      </div>
    );
  }

  const displayName = profile.name || 'Unknown';
  const companyName = isFounderProfile 
    ? founderData?.startup_name 
    : investorData?.firm_name;
  const location = founderData?.preferred_city || investorData?.location;
  const stage = isFounderProfile ? founderData?.stage : investorData?.preferred_stage;
  const industries = isFounderProfile
    ? founderData?.industry 
    : investorData?.sectors_of_interest;
  const bannerUrl = founderData?.banner_url || investorData?.banner_url || profile.avatar_url;

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      {/* Boost Button - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBoostClick}
          className="bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:border-luxury-gold/50 rounded-full px-3 py-2 flex items-center gap-2"
        >
          <Zap className={`w-4 h-4 ${isBoostActive ? 'text-luxury-gold animate-pulse' : 'text-white/70'}`} />
          <span className="text-xs text-white/80">{boostCredits}</span>
          {isBoostActive && (
            <span className="text-[10px] text-luxury-gold font-medium animate-pulse">LIVE</span>
          )}
        </Button>
      </div>

      {/* Main Profile Card */}
      <div className="flex-1 flex m-6 rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl">
        {/* Left Half: Media */}
        <div className="w-1/2 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
              <span className="text-8xl font-playfair text-zinc-700">{displayName.charAt(0)}</span>
            </div>
          )}
          
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Name overlay on image */}
          <div className="absolute bottom-6 left-6 right-6">
            {location && (
              <div className="flex items-center gap-1 text-white/60 text-sm mb-2">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            )}
            <h2 className="text-3xl font-playfair text-white font-bold">{displayName}</h2>
            {companyName && (
              <p className="text-white/70 text-sm mt-1">
                {isFounderProfile ? 'Founder' : 'Investor'} @ {companyName}
              </p>
            )}
          </div>
        </div>

        {/* Right Half: Details */}
        <div className="w-1/2 flex flex-col bg-surface-dark">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-zinc-800/50">
            {/* Stage & Tags */}
            <div className="flex items-center justify-between mb-4">
              {stage && (
                <Badge variant="outline" className="border-luxury-gold/40 text-luxury-gold text-xs uppercase tracking-wider">
                  {stage}
                </Badge>
              )}
            </div>
            
            {/* Industry Tags */}
            {industries && industries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {industries.slice(0, 4).map((tag: string, i: number) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 rounded-full px-3"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Section Content Area */}
          <div className="flex-1 p-6 relative overflow-hidden">
            {/* Section Dots Indicator */}
            {sections.length > 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {sections.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSectionIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activeSectionIndex 
                        ? 'bg-luxury-gold scale-125' 
                        : 'bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Section Content */}
            <div className="pr-8">
              {currentSection ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentSection.id}>
                  {currentSection.content}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600 italic">
                  No additional details available
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="px-6 pb-4 flex items-center justify-end gap-2 text-zinc-600">
            <div className="flex items-center gap-1 border border-zinc-700 rounded px-2 py-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
            </div>
            <span className="text-xs">to explore profile</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
        {/* Pass */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onSwipe('pass')}
          className="w-14 h-14 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 hover:border-red-500/50 hover:bg-red-500/10 transition-all group"
        >
          <X className="w-6 h-6 text-zinc-400 group-hover:text-red-400 transition-colors" />
        </Button>

        {/* Priority / Instant Message */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onMessage?.()}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-luxury-gold/50 hover:border-luxury-gold hover:from-amber-500/30 hover:to-orange-500/30 transition-all group"
        >
          <Star className="w-7 h-7 text-luxury-gold group-hover:scale-110 transition-transform" />
        </Button>

        {/* Connect */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onSwipe('like')}
          className="w-14 h-14 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 hover:border-green-500/50 hover:bg-green-500/10 transition-all group"
        >
          <Handshake className="w-6 h-6 text-zinc-400 group-hover:text-green-400 transition-colors" />
        </Button>
      </div>
    </div>
  );
};
