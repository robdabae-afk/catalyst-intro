import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Users,
    FileText,
    Zap,
    Megaphone,
    TrendingUp,
    GlassWater,
    ArrowRight
} from "lucide-react";

const services = [
    {
        icon: <Users className="w-6 h-6 text-purple-400" />,
        title: "Direct Investor Intros",
        description: "Personalized warm intros to investors that match your industry and stage.",
        link: "/concierge?service=investor-intros"
    },
    {
        icon: <FileText className="w-6 h-6 text-purple-400" />,
        title: "Pitch Deck Revisions",
        description: "Narrative and design experts to help you nail your pitch and storytelling.",
        link: "/concierge?service=deck-revisions"
    },
    {
        icon: <Zap className="w-6 h-6 text-purple-400" />,
        title: "Profile Optimization",
        description: "Maximize your profile's impact with professional bio rewrites and asset selection.",
        link: "/concierge?service=profile-opt"
    },
    {
        icon: <Megaphone className="w-6 h-6 text-purple-400" />,
        title: "Founder Spotlights",
        description: "Get featured in our 50k+ subscriber newsletter and social media channels.",
        link: "/concierge?service=founder-spotlight"
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
        title: "Investor Spotlights",
        description: "Promote your investment thesis and portfolio to Trail’s top-tier founders.",
        link: "/concierge?service=investor-spotlight"
    },
    {
        icon: <GlassWater className="w-6 h-6 text-purple-400" />,
        title: "VIP Event Access",
        description: "Priority access to exclusive demo days, mixer events, and private dinners.",
        link: "/concierge?service=events"
    }
];

export const ConciergePreview = () => {
    const navigate = useNavigate();

    return (
        <section className="py-24 px-6 bg-[#0A0A0A] relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-amber-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-block">
                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase rounded-full">
                            Premium Support
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Concierge Services
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        Accelerate your success with our specialized hands-on support services.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-900 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => navigate(service.link)}
                        >
                            <div className="w-12 h-12 rounded-lg bg-neutral-800/50 flex items-center justify-center mb-6 border border-neutral-700/50 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 transition-colors">
                                {service.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-neutral-400 leading-relaxed mb-6">
                                {service.description}
                            </p>
                            <div className="flex items-center text-sm font-medium text-neutral-500 group-hover:text-white transition-colors">
                                Learn More <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Button
                        size="lg"
                        onClick={() => navigate('/concierge')}
                        className="bg-white text-black hover:bg-neutral-200 text-lg px-8 py-6 rounded-full font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow"
                    >
                        Explore Concierge Services
                    </Button>
                </div>
            </div>
        </section>
    );
};
