import { OrganicProfile, AdProfile } from "@/hooks/useSwipeQueue";
import { Zap, Clock, Handshake, CheckCircle2, MapPin, Lock, Quote, TrendingUp, Rocket, Briefcase } from "lucide-react";
import { useState, useEffect } from 'react';
import { InstantMessageModal } from './InstantMessageModal';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { supabase } from '@/integrations/supabase/client';

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
    isFeatured?: boolean;
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
    isFeatured = false,
    publicDeal
}: FeaturedCardProps) => {
    const isAd = profile.isAd;
    // Safe access to profile data
    const organicProfile = !isAd ? (profile as OrganicProfile) : null;
    const adProfile = isAd ? (profile as AdProfile) : null;

    // Modal state
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [loadingBalance, setLoadingBalance] = useState(true);

    // Fetch user's token balance
    useEffect(() => {
        const fetchTokenBalance = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tokens')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setTokenBalance(profile.tokens || 0);
                }
            } catch (error) {
                console.error('Error fetching token balance:', error);
            } finally {
                setLoadingBalance(false);
            }
        };

        fetchTokenBalance();
    }, []);

    const handleMessageClick = () => {
        setShowMessageModal(true);
    };

    const handleMessageSuccess = (newBalance: number) => {
        setTokenBalance(newBalance);
        setShowMessageModal(false);
    };

    const handleOpenPurchase = () => {
        setShowMessageModal(false);
        setShowPurchaseModal(true);
    };

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
            value: (metrics && metrics.response_rate !== -1) ? `${metrics.response_rate}%` : "-",
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

    // Endorsements State
    interface Endorsement {
        id: string;
        text: string;
        endorser: {
            name: string;
            avatar_url: string | null;
            user_type: string;
            // potential detail: firm/company name
            founder_profile?: { startup_name: string };
            investor_profile?: { firm_name: string };
        };
    }
    const [endorsements, setEndorsements] = useState<Endorsement[]>([]);

    useEffect(() => {
        // Mock Endorsements - "Just TSX" implementation
        const MOCK_ENDORSEMENTS: Endorsement[] = [
            {
                id: '1',
                text: "Alex provided critical strategic guidance during our pivot. His network is unmatched in the fintech space.",
                endorser: {
                    name: "Sarah Jenkins",
                    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
                    user_type: "founder",
                    founder_profile: { startup_name: "FinLeap" }
                }
            },
            {
                id: '2',
                text: "One of the most supportive investors I've worked with. Always there when things get tough, not just for the board meetings.",
                endorser: {
                    name: "David Chen",
                    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
                    user_type: "founder",
                    founder_profile: { startup_name: "TechFlow" }
                }
            },
            {
                id: '3',
                text: "A true partner. Helped us close our Series A with key introductions.",
                endorser: {
                    name: "Emily Wang",
                    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
                    user_type: "founder",
                    founder_profile: { startup_name: "DataSense" }
                }
            }
        ];

        setEndorsements(MOCK_ENDORSEMENTS);
    }, [profile]);

    return (
        <div className="flex flex-col gap-8 pb-32 pt-2 relative">
            {/* ... Featured Badge ... */}
            {isFeatured && (
                <div className="px-6 pb-2">
                    <h1 className="text-2xl font-serif font-bold tracking-tight text-white">Featured</h1>
                    <p className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">Top 1% Founders</p>
                </div>
            )}
            {/* Profile Header Section - Redesigned */}
            <section className="relative w-full h-[600px] mb-6 group cursor-pointer overflow-hidden rounded-b-3xl">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url("${image || 'https://github.com/shadcn.png'}")` }}
                >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                </div>

                {!isAd && organicProfile?.is_verified && (
                    <div className="absolute top-4 right-4 bg-white text-black rounded-full p-1.5 shadow-lg z-10">
                        <CheckCircle2 size={16} className="font-bold" />
                    </div>
                )}

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start justify-end h-full">

                    {/* Badges: Stage & Location */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {details?.stage && (
                            <span className="px-4 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                                {details.stage} Stage
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full text-shadow-sm">
                            <MapPin size={12} />
                            {location}
                        </span>
                    </div>

                    {/* Name */}
                    <h1 className="text-6xl font-serif font-bold text-white mb-3 text-shadow-lg leading-tight">
                        {name}
                    </h1>

                    {/* Role & Company */}
                    <div className="flex items-center gap-2 text-gray-200 text-lg font-medium">
                        <Briefcase size={20} className="text-[#C5A059]" />
                        <span>
                            {organicProfile?.user_type === 'founder' ? "Founder" : "Investor"} @ <span className="text-white border-b border-white/30 pb-0.5">{company}</span>
                        </span>
                    </div>
                </div>
            </section>

            {/* Industries Bubbles */}
            {details?.industry && Array.isArray(details.industry) && details.industry.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 px-6 mb-6">
                    {details.industry.map((ind: string, i: number) => (
                        <span key={i} className="px-4 py-1.5 rounded-full border border-gray-700 bg-black/40 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                            {ind}
                        </span>
                    ))}
                </div>
            )}

            {/* Two Boxes: MRR & Backed By */}
            {organicProfile?.user_type === 'founder' && (
                <div className="grid grid-cols-2 gap-4 px-6 mb-8">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-zinc-700 transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">MRR</span>
                        <p className="text-3xl font-serif italic text-white">{details?.mrr || 'N/A'}</p>
                        <div className="absolute top-4 right-4 text-zinc-800 group-hover:text-zinc-700 transition-colors">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-zinc-700 transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Backed By</span>
                        <p className="text-2xl font-serif italic text-white leading-tight break-words">
                            {details?.backed_by || 'No lead yet'}
                        </p>
                        <div className="absolute top-4 right-4 text-zinc-800 group-hover:text-zinc-700 transition-colors">
                            <Rocket size={20} />
                        </div>
                    </div>
                </div>
            )}

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
                {/* ... Existing History Code ... */}
                <div className="relative pl-2">
                    <div className="absolute left-2 top-2 bottom-0 w-px bg-zinc-800"></div>
                    <div className="flex flex-col gap-6">
                        {/* Public Item (Most Recent) */}
                        <div className="relative pl-8 group">
                            <div className="absolute left-[3px] top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-black z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-colors">
                                {publicDeal ? (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-white font-bold text-base">{publicDeal.round} - {publicDeal.company_name}</h4>
                                            <span className="text-[10px] font-bold uppercase text-black bg-white px-2 py-1 rounded">Lead</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wider">{publicDeal.date} • Confidential</p>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-700 h-6 w-6 rounded-full bg-cover bg-center grayscale opacity-80"></div>
                                            <span className="text-xs text-gray-300 font-medium tracking-wide">{publicDeal.sector}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {isPro ? (
                                            <div className="flex items-center justify-center py-6">
                                                <p className="text-gray-500 font-medium text-sm">No history disclosed</p>
                                            </div>
                                        ) : (
                                            <div className="relative overflow-hidden">
                                                <div className="blur-[5px] opacity-40 select-none">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-white font-bold text-base">Series A - TechCo</h4>
                                                        <span className="text-[10px] font-bold uppercase text-gray-500 bg-white/10 px-2 py-1 rounded">Lead</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Jan 2024 • Undisclosed Round</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gray-700 h-6 w-6 rounded-full bg-cover bg-center grayscale opacity-80"></div>
                                                        <span className="text-xs text-gray-300 font-medium tracking-wide">Enterprise</span>
                                                    </div>
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
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Locked/Unlocked Logic - Only show as second item if public deal exists */}
                        {publicDeal && (
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
                        )}
                    </div>
                </div>
            </section>

            {/* Endorsements Section */}
            {endorsements.length > 0 && (
                <section className="px-6 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white text-sm font-bold uppercase tracking-widest">ENDORSEMENTS</h3>
                        <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                            VIEW ALL
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {endorsements.map((e) => (
                            <div key={e.id} className="min-w-[280px] bg-[#111] p-6 rounded-3xl border border-white/5 relative flex flex-col justify-between">
                                <div>
                                    <Quote className="text-zinc-700 mb-4 rotate-180" size={24} />
                                    <p className="text-gray-300 text-sm italic leading-relaxed mb-6">
                                        "{e.text}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-auto border-t border-white/5 pt-4">
                                    <div
                                        className="h-10 w-10 rounded-full bg-cover bg-center bg-gray-700 shrink-0"
                                        style={{ backgroundImage: `url("${e.endorser.avatar_url || 'https://github.com/shadcn.png'}")` }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{e.endorser.name}</p>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider truncate">
                                            {e.endorser.user_type}
                                            {/* We can improve this with company name if we join fetch it */}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="h-24"></div>

            {/* Modals ... */}

            {showMessageModal && organicProfile && (
                <InstantMessageModal
                    receiverId={organicProfile.id}
                    receiverName={name || 'User'}
                    tokenBalance={tokenBalance}
                    onClose={() => setShowMessageModal(false)}
                    onSuccess={handleMessageSuccess}
                    onOpenPurchase={handleOpenPurchase}
                />
            )}

            {showPurchaseModal && (
                <TokenPurchaseModal
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}
        </div>
    );
};
