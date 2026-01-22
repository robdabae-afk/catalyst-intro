import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, X, MapPin, Briefcase, ExternalLink, ArrowUp, ArrowDown, Star, Handshake } from "lucide-react";

interface ProfilePanelProps {
    profile: any; // Using any for flexibility with Supabase joins, ideally should be typed
    userType: 'founder' | 'investor'; // The type of the USER viewing the profile (or the profile itself? Prompt implies profile.user_type determines content)
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ profile }) => {
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);

    // Derive user type from profile
    const isFounderProfile = profile.user_type === 'founder';
    const displayType = profile.user_type;

    const founderData = profile.founder_profiles;
    const investorData = profile.investor_profiles;

    // Build Sections
    const sections = useMemo(() => {
        const list = [];

        if (isFounderProfile && founderData) {
            if (founderData.mrr || founderData.backed_by) {
                list.push({
                    id: 'traction',
                    title: 'Traction & Backing',
                    content: (
                        <div className="space-y-4">
                            {founderData.mrr && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">MRR / Revenue</h4>
                                    <p className="text-white text-lg font-medium">{founderData.mrr}</p>
                                </div>
                            )}
                            {founderData.backed_by && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Backed By</h4>
                                    <p className="text-white text-lg font-medium">{founderData.backed_by}</p>
                                </div>
                            )}
                        </div>
                    )
                });
            }

            if (founderData.super_power || founderData.one_liner) {
                list.push({
                    id: 'pitch',
                    title: 'Pitch',
                    content: (
                        <div className="space-y-4">
                            {founderData.one_liner && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">One Liner</h4>
                                    <p className="text-white/90 leading-relaxed">{founderData.one_liner}</p>
                                </div>
                            )}
                            {founderData.super_power && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Super Power</h4>
                                    <p className="text-white/90 leading-relaxed italic border-l-2 border-luxury-gold pl-3">"{founderData.super_power}"</p>
                                </div>
                            )}
                        </div>
                    )
                });
            }

            if (founderData.pitch_deck_url) {
                list.push({
                    id: 'deck',
                    title: 'Resources',
                    content: (
                        <div className="space-y-3">
                            <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Pitch Deck</h4>
                            <a
                                href={founderData.pitch_deck_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-luxury-gold hover:text-white transition-colors border border-luxury-gold/50 hover:border-luxury-gold px-4 py-2 rounded-lg"
                            >
                                <Briefcase className="w-4 h-4" />
                                View Pitch Deck
                            </a>
                        </div>
                    )
                });
            }

            if (founderData.website_url || founderData.demo_url) {
                list.push({
                    id: 'links',
                    title: 'Links',
                    content: (
                        <div className="flex flex-col gap-3">
                            {founderData.website_url && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Website</h4>
                                    <a href={founderData.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:text-luxury-gold transition-colors underline decoration-luxury-gold/50">
                                        {founderData.website_url.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                            {founderData.demo_url && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Demo</h4>
                                    <a href={founderData.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:text-luxury-gold transition-colors underline decoration-luxury-gold/50">
                                        Watch Demo <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )
                });
            }

        } else if (!isFounderProfile && investorData) {
            // Investor
            if (investorData.min_check_size || investorData.max_check_size || investorData.stage_focus || investorData.leads_rounds !== undefined) {
                list.push({
                    id: 'focus',
                    title: 'Focus & Check Size',
                    content: (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {(investorData.min_check_size || investorData.max_check_size) && (
                                    <div>
                                        <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Check Size</h4>
                                        <p className="text-white font-medium">
                                            ${investorData.min_check_size?.toLocaleString()} - ${investorData.max_check_size?.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {investorData.leads_rounds !== undefined && (
                                    <div>
                                        <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Leads Rounds?</h4>
                                        <Badge variant="outline" className={investorData.leads_rounds ? "border-green-500 text-green-400" : "border-zinc-700 text-zinc-500"}>
                                            {investorData.leads_rounds ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            {investorData.stage_focus && investorData.stage_focus.length > 0 && (
                                <div>
                                    <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Stage Focus</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {investorData.stage_focus.map((stage: string) => (
                                            <Badge key={stage} variant="secondary" className="bg-zinc-800 text-white border-zinc-700">{stage}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                });
            }

            if (investorData.investment_thesis) {
                list.push({
                    id: 'thesis',
                    title: 'Investment Thesis',
                    content: (
                        <div>
                            <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Thesis</h4>
                            <p className="text-white/90 leading-relaxed text-sm">
                                {investorData.investment_thesis}
                            </p>
                        </div>
                    )
                });
            }

            if (investorData.sectors && investorData.sectors.length > 0) {
                list.push({
                    id: 'sectors',
                    title: 'Sectors',
                    content: (
                        <div>
                            <h4 className="text-luxury-gold text-xs uppercase tracking-wider mb-1">Sectors of Interest</h4>
                            <div className="flex flex-wrap gap-2">
                                {investorData.sectors.map((s: string) => (
                                    <Badge key={s} variant="outline" className="border-luxury-gold/30 text-luxury-gold">{s}</Badge>
                                ))}
                            </div>
                        </div>
                    )
                });
            }
        }

        return list;
    }, [profile, isFounderProfile, founderData, investorData]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if focus is in input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) {
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
    }, [sections.length]);

    // If no sections (empty profile data), handle gracefully
    const currentSection = sections.length > 0 ? sections[activeSectionIndex] : null;

    return (
        <div className="h-full flex flex-col bg-surface-card border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex-1 flex flex-row h-full overflow-hidden">
                {/* Left Half: Media */}
                <div className="w-1/2 bg-black relative flex items-center justify-center overflow-hidden border-r border-border-subtle">
                    {/* Fallback to Avatar if no specific media, or use avatar as the media */}
                    {/* Mockup shows large photo. We'll use avatar_url as the main image */}
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <span className="text-6xl font-playfair text-zinc-700">{profile.name?.charAt(0)}</span>
                        </div>
                    )}

                    {/* Expand button on image (mockup) - Decoration */}
                    <div className="absolute top-4 right-4 bg-black/40 p-2 rounded-full cursor-pointer hover:bg-black/60 transition">
                        <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Right Half: Details */}
                <div className="w-1/2 flex flex-col bg-surface-dark">
                    {/* Header */}
                    <div className="p-6 pb-2">
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                {profile.location && (
                                    <Badge variant="secondary" className="bg-surface-card text-zinc-400 hover:bg-surface-card border-none text-[10px] px-2 py-0.5">
                                        <MapPin className="w-3 h-3 mr-1" /> {profile.location}
                                    </Badge>
                                )}
                            </div>
                            {/* Stage Badge if Founder */}
                            {isFounderProfile && founderData?.stage && (
                                <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-wider">
                                    {founderData.stage}
                                </Badge>
                            )}
                        </div>

                        <h2 className="text-3xl font-playfair text-white font-bold mb-1 flex items-center gap-2">
                            {profile.name}
                            {profile.verified && <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />}
                        </h2>

                        <p className="text-muted-foreground text-sm mb-3">
                            {isFounderProfile ? (
                                <>
                                    Founder @ <span className="text-white font-medium">{founderData?.startup_name || 'Stealth'}</span>
                                </>
                            ) : (
                                <>
                                    Investor @ <span className="text-white font-medium">{investorData?.firm_name || 'Unknown Firm'}</span>
                                </>
                            )}
                        </p>

                        {/* Tags/Chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {/* Combine sectors or general tags */}
                            {(isFounderProfile ? founderData?.market : investorData?.sectors)?.slice(0, 3).map((tag: string, i: number) => (
                                <Badge key={i} variant="outline" className="border-zinc-700 text-zinc-300 rounded-full px-3 py-1 font-normal">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <div className="w-full h-px bg-zinc-800 mb-4" />
                    </div>

                    {/* Section Area */}
                    <div className="flex-1 px-6 relative overflow-hidden flex flex-col">
                        {/* Section Navigation Headers (Optional visual indicator of where we are) */}
                        <div className="flex flex-col gap-1 absolute right-2 top-0">
                            {sections.map((s, i) => (
                                <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeSectionIndex ? 'bg-luxury-gold scale-125' : 'bg-zinc-700'}`} />
                            ))}
                        </div>

                        {/* Animated Section Content */}
                        <div className="flex-1 transition-all duration-300 ease-in-out">
                            {currentSection ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {currentSection.content}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-600 italic">
                                    No details available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Arrows (UI) */}
                    <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => setActiveSectionIndex(prev => (prev - 1 + sections.length) % sections.length)}>
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => setActiveSectionIndex(prev => (prev + 1) % sections.length)}>
                            <ArrowDown className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Action Overlay (Bottom) - X, Star, Handshake */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 pointer-events-none">
                {/* We make buttons pointer-events-auto */}
                <div className="pointer-events-auto flex items-center gap-4">
                    <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-zinc-700 bg-black/60 backdrop-blur-md text-zinc-400 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500 transition-all">
                        <X className="w-5 h-5" />
                    </Button>

                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-luxury-gold bg-luxury-gold/10 backdrop-blur-md text-luxury-gold hover:bg-luxury-gold hover:text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Star className="w-6 h-6 fill-current" />
                    </Button>

                    <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-zinc-700 bg-black/60 backdrop-blur-md text-zinc-400 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500 transition-all">
                        <Handshake className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
