import { useRef, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { X, ArrowUpRight, Check, Activity, Shield, Users, Globe, Target, Download, ArrowLeft, ArrowRight, Building, Lock, Search, TrendingUp, ChevronDown, ChevronRight, DollarSign, Smartphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LeadCaptureDialog } from '@/components/LeadCaptureDialog';

export default function CatalystDeck() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        duration: 25,
        skipSnaps: false,
    });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [watchlisted, setWatchlisted] = useState(false);
    const [showLeadCapture, setShowLeadCapture] = useState(false);
    const navigate = useNavigate();

    // New VC-Ready Data
    const slides = [
        {
            id: "core-problem",
            type: "three-col-text",
            subtitle: "The Core Problem",
            title: "PRIVATE MARKETS ARE BROKEN IN THREE WAYS.",
            items: [
                { icon: Search, title: "Discovery Is Inefficient", desc: "Founders rely on cold outreach. Most decks are never opened. Capital exists—attention does not." },
                { icon: Activity, title: "Signal Is Buried", desc: "Angels miss deals due to volume. No standardized data = subjective screening. High-potential startups are filtered out." },
                { icon: Lock, title: "Access Is Gated", desc: "Markets favor insiders. Everyday professionals are locked out. Platforms optimize for transactions, not inclusion." }
            ]
        },
        {
            id: "thesis",
            type: "thesis-swipe",
            subtitle: "The Thesis",
            title: "CATALYST IS THE FRONT DOOR TO PRIVATE MARKETS.",
            subhead: "Discovery first. Funding next. Full-stack platform over time.",
            content: "Standardized startup discovery. Swipe-based UX to filter intent. Designed from day one to transition into a regulated funding portal.",
            narrative: "This is intentional sequencing—not avoidance."
        },
        {
            id: "founder-pain",
            type: "stats-row-pain",
            subtitle: "Founder Pain",
            title: "MOST FOUNDERS DON'T GET REJECTED—THEY GET IGNORED.",
            content: "Fundraising is dominated by inbox chaos. Quality startups fail to reach aligned investors. Discovery inefficiency slows innovation.",
            items: [
                { value: "200+", label: "Hours / Round" },
                { value: "0%", label: "Feedback Rate" },
                { value: "Chaos", label: "Current State" }
            ]
        },
        {
            id: "investor-pain",
            type: "funnel-viz",
            subtitle: "Investor Pain",
            title: "TOO MUCH DEAL FLOW. TOO LITTLE SIGNAL.",
            content: "Thousands of inbound decks. No consistent format. Investors miss high-quality opportunities due to noise, not lack of capital.",
            narrative: "Precision over volume."
        },
        {
            id: "market",
            type: "tam-sam-som",
            subtitle: "Market Opportunity",
            title: "THE REG CF SUPERHIGHWAY.",
            narrative: "Figures represent Capital Volume. Modest take rates on execution target ($5.1B) yields 9-figure revenue.",
            items: [
                { label: "TAM", time: "End-State", value: "$10.3T", desc: "Global Investable Capital" },
                { label: "SAM", time: "5-10 Year", value: "$250B", desc: "Private & Alt Flows" },
                { label: "SOM", time: "Execution", value: "$5.1B", desc: "Annual Capital Flow Intermediated*" }
            ]
        },

        {
            id: "access-precedents",
            type: "comparison-trend",
            subtitle: "Access + Precedents",
            title: "CONSUMERIZING ACCESS—WITH REGULATION IN MIND.",
            narrative: "Catalyst applies these lessons to startup investing—responsibly.",
            items: [
                { label: "Kalshi", value: "Regulated", desc: "Proved regulated markets can be intuitive." },
                { label: "Robinhood", value: "Mobile-Native", desc: "Proved access scales with simple UX." },
                { label: "Catalyst", value: "Private Markets", desc: "Bringing retail UX to the Reg CF rail." }
            ]
        },
        {
            id: "product-today",
            type: "mobile-ux",
            subtitle: "Product Today (Discovery Mode)",
            title: "CATALYST TODAY: DISCOVERY & SIGNAL.",
            content: "Swipe to discover. Add to watchlist. Review standardized data. Express interest.",
            narrative: "No transaction execution in the initial phase."
        },
        {
            id: "product-tomorrow",
            type: "future-badge",
            subtitle: "Product Tomorrow (Funding Portal)",
            title: "CATALYST TOMORROW: A REGULATED FUNDING PORTAL.",
            content: "Transition to SEC-registered portal. Reg CF offerings first. Integrated escrow, KYC, and disclosures.",
            narrative: "Becoming a funding portal is a core part of long-term strategy."
        },
        {
            id: "roadmap-phases",
            type: "phase-execution",
            subtitle: "Phase-Based Execution",
            title: "FROM DISCOVERY TO CAPITAL INFRASTRUCTURE.",
            narrative: "North Star Metric: Annual Capital Flow Facilitated.",
            items: [
                { phase: "Phase 1", title: "Discovery Platform", desc: "Data-driven matching. No custody.", revenue: "$1M - $10M (Sub-scale)" },
                { phase: "Phase 2", title: "Capital Facilitation", desc: "Soft commitments. SPVs. Introductions.", revenue: "$20M - $60M" },
                { phase: "Phase 3", title: "Regulated Portal", desc: "Full execution. Primary & Secondary.", revenue: "$100M - $200M+" }
            ]
        },
        {
            id: "revenue-model",
            type: "flow-revenue",
            subtitle: "Revenue Model",
            title: "TAKE RATE ON CAPITAL FLOW.",
            narrative: "Catalyst is not a SaaS company chasing subscription dollars. It is a capital infrastructure platform monetizing participation in private market flows.",
            items: {
                som: "$5.1B",
                rate: "2.5% – 4.0%",
                revenue: "$127.5M – $204M"
            }
        },
        {
            id: "revenue-detail",
            type: "revenue-comparison",
            subtitle: "Revenue Model Detail",
            title: "HOW WE MAKE MONEY",
            narrative: "Breakdown of current and future revenue streams as we progress through regulation milestones.",
            items: {
                current: {
                    title: "Current (Live)",
                    description: "Founder subscriptions, visibility tools, concierge matching.",
                    revenue: "$1‑$5M ARR"
                },
                cfApproved: {
                    title: "Post‑CF Approval",
                    description: "Success fees on capital, founder SaaS (filings), institutional data APIs.",
                    revenue: "$10‑$30M ARR"
                },
                miniIPO: {
                    title: "Mini‑IPO (Regulated)",
                    description: "Primary market underwriting fees, secondary trading spreads, compliance services.",
                    revenue: "$50‑$150M ARR"
                }
            }
        },
        {
            id: "growth-scale",
            type: "growth-chart",
            subtitle: "Growth & Scale",
            title: "SCALING THE CURVE.",
            narrative: "Conservative initial traction compounds into exponential network effects.",
            items: [
                { label: "Year 1", revenue: "$1.2M", users: "5k" },
                { label: "Year 2", revenue: "$6.5M", users: "25k" },
                { label: "Year 3", revenue: "$18.0M", users: "80k" }
            ]
        },
        {
            id: "competition",
            type: "comparison-table",
            subtitle: "Competitive Positioning",
            title: "CATALYST EVOLVES ACROSS THE STACK.",
            narrative: "We start with superior discovery, then unlock execution."
        },
        {
            id: "vision",
            type: "cta-final",
            subtitle: "The Vision",
            title: "THE FUTURE OF PRIVATE MARKET ACCESS.",
            content: "Catalyst connects founders, investors, and everyday professionals — from first swipe to funded.",
            narrative: "Building the front door to startup investing."
        }
    ];

    const onScroll = useCallback((emblaApi: any) => {
        const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
        setScrollProgress(progress * 100);
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, []);

    const onSelect = useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        onScroll(emblaApi);
        onSelect(emblaApi);
        emblaApi.on("reInit", onScroll);
        emblaApi.on("scroll", onScroll);
        emblaApi.on("select", onSelect);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") emblaApi.scrollNext();
            if (e.key === "ArrowLeft") emblaApi.scrollPrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            emblaApi.off("reInit", onScroll);
            emblaApi.off("scroll", onScroll);
            emblaApi.off("select", onSelect);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [emblaApi, onScroll, onSelect]);

    const handleDownload = () => {
        setShowLeadCapture(true);
    };

    const handleCaptureSuccess = () => {
        // Wait for dialog to close visually before printing
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const renderVisual = (slide: any, isActive: boolean) => {
        switch (slide.type) {
            case 'three-col-text':
                return (
                    <div className="grid grid-cols-1 gap-6 w-full max-w-4xl">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="bg-[#111111] border border-[#333333] p-6 rounded-xl flex items-start gap-4">
                                <div className="bg-[#FFFFFF] p-2 rounded-lg text-[#000000]">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#FFFFFF] mb-2">{item.title}</h3>
                                    <p className="text-sm text-[#AAAAAA] leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'hero-text':
                return (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]"></div>
                        <Building className="w-48 h-48 text-[#1A1A1A]" strokeWidth={0.5} />
                    </div>
                );
            case 'thesis-swipe':
                return (
                    <div className="flex flex-col items-center gap-8 relative">
                        {/* Swipe Card */}
                        <div className="w-80 aspect-[3/4] bg-[#111111]/80 backdrop-blur-xl border border-[#333333] rounded-3xl p-6 flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in duration-700">
                            {/* Profile Placeholder */}
                            <div className="w-32 h-32 rounded-full border-2 border-[#333333] border-dashed flex items-center justify-center mb-6 bg-[#000000]/50">
                                <Users className="w-12 h-12 text-[#333333]" strokeWidth={1} />
                            </div>

                            {/* Name Placeholder */}
                            <div className="w-32 h-4 bg-[#333333] rounded-full mb-2"></div>
                            <div className="w-20 h-3 bg-[#222222] rounded-full mb-8"></div>

                            {/* Tags */}
                            <div className="flex gap-2 w-full justify-center mb-8">
                                <span className="px-3 py-1 rounded-full border border-[#FFFFFF] text-[10px] font-bold text-[#FFFFFF] tracking-wider uppercase">Fintech</span>
                                <span className="px-3 py-1 rounded-full border border-[#333333] bg-[#000000] text-[10px] font-bold text-[#AAAAAA] tracking-wider uppercase">Pre-Seed</span>
                            </div>

                            {/* Traction Section */}
                            <div className="w-full border-t border-[#333333] pt-4 mt-auto">
                                <div className="text-[9px] text-[#555555] uppercase tracking-widest mb-3 text-center">Traction</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="w-16 h-2 bg-[#222222] rounded-full"></div>
                                        <div className="w-8 h-2 bg-[#222222] rounded-full"></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="w-12 h-2 bg-[#222222] rounded-full"></div>
                                        <div className="w-10 h-2 bg-[#222222] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Swipe Hint Animation Overlay */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-[#FFFFFF]/10 flex items-center justify-center animate-pulse">
                                    <div className="w-2 h-2 bg-[#FFFFFF] rounded-full animate-ping"></div>
                                </div>
                            </div>
                        </div>

                        {/* Caption */}
                        <div className="text-center space-y-2">
                            <div className="flex items-center gap-4 justify-center text-xs font-bold tracking-widest uppercase">
                                <span className="text-[#555555] flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> No
                                </span>
                                <span className="w-1 h-1 bg-[#333333] rounded-full"></span>
                                <span className="text-[#FFFFFF] flex items-center gap-1">
                                    Yes <ArrowRight className="w-3 h-3" />
                                </span>
                            </div>
                            <p className="text-[#666666] text-xs italic">"Swipe Right if you're interested."</p>
                        </div>
                    </div>
                );
            case 'stats-row-pain':
                return (
                    <div className="flex gap-4 w-full justify-between items-center">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="flex-1 p-8 border border-[#333333] bg-[#050505] rounded-2xl text-center">
                                <div className="text-4xl md:text-5xl font-bold text-[#FFFFFF] mb-2">{item.value}</div>
                                <div className="text-xs uppercase tracking-widest text-[#666666]">{item.label}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'funnel-viz':
                return (
                    <div className="relative w-full max-w-sm h-96 flex flex-col items-center justify-center">
                        {/* Funnel Shape */}
                        <div className="w-full h-2 bg-[#333333] mb-1"></div>
                        <div className="w-[80%] h-2 bg-[#333333] mb-1 opacity-80"></div>
                        <div className="w-[60%] h-2 bg-[#333333] mb-1 opacity-60"></div>
                        <div className="w-[40%] h-2 bg-[#333333] mb-1 opacity-40"></div>
                        <div className="w-[20%] h-2 bg-[#333333] mb-8 opacity-20"></div>

                        <div className="w-16 h-16 rounded-full border-2 border-[#FFFFFF] flex items-center justify-center animate-pulse">
                            <Target className="w-8 h-8 text-[#FFFFFF]" />
                        </div>
                        <div className="mt-4 text-xs font-bold text-[#FFFFFF] uppercase tracking-widest">Signal Extracted</div>
                    </div>
                );
            case 'tam-sam-som':
                return (
                    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                        {/* Legend / Clarifier */}
                        <div className="absolute top-0 right-0 text-right">
                            <div className="flex items-center justify-end gap-2 text-[10px] text-[#AAAAAA] uppercase tracking-widest mb-1">
                                <Activity className="w-3 h-3" />
                                <span>Capital Volume</span>
                            </div>
                        </div>

                        {/* SOM (Inner) */}
                        <div className={`absolute w-36 h-36 rounded-full bg-[#FFFFFF] z-30 flex items-center justify-center text-[#000000] text-center p-2 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-1000 ${isActive ? 'scale-100' : 'scale-0'}`}>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{slide.items[2].time}</div>
                                <div className="text-2xl font-bold leading-none">{slide.items[2].value}</div>
                                <div className="text-[8px] opacity-70 mt-1">{slide.items[2].desc}</div>
                            </div>
                        </div>
                        {/* SAM (Middle) */}
                        <div className={`absolute w-72 h-72 rounded-full border border-[#FFFFFF] bg-[#1A1A1A] z-20 flex items-start justify-center pt-6 transition-all duration-1000 delay-200 ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                            <div className="text-center">
                                <div className="text-[10px] text-[#AAAAAA] uppercase tracking-wider mb-0.5">{slide.items[1].time}</div>
                                <div className="text-xl text-[#FFFFFF] font-bold leading-none">{slide.items[1].value}</div>
                                <div className="text-[9px] text-[#666666] mt-1">{slide.items[1].desc}</div>
                            </div>
                        </div>
                        {/* TAM (Outer) */}
                        <div className={`absolute w-[28rem] h-[28rem] rounded-full border border-[#333333] z-10 flex items-start justify-center pt-8 transition-all duration-1000 delay-400 ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                            <div className="text-center">
                                <div className="text-[10px] text-[#555555] uppercase tracking-wider mb-0.5">{slide.items[0].time}</div>
                                <div className="text-xl text-[#AAAAAA] font-bold leading-none">{slide.items[0].value}</div>
                                <div className="text-[9px] text-[#444444] mt-1">{slide.items[0].desc}</div>
                            </div>
                        </div>
                        {/* Footnote */}
                        <div className="absolute -bottom-8 left-0 text-[10px] text-[#666666] italic">
                            *Revenue derived via blended take rate (2.5% - 4.0%).
                        </div>
                    </div>
                );
            case 'comparison-trend':
                return (
                    <div className="w-full max-w-lg space-y-6">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-[#FFFFFF]">{item.label}</span>
                                    <span className="text-[#AAAAAA] text-sm">{item.value}</span>
                                </div>
                                <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FFFFFF] rounded-full" style={{ width: i < 2 ? '100%' : '10%' }}></div>
                                </div>
                                <p className="text-xs text-[#555555] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'mobile-ux':
                return (
                    <div className="border border-[#333333] rounded-3xl p-4 w-64 h-96 bg-[#000000] relative overflow-hidden mx-auto">
                        <div className="w-full h-full bg-[#1A1A1A] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105"
                            onClick={() => setWatchlisted(!watchlisted)}>
                            <h3 className="text-2xl font-bold text-[#FFFFFF] mb-4">StartUp Inc.</h3>
                            <div className="grid grid-cols-2 gap-2 w-full px-4 mb-4">
                                {[1, 2, 3, 4].map(n => <div key={n} className="h-2 bg-[#333333] rounded"></div>)}
                            </div>
                            {watchlisted ? <Check className="w-12 h-12 text-[#FFFFFF]" /> : <div className="text-[#FFFFFF] opacity-50 text-sm">Tap to Watchlist</div>}
                        </div>
                        {watchlisted && (
                            <div className="absolute bottom-8 left-4 right-4 bg-[#FFFFFF] text-[#000000] p-3 rounded-lg text-xs font-bold text-center animate-in slide-in-from-bottom fade-in duration-300">
                                Added to Intelligence Watchlist
                            </div>
                        )}
                    </div>
                );
            case 'future-badge':
                return (
                    <div className="w-64 h-64 rounded-full border border-[#FFFFFF] flex items-center justify-center relative bg-[#0A0A0A]">
                        <div className="absolute inset-0 border-t-2 border-[#FFFFFF] rounded-full animate-spin-slow"></div>
                        <div className="text-center">
                            <Shield className="w-12 h-12 text-[#FFFFFF] mx-auto mb-2" />
                            <div className="font-bold text-[#FFFFFF]">REG CF</div>
                            <div className="text-[10px] text-[#AAAAAA] uppercase tracking-widest">Portal Ready</div>
                        </div>
                    </div>
                );
            case 'step-flow':
                return (
                    <div className="w-full space-y-4">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="text-right w-24">
                                    <div className="text-xs font-bold text-[#666666] uppercase tracking-widest">{item.phase}</div>
                                </div>
                                <div className="h-12 w-[2px] bg-[#333333] relative">
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${i >= 0 ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'bg-[#000000] border-[#666666]'}`}></div>
                                </div>
                                <div className={`flex-1 p-4 border rounded-lg ${i === 2 ? 'border-[#FFFFFF] bg-[#111111] shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'border-[#333333] bg-[#000000]'} flex justify-between items-center`}>
                                    <div>
                                        <h4 className="font-bold text-[#FFFFFF] text-sm">{item.title}</h4>
                                        <p className="text-xs text-[#AAAAAA]">{item.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-[#555555] uppercase tracking-wider mb-1">Revenue Potential</div>
                                        <div className="text-sm font-bold text-[#FFFFFF]">{item.revenue}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'phase-execution':
                return (
                    <div className="w-full space-y-6">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-6 group">
                                <div className="text-right w-24 shrink-0">
                                    <div className="text-xs font-bold text-[#444444] uppercase tracking-widest group-hover:text-[#FFFFFF] transition-colors">{item.phase}</div>
                                </div>
                                <div className="h-full w-[1px] bg-[#333333] relative self-stretch flex items-center justify-center">
                                    <div className={`w-3 h-3 rounded-full ${i === 2 ? 'bg-[#FFFFFF] shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-[#333333]'} transition-all`}></div>
                                </div>
                                <div className={`flex-1 p-6 border rounded-xl transition-all duration-300 ${i === 2 ? 'border-[#FFFFFF] bg-[#0A0A0A]' : 'border-[#222222] bg-[#000000] opacity-60 group-hover:opacity-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-[#FFFFFF] text-lg mb-1">{item.title}</h4>
                                            <p className="text-sm text-[#AAAAAA]">{item.desc}</p>
                                        </div>
                                        <div className="text-right bg-[#111111] px-3 py-2 rounded-lg border border-[#333333]">
                                            <div className="text-[9px] text-[#555555] uppercase tracking-wider mb-0.5">Est. Revenue</div>
                                            <div className="text-sm font-mono font-bold text-[#FFFFFF]">{item.revenue}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'flow-revenue':
                return (
                    <div className="flex flex-col items-center justify-center w-full gap-8">
                        {/* Flow Diagram */}
                        <div className="flex items-center gap-4 w-full justify-center">
                            {/* Capital Flow */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-48 h-24 border border-[#FFFFFF] bg-[#0A0A0A] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                                    <div className="text-xs text-[#AAAAAA] uppercase tracking-widest mb-2">Capital Flow (SOM)</div>
                                    <div className="text-3xl font-bold text-[#FFFFFF]">{slide.items.som}</div>
                                </div>
                                <div className="text-[10px] text-[#555555]">Investable Volume</div>
                            </div>

                            <ArrowRight className="w-8 h-8 text-[#333333]" />

                            {/* Take Rate */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-32 h-24 border border-[#333333] bg-[#000000] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                                    <div className="text-xs text-[#555555] uppercase tracking-widest mb-2">Take Rate</div>
                                    <div className="text-xl font-bold text-[#AAAAAA]">{slide.items.rate}</div>
                                </div>
                                <div className="text-[10px] text-[#333333]">Blended Fee</div>
                            </div>

                            <ArrowRight className="w-8 h-8 text-[#FFFFFF]" />

                            {/* Revenue */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-48 h-24 border-2 border-[#FFFFFF] bg-[#FFFFFF] rounded-xl flex flex-col items-center justify-center p-4 text-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                    <div className="text-xs text-[#000000] uppercase tracking-widest mb-2 font-bold">Projected ARR</div>
                                    <div className="text-3xl font-bold text-[#000000] leading-none">{slide.items.revenue}</div>
                                </div>
                                <div className="text-[10px] text-[#FFFFFF] font-bold">Platform Revenue</div>
                            </div>
                        </div>

                        {/* Math Explanation */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center gap-3 text-lg font-mono text-[#AAAAAA] border border-[#333333] px-6 py-3 rounded-full bg-[#050505]">
                                <span className="text-[#FFFFFF]">{slide.items.som}</span>
                                <span>×</span>
                                <span className="text-[#FFFFFF]">2.5%</span>
                                <span>=</span>
                                <span className="text-[#FFFFFF]">$127.5M ARR</span>
                            </div>
                        </div>
                    </div>
                );
            case 'revenue-comparison':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {/* Current Revenue */}
                        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">{slide.items.current.title}</h3>
                            <p className="text-[#AAAAAA] mb-2">{slide.items.current.description}</p>
                            <div className="text-[#FFFFFF] font-mono">{slide.items.current.revenue}</div>
                        </div>
                        {/* Post‑CF Approval */}
                        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">{slide.items.cfApproved.title}</h3>
                            <p className="text-[#AAAAAA] mb-2">{slide.items.cfApproved.description}</p>
                            <div className="text-[#FFFFFF] font-mono">{slide.items.cfApproved.revenue}</div>
                        </div>
                        {/* Mini‑IPO */}
                        <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">{slide.items.miniIPO.title}</h3>
                            <p className="text-[#AAAAAA] mb-2">{slide.items.miniIPO.description}</p>
                            <div className="text-[#FFFFFF] font-mono">{slide.items.miniIPO.revenue}</div>
                        </div>
                    </div>
                );
            case 'comparison-table':
                return (
                    <div className="w-full overflow-hidden border border-[#333333] rounded-xl self-start">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[#1A1A1A] text-[#AAAAAA]">
                                    <th className="p-4 font-normal">Feature</th>
                                    <th className="p-4 font-normal">AngelList</th>
                                    <th className="p-4 font-normal">Wefunder</th>
                                    <th className="p-4 font-normal text-[#FFFFFF] opacity-50">Catalyst (Today)</th>
                                    <th className="p-4 font-bold text-[#FFFFFF]">End-State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333333] bg-[#000000]">
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Discovery UX</td>
                                    <td className="p-4 text-[#555555]">List</td>
                                    <td className="p-4 text-[#555555]">Campaign</td>
                                    <td className="p-4 text-[#FFFFFF] opacity-50">Swipe</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">Swipe</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Capital Exec</td>
                                    <td className="p-4 text-[#555555]">Yes</td>
                                    <td className="p-4 text-[#555555]">Yes</td>
                                    <td className="p-4 text-[#FFFFFF] opacity-50">No</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">Yes</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Target User</td>
                                    <td className="p-4 text-[#555555]">Funds</td>
                                    <td className="p-4 text-[#555555]">Public</td>
                                    <td className="p-4 text-[#FFFFFF] opacity-50">Professionals</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">Pro + Retail</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Min Check</td>
                                    <td className="p-4 text-[#555555]">$1k+</td>
                                    <td className="p-4 text-[#555555]">$100+</td>
                                    <td className="p-4 text-[#FFFFFF] opacity-50">~$500</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">~$500</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'growth-chart':
                return (
                    <div className="w-full max-w-3xl relative px-12">
                        {/* Left Y-Axis (Revenue) */}
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-[#555555] font-bold h-64 py-2">
                            <span>$20M</span>
                            <span>$10M</span>
                            <span>$0</span>
                        </div>

                        {/* Right Y-Axis (Users) */}
                        <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-[#555555] font-bold h-64 py-2 text-right">
                            <span>100k</span>
                            <span>50k</span>
                            <span>0</span>
                        </div>

                        <div className="relative h-64 border-b border-[#333333] mb-8 mx-4">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-20">
                                <div className="border-t border-[#FFFFFF] w-full h-0"></div>
                                <div className="border-t border-[#FFFFFF] w-full h-0"></div>
                                <div className="border-t border-[#FFFFFF] w-full h-0"></div>
                            </div>

                            {/* Chart Area */}
                            <div className="absolute inset-0 z-30">
                                {/* Revenue Points */}
                                {slide.items.map((item: any, i: number) => {
                                    const revValue = parseFloat(item.revenue.replace(/[^0-9.]/g, ''));
                                    const heightPerc = (revValue / 20) * 100;
                                    const xPos = [16.66, 50, 83.33][i];

                                    return (
                                        <div key={`rev-${i}`}
                                            className={`absolute w-3 h-3 rounded-full bg-[#FFFFFF] z-30 transition-all duration-1000 delay-500 hover:scale-150 cursor-crosshair ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                            style={{ left: `${xPos}%`, bottom: `calc(${heightPerc}% - 6px)`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-[#FFFFFF] whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded border border-[#333333]">
                                                {item.revenue}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* User Points */}
                                {slide.items.map((item: any, i: number) => {
                                    const userValue = parseInt(item.users.replace(/[^0-9]/g, ''));
                                    const userHeight = (userValue / 100) * 100;
                                    const xPos = [16.66, 50, 83.33][i];

                                    return (
                                        <div key={`user-${i}`}
                                            className={`absolute w-3 h-3 rounded-full border-2 border-[#FFFFFF] bg-[#000000] z-30 transition-all duration-1000 delay-700 hover:scale-150 cursor-crosshair ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                            style={{ left: `${xPos}%`, bottom: `calc(${userHeight}% - 6px)`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-[#FFFFFF] whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded border border-[#333333]">
                                                {item.users} Users
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Trend Lines (SVG) */}
                            <svg className={`absolute inset-0 w-full h-full pointer-events-none z-20 transition-opacity duration-1000 delay-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} preserveAspectRatio="none" viewBox="0 0 100 100">
                                {/* Revenue Line (Solid) */}
                                <polyline
                                    points="16.66,94 50,67.5 83.33,10"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Users Line (Dashed) */}
                                <polyline
                                    points="16.66,95 50,75 83.33,20"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                    className="opacity-60"
                                />
                            </svg>

                            {/* X-Axis Labels */}
                            <div className="absolute inset-x-0 -bottom-8 flex justify-between px-[16.66%] translate-x-[-12px]"> {/* Adjusting for center alignment logic roughly */}
                                {slide.items.map((item: any, i: number) => (
                                    <div key={i} className="w-0 flex justify-center text-xs font-medium text-[#AAAAAA] uppercase tracking-wider">
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-8 text-[10px] tracking-widest uppercase mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-[2px] bg-[#FFFFFF]"></div>
                                <span className="text-[#AAAAAA]">Revenue (ARR)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-[1px] border-t border-dashed border-[#FFFFFF]"></div>
                                <span className="text-[#AAAAAA]">Active Users</span>
                            </div>
                        </div>
                    </div>
                );
            case 'cta-final':
                return (
                    <div className="text-center w-full max-w-xl">
                        <div className="flex flex-col gap-4 justify-center items-center">
                            <Button className="bg-[#FFFFFF] text-[#000000] hover:bg-[#AAAAAA] text-lg px-8 py-6 rounded-full font-bold w-64 no-print">
                                Join Waitlist
                            </Button>
                            <Button variant="outline" className="border-[#333333] text-[#FFFFFF] hover:bg-[#1A1A1A] px-8 py-6 rounded-full font-bold w-64 no-print">
                                Apply as Founder
                            </Button>
                        </div>
                        <div className="mt-12 pt-8 border-t border-[#1A1A1A] text-[10px] text-[#444444] text-justify leading-relaxed">
                            {slide.content}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#000000] overflow-hidden flex flex-col relative print-container">
            <style>{`
        @media print {
            @page {
                size: landscape;
                margin: 0;
            }
            body { 
                background: #000000 !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            .print-container {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
            }
            .slide-page {
                height: 100vh !important;
                width: 100vw !important;
                page-break-after: always;
                display: flex !important;
                align-items: center;
                justify-content: center;
                padding: 40px !important;
            }
            .no-print {
                display: none !important;
            }
            /* Hide carousel wrappers and show slides directly */
            .embla-viewport, .embla-container {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
                transform: none !important;
            }
            .embla-slide {
                flex: none !important;
                transform: none !important;
            }
        }
      `}</style>

            {/* Nav Controls - Top Left/Right */}
            <div className="absolute top-8 left-8 z-50 no-print flex gap-4">
                <Link to="/">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#AAAAAA] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors duration-300 rounded-full w-10 h-10"
                    >
                        <X className="w-5 h-5" />
                        <span className="sr-only">Exit Deck</span>
                    </Button>
                </Link>
            </div>

            <div className="absolute top-8 right-8 z-50 no-print">
                <Button
                    variant="ghost"
                    onClick={handleDownload}
                    className="text-[#AAAAAA] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors gap-2"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-widest font-medium">Download PDF</span>
                </Button>
            </div>

            <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing embla-viewport" ref={emblaRef}>
                <div className="flex h-full touch-pan-y embla-container">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="flex-[0_0_100%] min-w-0 relative h-screen flex flex-col justify-center items-center px-6 md:px-24 py-12 embla-slide slide-page"
                        >
                            <div className={`max-w-7xl w-full grid md:grid-cols-2 gap-12 md:gap-24 items-center transition-opacity duration-500 ${index === selectedIndex ? 'opacity-100' : 'opacity-20'} ${slide.type === 'cta-final' ? '!grid-cols-1 justify-items-center text-center' : ''} print:opacity-100`}>

                                {/* Left Content (Text) */}
                                <div className={`space-y-8 order-2 md:order-1 ${slide.type === 'cta-final' ? 'text-center items-center flex flex-col max-w-3xl mx-auto' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] w-12 bg-[#333333]"></div>
                                        <h3 className="text-sm md:text-base text-[#AAAAAA] uppercase tracking-[0.2em] font-medium">
                                            {slide.subtitle}
                                        </h3>
                                    </div>

                                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-[#FFFFFF]">
                                        {slide.title}
                                    </h1>

                                    {slide.subhead && (
                                        <p className="text-xl md:text-2xl text-[#FFFFFF] font-medium leading-relaxed">
                                            {slide.subhead}
                                        </p>
                                    )}

                                    {slide.content && (
                                        <p className="text-lg md:text-xl text-[#AAAAAA] font-light leading-relaxed whitespace-pre-wrap">
                                            {slide.content}
                                        </p>
                                    )}

                                    {slide.narrative && (
                                        <div className={`pl-6 border-l-2 border-[#FFFFFF] py-2 ${slide.type === 'hero-text' ? 'border-none p-0 text-center mx-auto' : ''}`}>
                                            <p className="text-lg text-[#FFFFFF] italic font-serif">
                                                {slide.narrative}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Content (Visuals) */}
                                <div className={`order-1 md:order-2 flex justify-center items-center w-full min-h-[300px] ${slide.type === 'stats-row-pain' ? 'w-full max-w-5xl' : ''}`}>
                                    {renderVisual(slide, index === selectedIndex)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none no-print">

                {/* Navigation & Progress Wrapper */}
                <div className="flex justify-between items-end px-12 pb-12 pointer-events-auto w-full">

                    {/* Left Nav (Custom 3-Circle) */}
                    <div className={`transition-opacity duration-300 ${!canScrollPrev ? 'opacity-0' : 'opacity-100'}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => emblaApi?.scrollPrev()}
                            disabled={!canScrollPrev}
                            className="group flex items-center gap-3 hover:bg-transparent w-auto h-auto px-2"
                        >
                            <ArrowLeft className="w-5 h-5 text-[#FFFFFF]" />
                            <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></div>
                            </div>
                        </Button>
                    </div>

                    {/* Page Counter */}
                    <div className="text-[#AAAAAA] text-sm tabular-nums font-medium tracking-widest pb-2">
                        {String(selectedIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                    </div>

                    {/* Right Nav (Custom 3-Circle) */}
                    <div className={`transition-opacity duration-300 ${!canScrollNext ? 'opacity-0' : 'opacity-100'}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => emblaApi?.scrollNext()}
                            disabled={!canScrollNext}
                            className="group flex items-center gap-3 hover:bg-transparent w-auto h-auto px-2"
                        >
                            <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-[#FFFFFF]" />
                        </Button>
                    </div>
                </div>

                {/* Minimal Progress Bar (kept as secondary indicator) */}
                <div className="w-full h-[2px] bg-[#1A1A1A]">
                    <div
                        className="h-full bg-[#FFFFFF] transition-all duration-300 ease-out"
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>
            </div>
            {/* Lead Capture Dialog */}
            <LeadCaptureDialog
                open={showLeadCapture}
                onOpenChange={setShowLeadCapture}
                onSuccess={handleCaptureSuccess}
            />

        </div>
    );
}
