import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CatalystDeck() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        duration: 25, // Adjusted for a snappy yet smooth feel
        skipSnaps: false,
    });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const slides = [
        {
            id: "intro",
            subtitle: "The Proposition",
            title: "Catalyst Intro.",
            content: "The simplest way for founders and investors to collaborate. Build your future with the right partners."
        },
        {
            id: "problem",
            subtitle: "The Problem",
            title: "Inefficient Networking.",
            content: "Cold emailing has low conversion rates. Warm intros are slow and hard to scale. Founders spend too much time fundraising, and investors miss out on great deals."
        },
        {
            id: "solution",
            subtitle: "The Solution",
            title: "Double Opt-In.",
            content: "We streamlined the process. Investors and founders swipe on profiles. Copilot matches interest. When both agree, an intro is made instantly."
        },
        {
            id: "traction",
            subtitle: "Traction",
            title: "Growing Fast.",
            content: "Helping 65+ users find matches. Over 10 investor-founder matches per week. 'Pro' features launching now to accelerate deal flow."
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

        // Keyboard navigation
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

            {/* Home / Exit Button - Top Left */}
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

            {/* Main Carousel Area */}
            <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="flex-[0_0_100%] min-w-0 relative h-screen flex flex-col justify-center items-center px-8 md:px-24"
                        >
                            {/* Content Container - with simple opacity transition based on active state if desired, 
                  but Embla slide is sufficient for smooth movement. 
                  We add a fade-in animation for initial load of content.
              */}
                            <div
                                className={`max-w-5xl w-full transition-opacity duration-500 ${
                                    // Optional: Fade out slightly when not active to enhance focus.
                                    // For "strict monochrome", we keep it simple.
                                    index === selectedIndex ? 'opacity-100' : 'opacity-20'
                                    }`}
                            >
                                <div className="space-y-12">
                                    {/* Subtitle / Label */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] w-12 bg-[#333333]"></div>
                                        <h3 className="text-sm md:text-base text-[#AAAAAA] uppercase tracking-[0.2em] font-medium">
                                            {slide.subtitle}
                                        </h3>
                                    </div>

                                    {/* Main Title */}
                                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] text-[#FFFFFF]">
                                        {slide.title}
                                    </h1>

                                    {/* Body Text */}
                                    <p className="text-xl md:text-3xl text-[#AAAAAA] max-w-3xl font-light leading-relaxed">
                                        {slide.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls & Progress */}
            <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">

                {/* Navigation Arrows (Desktop) - Adjusted position */}
                <div className="hidden md:flex justify-between items-center px-12 pb-16 pointer-events-auto">
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
