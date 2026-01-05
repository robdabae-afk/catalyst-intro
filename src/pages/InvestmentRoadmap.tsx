
import { Check, ArrowRight, Lock } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";

export const InvestmentRoadmap = () => {
    const steps = [
        {
            id: 1,
            title: "Discovery",
            description: "AI-matching with verified investors based on thesis alignment.",
            status: "completed",
            date: "Auto-Active"
        },
        {
            id: 2,
            title: "Connect",
            description: "Mutual interest confirmed. Direct messaging channel opens.",
            status: "active",
            date: "In Progress"
        },
        {
            id: 3,
            title: "Diligence",
            description: "Data room access, Q&A, and technical deep-dives.",
            status: "locked",
            date: "Pending"
        },
        {
            id: 4,
            title: "Term Sheet",
            description: "Deal structure negotiation and final agreement.",
            status: "locked",
            date: "Pending"
        },
        {
            id: 5,
            title: "Closing",
            description: "Funds transfer and post-close administrative setup.",
            status: "locked",
            date: "Pending"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-luxury-gold selection:text-black">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/5">
                <h1 className="text-2xl font-serif font-bold tracking-tight text-white mb-1">
                    Roadmap
                </h1>
                <p className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase">
                    Your Investment Journey
                </p>
            </div>

            {/* Timeline Content */}
            <div className="px-6 py-8">
                <div className="relative border-l border-white/10 ml-3 space-y-12">
                    {steps.map((step, index) => {
                        const isCompleted = step.status === "completed";
                        const isActive = step.status === "active";
                        const isLocked = step.status === "locked";

                        return (
                            <div key={step.id} className="relative pl-8 group">
                                {/* Dot Indicator */}
                                <div className={`absolute -left-[5px] top-1.5 w-[11px] h-[11px] rounded-full border-2 z-10 transition-colors duration-300
                                    ${isCompleted ? 'bg-luxury-gold border-luxury-gold shadow-[0_0_10px_rgba(197,160,89,0.5)]' : ''}
                                    ${isActive ? 'bg-black border-luxury-gold animate-pulse' : ''}
                                    ${isLocked ? 'bg-black border-zinc-800 group-hover:border-zinc-700' : ''}
                                `}></div>

                                {/* Card */}
                                <div className={`rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden
                                    ${isActive ? 'bg-gradient-to-br from-zinc-900 to-black border-luxury-gold/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : ''}
                                    ${isCompleted ? 'bg-zinc-950 border-white/10 opacity-70' : ''}
                                    ${isLocked ? 'bg-black border-white/5 opacity-50' : ''}
                                `}>
                                    {/* Active Glow */}
                                    {isActive && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    )}

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border
                                            ${isActive ? 'text-luxury-gold border-luxury-gold/20 bg-luxury-gold/5' : 'text-zinc-500 border-zinc-800'}
                                        `}>
                                            Step 0{step.id}
                                        </span>
                                        {isCompleted && <Check className="w-4 h-4 text-luxury-gold" />}
                                        {isLocked && <Lock className="w-3 h-3 text-zinc-600" />}
                                        {isActive && <div className="w-2 h-2 rounded-full bg-luxury-gold animate-ping" />}
                                    </div>

                                    <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                                        {step.title}
                                    </h3>

                                    <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                        {step.description}
                                    </p>

                                    {isActive && (
                                        <button className="w-full py-3 rounded-lg bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                                            View Details <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default InvestmentRoadmap;
