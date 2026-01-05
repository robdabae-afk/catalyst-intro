import { OrganicProfile, AdProfile } from "@/hooks/useSwipeQueue";
import { Zap, Clock, Handshake, CheckCircle2, MapPin, Lock } from "lucide-react";

export interface ProfileMetrics {
    response_rate: number;
    avg_reply_time: string;
    active_deals_count: number;
    activity_heatmap: number[]; // Array of counts for last 90 days
    is_history_unlocked: boolean;
}

interface FeaturedCardProps {
    profile: OrganicProfile | AdProfile;
    userType: 'founder' | 'investor';
    metrics?: ProfileMetrics | null;
    onUnlockHistory?: () => void;
    unlockingHistory?: boolean;
    isPro?: boolean;
    isMatch?: boolean;
    // Deal history props
    publicDeal?: {
        company_name: string;
        round: string;
        date: string;
        sector: string;
    } | null;
}

export const FeaturedCard = ({
    profile,
    userType,
    metrics,
    onUnlockHistory,
    unlockingHistory,
    isPro = false,
    isMatch = false,
    publicDeal
}: FeaturedCardProps) => {
    const isAd = profile.isAd;
    // Safe access to profile data
    const organicProfile = !isAd ? (profile as OrganicProfile) : null;
    const adProfile = isAd ? (profile as AdProfile) : null;

    // Determine display data
    const name = isAd ? adProfile?.name : organicProfile?.name;

    // Handle both one-to-one (object) and one-to-many (array) relationships
    // founder_profiles is one-to-one, so it's an object, not an array
    const founderDetails = organicProfile?.founder_profiles;
    const investorDetails = organicProfile?.investor_profiles;
    const details = isAd
        ? adProfile?.description
        : (Array.isArray(founderDetails) ? founderDetails[0] : founderDetails)
        || (Array.isArray(investorDetails) ? investorDetails[0] : investorDetails);

    // Debug logging
    console.log("FeaturedCard - Profile:", profile);
    console.log("FeaturedCard - Details:", details);
    console.log("FeaturedCard - Checking fields:", {
        startup_name: details?.startup_name,
        company_name: details?.company_name,
        firm_name: details?.firm_name
    });

    const company = isAd
        ? (adProfile?.company_name || adProfile?.firm_name)
        : (details?.startup_name || details?.company_name || details?.firm_name || "Stealth Mode");
    const role = isAd ? "Sponsored" : (details?.title || (organicProfile?.user_type === 'founder' ? "Founder" : "Investor"));
    const location = isAd ? "Global" : (details?.location || "San Francisco, CA");
    const image = isAd ? adProfile?.image_url : (organicProfile?.avatar_url || details?.avatar_url);

    // Use dynamic metrics if available, otherwise fallbacks (zeros or placeholders)
    const stats = [
        {
            label: "Response",
            value: metrics ? `${metrics.response_rate}%` : "-",
            sub: "Response Rate",
            icon: Zap
        },
        {
            label: "Avg Reply",
            value: metrics ? metrics.avg_reply_time : "-",
            sub: "Usually faster",
            icon: Clock
        },
        {
            label: "Deals",
            value: metrics ? metrics.active_deals_count.toString() : "-",
            sub: "Active deals",
            icon: Handshake
        }
    ];

    // Heatmap data
    const heatmapDays = metrics?.activity_heatmap || new Array(90).fill(0);

    return (
        <div className="flex flex-col gap-8 pb-32 pt-2 relative">
            {/* Profile Header Section */}
            <section className="flex flex-col items-center px-6 pt-6">
                <div className="relative mb-6 group cursor-pointer">
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full h-32 w-32 ring-1 ring-offset-4 ring-offset-black ring-white/20 shadow-2xl shadow-white/5"
                        style={{ backgroundImage: `url("${image || 'https://github.com/shadcn.png'}")` }}
                    >
                    </div>
                    <div className="absolute bottom-1 right-1 bg-white text-black rounded-full p-1.5 ring-4 ring-black flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={14} className="font-bold" />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                        {name}
                    </h1>
                    <p className="text-gray-400 text-xs font-medium tracking-[0.2em] uppercase">
                        {role} • {company}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-2">
                        <MapPin size={16} />
                        <span>{location}</span>
                    </div>
                </div>

                <div className="flex w-full gap-3 mt-10">
                    <button
                        className="flex-1 h-12 flex items-center justify-center rounded-lg bg-white text-black text-sm font-bold shadow-lg shadow-white/10 hover:bg-gray-200 transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isPro && !isMatch}
                    >
                        {isPro || isMatch ? "Message" : "Match to Message"}
                    </button>
                </div>
            </section>

            {/* Stats Section */}
            <section className="px-6">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex min-w-[130px] flex-1 flex-col gap-3 rounded-xl p-5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <stat.icon size={20} className="text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.label}</span>
                            </div>
                            <div>
                                <p className="text-white text-2xl font-bold tracking-tight">{stat.value}</p>
                                <p className="text-[11px] text-gray-500 mt-1">{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Investment/Deal History Section - Conditional based on type */}
            <section className="px-6">
                <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-8">
                    {organicProfile?.user_type === 'investor' ? "Investment History" : "Deal History"}
                </h3>
                <div className="relative pl-2">
                    <div className="absolute left-2 top-2 bottom-0 w-px bg-zinc-800"></div>
                    <div className="flex flex-col gap-6">
                        {/* Public Item (Most Recent) */}
                        <div className="relative pl-8 group">
                            <div className="absolute left-[3px] top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-black z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-white font-bold text-base">{publicDeal?.round || "Series A"} - {publicDeal?.company_name || "DataMinds"}</h4>
                                    <span className="text-[10px] font-bold uppercase text-black bg-white px-2 py-1 rounded">Lead</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wider">{publicDeal?.date || "Oct 2023"} • {publicDeal?.round ? "Confidential" : "$5M Round"}</p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-gray-700 h-6 w-6 rounded-full bg-cover bg-center grayscale opacity-80"></div>
                                    <span className="text-xs text-gray-300 font-medium tracking-wide">{publicDeal?.sector || "AI Infrastructure"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Locked/Unlocked Logic */}
                        <div className="relative pl-8">
                            <div className="absolute left-[3px] top-1.5 w-[11px] h-[11px] rounded-full bg-zinc-600 border-2 border-black z-10"></div>
                            <div className="relative bg-zinc-950 p-5 rounded-xl border border-zinc-800 overflow-hidden">
                                {metrics?.is_history_unlocked ? (
                                    // UNLOCKED STATE
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-white font-bold text-base">Pre-Seed - Stealth</h4>
                                            <span className="text-[10px] font-bold uppercase text-gray-500 bg-white/10 px-2 py-1 rounded">Angel</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Jan 2023 • $500k Round</p>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-700 h-6 w-6 rounded-full bg-cover bg-center grayscale opacity-80"></div>
                                            <span className="text-xs text-gray-300 font-medium tracking-wide">FinTech</span>
                                        </div>
                                    </div>
                                ) : (
                                    // LOCKED STATE
                                    <>
                                        <div className="blur-[5px] opacity-40 select-none">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-white font-bold text-base">Pre-Seed - Stealth</h4>
                                                <span className="text-[10px] font-bold uppercase text-gray-500 bg-white/10 px-2 py-1 rounded">Angel</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Jan 2023 • $500k Round</p>
                                        </div>
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                                            <Lock size={24} className="text-white mb-2 opacity-80" />
                                            <button
                                                onClick={onUnlockHistory}
                                                disabled={unlockingHistory}
                                                className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-sm backdrop-blur-md transition-colors disabled:opacity-50"
                                            >
                                                {unlockingHistory ? "Unlocking..." : "Unlock Full History"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-24"></div>
        </div>
    );
};
