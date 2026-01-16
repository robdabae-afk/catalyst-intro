import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ExternalLink, Edit2, Rocket, Briefcase, Target, Trash2 } from "lucide-react";

// Types
type DealFlowItem = {
    id: string;
    startup_name: string;
    amount: string | null;
    stage: string | null;
    key_co_investors: string | null;
    verticals: string[] | null;
    notes: string | null;
    status: string | null;
};

type PortfolioItem = {
    id: string;
    company_name: string;
    company_url: string | null;
    company_image_url: string | null;
    investment_stage: string | null;
    investment_year: number | null;
    sector: string | null;
    is_lead: boolean | null;
};

export default function InvestorPortal() {
    const [activeTab, setActiveTab] = useState("dealflow");
    const [loading, setLoading] = useState(true);
    const [dealFlow, setDealFlow] = useState<DealFlowItem[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [investorId, setInvestorId] = useState<string | null>(null);
    const { toast } = useToast();

    // Fetch initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Investor Profile ID
            const { data: profile } = await supabase
                .from('investor_profiles')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (profile) {
                setInvestorId(profile.id);

                // Fetch Deal Flow
                const { data: deals } = await supabase
                    .from('investor_deal_flow')
                    .select('*')
                    .eq('investor_id', profile.id)
                    .order('created_at', { ascending: false });

                if (deals) setDealFlow(deals as DealFlowItem[]);

                // Fetch Portfolio
                const { data: port } = await supabase
                    .from('investor_portfolio')
                    .select('*')
                    .eq('investor_id', profile.id)
                    .order('investment_year', { ascending: false });

                if (port) setPortfolio(port as PortfolioItem[]);
            }
        } catch (error) {
            console.error('Error loading portal data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-serif font-bold tracking-wide">Investor Portal</h1>
                <button className="text-xs font-bold uppercase tracking-wider bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
                    Save
                </button>
            </header>

            <div className="p-6">
                <Tabs defaultValue="dealflow" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full bg-zinc-900/50 border border-white/10 rounded-full p-1 mb-8">
                        <TabsTrigger value="dealflow" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-xs font-bold uppercase tracking-widest py-2.5">
                            Deal Flow
                        </TabsTrigger>
                        <TabsTrigger value="interests" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-xs font-bold uppercase tracking-widest py-2.5">
                            Interests
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-xs font-bold uppercase tracking-widest py-2.5">
                            Portfolio
                        </TabsTrigger>
                    </TabsList>

                    {/* DEAL FLOW TAB */}
                    <TabsContent value="dealflow" className="space-y-6">
                        {/* Add Deal Input */}
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Add New Deal</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <input type="text" placeholder="Startup Name (e.g. Acme AI)" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Amount ($)" className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
                                    <select className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none text-gray-400">
                                        <option>Select Stage</option>
                                        <option value="Pre-seed">Pre-seed</option>
                                        <option value="Seed">Seed</option>
                                        <option value="Series A">Series A</option>
                                    </select>
                                </div>
                                <input type="text" placeholder="Key Co-Investors (Optional)" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
                            </div>
                            <button className="w-full bg-white text-black font-bold uppercase tracking-wider text-xs py-3 rounded-xl mt-2 hover:bg-gray-200 transition-colors">
                                Add to Deal Flow
                            </button>
                        </div>

                        {/* Deal List */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-2">Current Activity</h3>
                            {dealFlow.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">No active deals yet.</div>
                            ) : (
                                dealFlow.map(deal => (
                                    <div key={deal.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-white">{deal.startup_name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{deal.status} • {deal.stage}</p>
                                        </div>
                                        <button className="p-2 text-gray-600 hover:text-white transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* INTERESTS TAB */}
                    <TabsContent value="interests">
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6 text-center text-gray-500">
                            Interests Settings Placeholder
                            {/* Re-use Settings components here later */}
                        </div>
                    </TabsContent>

                    {/* PORTFOLIO TAB */}
                    <TabsContent value="portfolio" className="space-y-6">
                        {/* Add Portfolio Input */}
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Add Investment</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Company Name" className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
                                    <button className="bg-zinc-800 rounded-xl px-4 text-white hover:bg-zinc-700 transition-colors">
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio List */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-2">Current Holdings ({portfolio.length})</h3>
                            {portfolio.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">No investments added yet.</div>
                            ) : (
                                portfolio.map(item => (
                                    <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                                {item.company_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{item.company_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-green-400 font-medium">Invested {item.investment_year}</span>
                                                    <span className="text-[10px] text-gray-500">• {item.sector}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-gray-600 hover:text-white transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
