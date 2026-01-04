import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, ArrowRight, Check } from "lucide-react";
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

    // Animation states
    const [showTypewriter, setShowTypewriter] = useState(false);

    const slides = [
        {
            id: "thesis",
            subtitle: "The Thesis",
            title: "PRIVATE MARKETS. UNLOCKED.",
            subhead: "The first discovery engine for everyday professionals to back the next unicorn.",
            type: "hero-swipe"
        },
        {
            id: "reg-cf",
            subtitle: "Powered by Reg CF",
            title: "FOUNDER <-> PUBLIC",
            content: "We utilize SEC Regulation Crowdfunding to bridge the gap between world-class founders and the professional public. \n\nStats: $5M/year raise limits. $1.1M active US startups. 300k+ hungry investors.",
            type: "bridge"
        },
        {
            id: "discovery",
            subtitle: "The Discovery Gap",
            title: "DISCOVERY IS BROKEN.",
            content: "1.1 million startups are invisible to the people who want to fund them.",
            type: "network-glow"
        },
        {
            id: "filter",
            subtitle: "The Noise Filter",
            title: "CURATION OVER CHAOS.",
            content: "Investors are drowning. Catalyst standardizes the pitch, removes the noise, and surfaces the top 5% of performers.",
            type: "funnel"
        },
        {
            id: "watchlist",
            subtitle: "The Watchlist UX",
            title: "SWIPE TO SHORTLIST.",
            content: "Not a trade. A discovery. Our UX reduces friction without encouraging impulsive trades. You swipe to add to your 'Intelligence Watchlist.' Deep due diligence happens on the regulated rail.",
            type: "mobile-mockup"
        },
        {
            id: "opportunity",
            subtitle: "The Opportunity",
            title: "BEYOND THE WALLED GARDEN.",
            content: "Like Robinhood for stocks and Kalshi for predictions, Catalyst is the gateway for the scientific or health professional to fund the research they actually understand.",
            type: "blur-reveal"
        },
        {
            id: "rail",
            subtitle: "The Catalyst Rail",
            title: "COMPLIANT BY DESIGN.",
            content: "Infrastructure: Escrow, KYC/AML, and Form C disclosures are baked into the final investment flow through our registered portal partners.",
            type: "cta"
        }
    ];

    const onScroll = useCallback((emblaApi: any) => {
        const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
        setScrollProgress(progress * 100);
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, []);

    const onSelect = useCallback((emblaApi: any) => {
        const index = emblaApi.selectedScrollSnap();
        setSelectedIndex(index);

        // Reset animations when entering slides
        if (index === 2) { // Discovery slide
            setShowTypewriter(false);
            setTimeout(() => setShowTypewriter(true), 100);
        }
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

    return (
        <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#000000] overflow-hidden flex flex-col relative">
            <style>{`
        @keyframes swipeRight {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          50% { transform: translateX(100px) rotate(10deg); opacity: 0.5; }
          100% { transform: translateX(200px) rotate(20deg); opacity: 0; }
        }
        @keyframes folderOpen {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes particleDrop {
            0% { transform: translateY(-20px) translateX(var(--x-start)); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(100px) translateX(0); opacity: 0; }
        }
        @keyframes diamondExit {
            0% { transform: translateY(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(50px); opacity: 0; }
        }
        .typewriter-text {
            overflow: hidden;
            border-right: .15em solid #FFFFFF;
            white-space: nowrap;
            margin: 0 auto;
            letter-spacing: .15em;
            animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing {
            from { width: 0 }
            to { width: 100% }
        }
        @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: #FFFFFF }
        }
        .blur-in {
            animation: blurIn 1.5s ease-out forwards;
        }
        @keyframes blurIn {
            0% { filter: blur(10px); opacity: 0; }
            100% { filter: blur(0); opacity: 1; }
        }
      `}</style>

            {/* Exit Button */}
            <div className="absolute top-8 left-8 z-50">
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

            <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="flex-[0_0_100%] min-w-0 relative h-screen flex flex-col justify-center items-center px-8 md:px-24"
                        >
                            <div className={`max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center transition-opacity duration-500 ${index === selectedIndex ? 'opacity-100' : 'opacity-20'}`}>

                                {/* Left Content (Text) */}
                                <div className="space-y-8 order-2 md:order-1">
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] w-12 bg-[#333333]"></div>
                                        <h3 className="text-sm md:text-base text-[#AAAAAA] uppercase tracking-[0.2em] font-medium">
                                            {slide.subtitle}
                                        </h3>
                                    </div>

                                    <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] text-[#FFFFFF] ${slide.type === 'network-glow' && showTypewriter ? 'typewriter-text' : ''} ${slide.type === 'blur-reveal' && index === selectedIndex ? 'blur-in' : ''}`}>
                                        {slide.title}
                                    </h1>

                                    {slide.subhead && (
                                        <p className="text-xl md:text-2xl text-[#FFFFFF] font-medium leading-relaxed">
                                            {slide.subhead}
                                        </p>
                                    )}

                                    <p className="text-lg md:text-xl text-[#AAAAAA] font-light leading-relaxed whitespace-pre-wrap">
                                        {slide.content}
                                    </p>

                                    {slide.type === 'cta' && (
                                        <div className="pt-6">
                                            <Button className="bg-[#FFFFFF] text-[#000000] hover:bg-[#AAAAAA] text-lg px-8 py-6 rounded-full font-bold">
                                                Join the Waitlist
                                            </Button>
                                            <div className="mt-8 pt-8 border-t border-[#1A1A1A] text-xs text-[#444444] max-w-md">
                                                Disclaimer: Investments in Reg CF offerings are speculative, illiquid, and involve a high degree of risk, including the possible loss of your entire investment. All securities are offered through registered portals.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Content (Visuals) */}
                                <div className="order-1 md:order-2 flex justify-center items-center h-[400px]">

                                    {/* Hero Swipe Animation */}
                                    {slide.type === 'hero-swipe' && (
                                        <div className="relative w-64 h-96">
                                            <div className="absolute top-0 left-0 w-full h-full border border-[#333333] rounded-3xl bg-[#000000] p-6 flex flex-col justify-between"
                                                style={{ animation: index === selectedIndex ? 'swipeRight 2s ease-in-out infinite' : 'none' }}>
                                                <div className="w-full h-32 bg-[#1A1A1A] rounded-xl mb-4"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-3/4 bg-[#333333] rounded"></div>
                                                    <div className="h-4 w-1/2 bg-[#333333] rounded"></div>
                                                </div>
                                            </div>
                                            <div className="absolute top-1/2 -right-32 transform -translate-y-1/2 opacity-0"
                                                style={{ animation: index === selectedIndex ? 'folderOpen 2s ease-in-out infinite' : 'none', animationDelay: '1.5s' }}>
                                                <div className="border border-[#FFFFFF] p-4 rounded-xl">
                                                    <Check className="w-8 h-8 text-[#FFFFFF]" />
                                                    <span className="text-xs mt-2 block uppercase tracking-widest">Watchlist</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bridge Visualization */}
                                    {slide.type === 'bridge' && (
                                        <div className="relative w-full h-64 flex items-center justify-between px-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full border border-[#FFFFFF] flex items-center justify-center">F</div>
                                                <span className="text-xs uppercase text-[#AAAAAA]">Founder</span>
                                            </div>
                                            <div className="flex-1 h-[2px] bg-[#333333] mx-4 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 h-full w-full bg-[#FFFFFF] opacity-20 animate-pulse"></div>
                                                <div className="absolute top-0 left-0 h-full w-1/3 bg-[#FFFFFF] blur-md" style={{ animation: 'typing 2s linear infinite' }}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full border border-[#FFFFFF] flex items-center justify-center">P</div>
                                                <span className="text-xs uppercase text-[#AAAAAA]">Public</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Network Glow */}
                                    {slide.type === 'network-glow' && (
                                        <div className="relative w-80 h-80">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="absolute w-3 h-3 bg-[#333333] rounded-full"
                                                    style={{
                                                        top: `${Math.random() * 80 + 10}%`,
                                                        left: `${Math.random() * 80 + 10}%`,
                                                        opacity: 0.3
                                                    }}
                                                />
                                            ))}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#FFFFFF] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse"></div>
                                        </div>
                                    )}

                                    {/* Funnel Animation */}
                                    {slide.type === 'funnel' && (
                                        <div className="relative w-64 h-80 flex flex-col items-center">
                                            {/* Particles */}
                                            <div className="absolute top-0 w-full h-20 overflow-hidden">
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} className="absolute w-2 h-2 bg-[#333333] rounded-full"
                                                        style={{
                                                            left: `${Math.random() * 100}%`,
                                                            '--x-start': `${(Math.random() - 0.5) * 50}px`,
                                                            animation: `particleDrop ${2 + Math.random()}s infinite linear`
                                                        } as any}>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Funnel Shape */}
                                            <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-t-[80px] border-l-transparent border-r-transparent border-t-[#1A1A1A] my-8"></div>
                                            {/* Output */}
                                            <div className="flex gap-2">
                                                <div className="w-4 h-4 border border-[#FFFFFF] rotate-45" style={{ animation: 'diamondExit 2s infinite' }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile Mockup */}
                                    {slide.type === 'mobile-mockup' && (
                                        <div className="border border-[#333333] rounded-3xl p-4 w-64 h-96 bg-[#000000] relative overflow-hidden">
                                            {/* Mock Card */}
                                            <div className="w-full h-full bg-[#1A1A1A] rounded-xl flex items-center justify-center text-[#333333] text-4xl font-bold cursor-pointer"
                                                onClick={() => setWatchlisted(true)}>
                                                {watchlisted ? <Check className="w-12 h-12 text-[#FFFFFF]" /> : "SWIPE"}
                                            </div>
                                            {watchlisted && (
                                                <div className="absolute bottom-8 left-4 right-4 bg-[#FFFFFF] text-[#000000] p-3 rounded-lg text-xs font-bold text-center animate-in slide-in-from-bottom fade-in duration-300">
                                                    Added to Watchlist
                                                    <div className="text-[10px] font-normal mt-1 text-[#444444]">Review Form C to proceed</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls & Progress */}
            <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">

                {/* Navigation Arrows (Desktop) */}
                <div className="hidden md:flex justify-between items-center px-12 pb-12 pointer-events-auto">
                    {/* Left Arrow */}
                    <div className={`transition-opacity duration-300 ${!canScrollPrev ? 'opacity-0' : 'opacity-100'}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => emblaApi?.scrollPrev()}
                            disabled={!canScrollPrev}
                            className="w-14 h-14 rounded-full border border-[#333333] hover:bg-[#1A1A1A] text-[#FFFFFF] transition-all duration-300 group"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                        </Button>
                    </div>

                    {/* Right Arrow */}
                    <div className={`transition-opacity duration-300 ${!canScrollNext ? 'opacity-0' : 'opacity-100'}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => emblaApi?.scrollNext()}
                            disabled={!canScrollNext}
                            className="w-14 h-14 rounded-full border border-[#333333] hover:bg-[#1A1A1A] text-[#FFFFFF] transition-all duration-300 group"
                        >
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* Minimal Progress Bar */}
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
