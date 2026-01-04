import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { X, ArrowUpRight, Check, Activity, Shield, Users, Globe, Target, Download, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

    // Data for slides (Same as before)
    const slides = [
        {
            id: "thesis",
            type: "hero",
            subtitle: "The Thesis",
            title: "CONSUMERIZING THE PRIVATE MARKETS.",
            subhead: "A high-precision discovery engine for the $10 Trillion private equity ecosystem.",
            content: "By 2026, private market assets are projected to grow by 12% CAGR, yet 98% of the professional workforce remains siloed from the asset class.",
            narrative: "We aren't just building a matching app; we are building the interface for the democratization of capital."
        },
        {
            id: "team",
            type: "grid-icons",
            subtitle: "The Military-Grade Founder",
            title: "PRECISION OVER NOISE.",
            narrative: "\"In the military, information without clarity is a liability. I’ve applied that same tactical rigor to the venture capital funnel.\"",
            items: [
                { icon: Target, label: "Operational Background", desc: "Infantry Officer, National Guard (High-stakes decision making)" },
                { icon: Globe, label: "Strategic Education", desc: "Naval Warfare & Maritime Transportation (Complex logistics)" },
                { icon: Shield, label: "Technical Edge", desc: "Network Security Operations (Data integrity & architecture)" }
            ]
        },
        {
            id: "problem",
            type: "stats-row",
            subtitle: "The Data-Driven Friction",
            title: "99.1% OF PITCH DECKS ARE REJECTED.",
            content: "In 2025, there was a $1.5 Billion shortfall in early-stage funding purely due to discovery friction.",
            items: [
                { value: "200+ Hrs", label: "Founder Burn (Outbound)" },
                { value: "2m 42s", label: "Investor Attention Span" },
                { value: "$1.5B", label: "Funding Shortfall" }
            ]
        },
        {
            id: "market",
            type: "tam-sam-som",
            subtitle: "Market Opportunity",
            title: "THE RETAIL REVOLUTION.",
            narrative: "We are targeting the \"Reg CF Superhighway\"—the fastest-growing segment of private finance.",
            items: [
                { label: "TAM", value: "$10.3 Trillion", desc: "Total US Private Equity & VC Assets" },
                { label: "SAM", value: "$250 Billion", desc: "Annual Early-Stage Seed/Pre-seed Volume" },
                { label: "SOM", value: "$5.1 Billion", desc: "Reg CF Market (Growing 33% YoY)" }
            ]
        },
        {
            id: "precedent",
            type: "comparison-trend",
            subtitle: "The Consumerization Precedent",
            title: "WE’VE SEEN THIS MOVIE BEFORE.",
            narrative: "We are doing for startups what Robinhood did for stocks: removing the \"elitist\" barrier to entry.",
            items: [
                { label: "Public Markets (Robinhood)", value: "10% -> 25%", desc: "Retail participation growth in 5 years" },
                { label: "Prediction Markets (Kalshi)", value: "$1B+", desc: "Volume reached by simplifying betting" },
                { label: "Catalyst", value: "$5M Cap", desc: "Bringing Retail UX to Reg CF" }
            ]
        },
        {
            id: "product",
            type: "mobile-ux",
            subtitle: "The Product",
            title: "HIGH-INTENT DISCOVERY.",
            content: "Standardized Data: 12 key metrics on every card.",
            narrative: "\"We’ve de-risked the 'gamification' by decoupling discovery from the transaction. You swipe to learn; you invest through the regulated rail.\"",
        },
        {
            id: "revenue",
            type: "revenue-cards",
            subtitle: "Revenue Model",
            title: "THREE REVENUE STREAMS.",
            subhead: "Year 1 Target: $1.2M ARR",
            items: [
                { title: "Founder SaaS", price: "$99/mo", features: ["Dashboard Access", "Auto Reg CF Filings", "Investor Heatmaps"] },
                { title: "Institutional", price: "$499/mo", features: ["\"Top 5%\" Curated Data", "Direct-to-GP Messaging", "Deal Flow API"] },
                { title: "Partner Kickback", price: "1-2.5%", features: ["Referral fee from Funding Portals", "Success-based", "High Margin"] }
            ]
        },
        {
            id: "competition",
            type: "comparison-table",
            subtitle: "The Competitive Edge",
            title: "WHY WE WIN.",
            narrative: "Catalyst is 100% data-driven and accessible to established professionals, unlike the gated or fragmented alternatives."
        },
        {
            id: "roadmap",
            type: "timeline",
            subtitle: "18-Month Roadmap",
            title: "TACTICAL EXECUTION.",
            items: [
                { quarter: "Q1 2026", milestone: "Launch /catalystdeck & Beta Waitlist (Target: 5k users)" },
                { quarter: "Q2 2026", milestone: "Partner Integration with 3 Major SEC Portals" },
                { quarter: "Q3 2026", milestone: "Full \"Swipe-to-Invest\" Reg CF Flow Launch" },
                { quarter: "Q4 2026", milestone: "Series A Raise ($5M) to scale acquisition" }
            ]
        },
        {
            id: "vision",
            type: "vision-impact",
            subtitle: "The Vision",
            title: "THE END OF THE WALLED GARDEN.",
            content: "There are 22 million established professionals in the US. If only 5% invest $1,000/year, we unlock $1.1 Billion in new capital.",
            narrative: "\"Any professional can support the technology they believe in. That is the true Catalyst for human advancement.\""
        },
        {
            id: "cta",
            type: "cta-final",
            subtitle: "Join the Revolution",
            title: "JOIN THE REVOLUTION.",
            content: "Catalyst is a technology provider. All securities offerings are conducted via registered intermediaries under Reg CF. Investing involves high risk."
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
        window.print();
    };

    const renderVisual = (slide: any, isActive: boolean) => {
        switch (slide.type) {
            case 'hero':
                return (
                    <div className="relative w-full max-w-sm aspect-[3/4] border border-[#333333] rounded-3xl bg-[#000000] p-6 flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-transparent opacity-50"></div>
                        <div className="relative z-10 w-full h-1/2 bg-[#1A1A1A] rounded-xl mb-4 animate-pulse"></div>
                        <div className="relative z-10 space-y-3">
                            <div className="h-4 w-3/4 bg-[#333333] rounded"></div>
                            <div className="h-4 w-1/2 bg-[#333333] rounded"></div>
                        </div>
                        <div className={`absolute bottom-10 right-10 transform transition-all duration-1000 ${isActive ? 'translate-x-12 rotate-12 opacity-0' : 'translate-x-0 rotate-0 opacity-100'}`}>
                            <div className="w-24 h-24 border-2 border-[#FFFFFF] rounded-full flex items-center justify-center">
                                <ArrowUpRight className="w-10 h-10 text-[#FFFFFF]" />
                            </div>
                        </div>
                    </div>
                );
            case 'grid-icons':
                return (
                    <div className="grid gap-6 w-full max-w-md">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 border border-[#333333] rounded-xl bg-[#0A0A0A]">
                                <div className="p-3 bg-[#FFFFFF] text-[#000000] rounded-lg">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#FFFFFF]">{item.label}</h4>
                                    <p className="text-sm text-[#AAAAAA] mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'stats-row':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="p-6 border border-[#FFFFFF] rounded-2xl flex flex-col items-center justify-center text-center bg-[#000000]">
                                <span className="text-4xl md:text-5xl font-bold text-[#FFFFFF] mb-2">{item.value}</span>
                                <span className="text-xs uppercase tracking-widest text-[#AAAAAA]">{item.label}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'tam-sam-som':
                return (
                    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                        {/* SOM */}
                        <div className={`absolute w-32 h-32 rounded-full bg-[#FFFFFF] z-30 flex items-center justify-center text-[#000000] text-center p-2 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-1000 ${isActive ? 'scale-100' : 'scale-0'}`}>
                            <div>
                                <div className="text-xl font-bold">{slide.items[2].value}</div>
                                <div className="text-[10px] font-bold">SOM</div>
                            </div>
                        </div>
                        {/* SAM */}
                        <div className={`absolute w-64 h-64 rounded-full border border-[#FFFFFF] bg-[#1A1A1A] z-20 flex items-start justify-center pt-4 transition-all duration-1000 delay-200 ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                            <div className="text-center mt-2">
                                <div className="text-[#FFFFFF] font-bold">{slide.items[1].value}</div>
                                <div className="text-[10px] text-[#AAAAAA]">SAM</div>
                            </div>
                        </div>
                        {/* TAM */}
                        <div className={`absolute w-96 h-96 rounded-full border border-[#333333] z-10 flex items-start justify-center pt-4 transition-all duration-1000 delay-400 ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                            <div className="text-center mt-4">
                                <div className="text-[#AAAAAA] font-bold">{slide.items[0].value}</div>
                                <div className="text-[10px] text-[#555555]">TAM</div>
                            </div>
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
                                    <div className="h-full bg-[#FFFFFF] rounded-full" style={{ width: i === 0 ? '25%' : i === 1 ? '50%' : '10%' }}></div>
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
            case 'revenue-cards':
                return (
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="flex-1 p-6 border border-[#333333] rounded-xl bg-[#0A0A0A] hover:border-[#FFFFFF] transition-colors duration-300">
                                <div className="text-[#AAAAAA] text-sm uppercase tracking-widest mb-2">{item.title}</div>
                                <div className="text-3xl font-bold text-[#FFFFFF] mb-6">{item.price}</div>
                                <ul className="space-y-2">
                                    {item.features.map((feat: string, j: number) => (
                                        <li key={j} className="text-xs text-[#888888] flex items-center gap-2">
                                            <div className="w-1 h-1 bg-[#FFFFFF] rounded-full"></div> {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            case 'comparison-table':
                return (
                    <div className="w-full overflow-hidden border border-[#333333] rounded-xl">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[#1A1A1A] text-[#AAAAAA]">
                                    <th className="p-4 font-normal">Feature</th>
                                    <th className="p-4 font-normal">AngelList</th>
                                    <th className="p-4 font-normal">Wefunder</th>
                                    <th className="p-4 font-bold text-[#FFFFFF]">Catalyst</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333333] bg-[#000000]">
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Check Size</td>
                                    <td className="p-4 text-[#555555]">$1,000+</td>
                                    <td className="p-4 text-[#555555]">$100+</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">$100+</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Discovery UX</td>
                                    <td className="p-4 text-[#555555]">List/Search</td>
                                    <td className="p-4 text-[#555555]">List/Search</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">Swipe/Algorithm</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-[#AAAAAA]">Target User</td>
                                    <td className="p-4 text-[#555555]">HNWIs</td>
                                    <td className="p-4 text-[#555555]">General Public</td>
                                    <td className="p-4 font-bold text-[#FFFFFF]">Professionals</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'timeline':
                return (
                    <div className="w-full max-w-2xl space-y-8 relative pl-8 border-l border-[#333333]">
                        {slide.items.map((item: any, i: number) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[37px] top-1 w-4 h-4 bg-[#000000] border-2 border-[#FFFFFF] rounded-full"></div>
                                <div className="text-sm font-bold text-[#FFFFFF] mb-1">{item.quarter}</div>
                                <div className="text-[#AAAAAA]">{item.milestone}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'vision-impact':
                return (
                    <div className="w-full max-w-md aspect-square rounded-full border border-[#333333] flex items-center justify-center relative bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_70%)]">
                        <div className="text-center z-10">
                            <div className="text-6xl font-bold text-[#FFFFFF] mb-2">$1.1B</div>
                            <div className="text-sm uppercase tracking-widest text-[#AAAAAA]">New Capital Unlocked</div>
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
                            <div className={`max-w-7xl w-full grid md:grid-cols-2 gap-12 md:gap-24 items-center transition-opacity duration-500 ${index === selectedIndex ? 'opacity-100' : 'opacity-20'} ${slide.type === 'stats-row' || slide.type === 'cta-final' ? '!grid-cols-1 justify-items-center' : ''} print:opacity-100`}>

                                {/* Left Content (Text) */}
                                <div className={`space-y-8 order-2 md:order-1 ${slide.type === 'cta-final' ? 'text-center items-center flex flex-col' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] w-12 bg-[#333333]"></div>
                                        <h3 className="text-sm md:text-base text-[#AAAAAA] uppercase tracking-[0.2em] font-medium">
                                            {slide.subtitle}
                                        </h3>
                                    </div>

                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-[#FFFFFF]">
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
                                        <div className="pl-6 border-l-2 border-[#FFFFFF] py-2">
                                            <p className="text-lg text-[#FFFFFF] italic font-serif">
                                                {slide.narrative}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Content (Visuals) */}
                                <div className={`order-1 md:order-2 flex justify-center items-center w-full min-h-[300px] ${slide.type === 'stats-row' ? 'w-full max-w-4xl' : ''}`}>
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
        </div>
    );
}
