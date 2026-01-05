
import { useState } from "react";
import { ArrowRight, Lock, CheckCircle2, UploadCloud } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";

export const FounderProfileInput = () => {
    const [activeSection, setActiveSection] = useState("company");

    const sections = [
        { id: "company", label: "Company Info", status: "current" },
        { id: "metrics", label: "Key Metrics", status: "pending" },
        { id: "team", label: "Team", status: "pending" },
        { id: "docs", label: "Documents", status: "locked" }
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-luxury-gold selection:text-black">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 sticky top-0 bg-black/90 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-serif font-bold tracking-tight text-white">
                        Profile Input
                    </h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">Draft</span>
                    </div>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[85%]">
                    Complete your profile to unlock investor matching.
                </p>
            </div>

            {/* Progress Stepper */}
            <div className="flex px-6 pt-4 pb-2 gap-2 overflow-x-auto no-scrollbar">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                            ${activeSection === section.id
                                ? 'bg-luxury-gold text-black border-luxury-gold shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                                : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700'
                            }
                        `}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 space-y-6">

                {/* Section Title */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 text-white font-serif font-bold">
                        1
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Company Basics</h2>
                </div>

                {/* Input Field: Company Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Company Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Acme AI"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-luxury-gold/50 focus:ring-1 focus:ring-luxury-gold/50 transition-all font-medium"
                    />
                </div>

                {/* Input Field: One Liner */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">One-Liner (140 chars)</label>
                    <textarea
                        rows={3}
                        placeholder="Currently building the Stripe for the space economy..."
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-luxury-gold/50 focus:ring-1 focus:ring-luxury-gold/50 transition-all font-medium resize-none"
                    />
                </div>

                {/* Input Field: Sector (Tags) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Sector</label>
                    <div className="flex flex-wrap gap-2">
                        {['SaaS', 'Fintech', 'AI', 'Marketplace'].map(tag => (
                            <button key={tag} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-medium hover:text-white hover:border-white/20 transition-colors">
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upload Deck Placeholder */}
                <div className="pt-4">
                    <div className="w-full h-32 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                            <UploadCloud className="text-zinc-500 group-hover:text-white transition-colors" size={24} />
                        </div>
                        <p className="text-xs text-zinc-600 font-medium group-hover:text-zinc-400">Upload Pitch Deck (PDF)</p>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black via-black/95 to-transparent z-10">
                <button className="w-full h-14 bg-white text-black rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-zinc-200">
                    Save & Continue <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default FounderProfileInput;
