import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ExternalLink, Edit2, Rocket, Briefcase, Target, Trash2, DollarSign, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dealflow");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User Profile Data
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Data
    const [dealFlow, setDealFlow] = useState<DealFlowItem[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [investorId, setInvestorId] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);

    // Search Data
    const [companySearchResults, setCompanySearchResults] = useState<{ name: string, sector?: string, stage?: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSearchField, setActiveSearchField] = useState<'deal' | 'portfolio' | null>(null);

    // Interests / Settings Data
    // Interests / Settings Data
    const [details, setDetails] = useState({
        firm_name: "",
        position: "", // TODO: position column doesn't exist in investor_profiles yet
        typical_check_size: "",
        preferred_stage: "",
        location: "",
        leads_rounds: false, // TODO: leads_rounds column doesn't exist yet
        investment_thesis: ""
    });
    const [sectorsOfInterest, setSectorsOfInterest] = useState<string[]>([]);

    // Forms State - Deal Flow
    const [newDeal, setNewDeal] = useState({
        startup_name: "",
        amount: "",
        stage: "",
        key_co_investors: "",
        notes: ""
    });

    // Forms State - Portfolio
    const [newPortfolio, setNewPortfolio] = useState({
        company_name: "",
        company_url: "",
        investment_year: new Date().getFullYear().toString(),
        sector: "",
        investment_stage: "",
        is_lead: false
    });

    const { toast } = useToast();

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setProfileId(user.id);

                // Get User Profile (Name/Avatar)
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (userProfile) {
                    setUserName(userProfile.name);
                    setAvatarUrl(userProfile.avatar_url);
                }

                // Get Investor Profile
                const { data: profile } = await supabase
                    .from('investor_profiles')
                    .select('*')
                    .eq('profile_id', user.id)
                    .single();

                if (profile) {
                    setInvestorId(profile.id);
                    setDetails({
                        firm_name: profile.firm_name || "",
                        position: "", // position column doesn't exist yet
                        typical_check_size: profile.typical_check_size || "",
                        preferred_stage: profile.preferred_stage || "",
                        location: profile.location || "",
                        leads_rounds: false, // leads_rounds column doesn't exist yet
                        investment_thesis: profile.investment_thesis || ""
                    });
                    setSectorsOfInterest(profile.sectors_of_interest || []);

                    // TODO: investor_deal_flow and investor_portfolio tables don't exist yet
                    // Fetch Deal Flow - commented out
                    // const { data: deals } = await supabase
                    //     .from('investor_deal_flow')
                    //     .select('*')
                    //     .eq('investor_id', profile.id)
                    //     .order('created_at', { ascending: false });
                    // if (deals) setDealFlow(deals as DealFlowItem[]);

                    // Fetch Portfolio - commented out
                    // const { data: port } = await supabase
                    //     .from('investor_portfolio')
                    //     .select('*')
                    //     .eq('investor_id', profile.id)
                    //     .order('investment_year', { ascending: false });
                    // if (port) setPortfolio(port as PortfolioItem[]);
                }
            } catch (error) {
                console.error('Error loading portal data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAddDeal = async () => {
        // TODO: investor_deal_flow table doesn't exist yet
        toast({ variant: "destructive", title: "Not available", description: "Deal flow feature requires database migration" });
        return;
        // if (!investorId || !newDeal.startup_name) return;
        // try {
        //     const { data, error } = await supabase
        //         .from('investor_deal_flow')
        //         .insert({
        //             investor_id: investorId,
        //             startup_name: newDeal.startup_name,
        //             amount: newDeal.amount || null,
        //             stage: newDeal.stage || null,
        //             key_co_investors: newDeal.key_co_investors || null,
        //             notes: newDeal.notes || null,
        //             status: 'active'
        //         })
        //         .select()
        //         .single();
        //     if (error) throw error;
        //     if (data) {
        //         setDealFlow([data as DealFlowItem, ...dealFlow]);
        //         setNewDeal({ startup_name: "", amount: "", stage: "", key_co_investors: "", notes: "" });
        //         toast({ title: "Deal added to pipeline" });
        //     }
        // } catch (error: any) {
        //     toast({ variant: "destructive", title: "Failed to add deal", description: error.message });
        // }
    };

    const handleAddPortfolio = async () => {
        // TODO: investor_portfolio table doesn't exist yet
        toast({ variant: "destructive", title: "Not available", description: "Portfolio feature requires database migration" });
        return;
        // if (!investorId || !newPortfolio.company_name) return;
        // try {
        //     const { data, error } = await supabase
        //         .from('investor_portfolio')
        //         .insert({
        //             investor_id: investorId,
        //             company_name: newPortfolio.company_name,
        //             investment_year: parseInt(newPortfolio.investment_year) || null,
        //             sector: newPortfolio.sector || null,
        //             investment_stage: newPortfolio.investment_stage || null,
        //             is_lead: newPortfolio.is_lead,
        //             company_url: newPortfolio.company_url || null
        //         })
        //         .select()
        //         .single();
        //     if (error) throw error;
        //     if (data) {
        //         setPortfolio([data as PortfolioItem, ...portfolio]);
        //         setNewPortfolio({
        //             company_name: "", company_url: "",
        //             investment_year: new Date().getFullYear().toString(),
        //             sector: "", investment_stage: "", is_lead: false
        //         });
        //         toast({ title: "Investment added to portfolio" });
        //     }
        // } catch (error: any) {
        //     toast({ variant: "destructive", title: "Failed to add portfolio item", description: error.message });
        // }
    };
    const saveInterests = async () => {
        if (!profileId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('investor_profiles')
                .update({
                    firm_name: details.firm_name,
                    // position: details.position, // column doesn't exist yet
                    typical_check_size: details.typical_check_size,
                    preferred_stage: details.preferred_stage as any,
                    location: details.location,
                    // leads_rounds: details.leads_rounds, // column doesn't exist yet
                    investment_thesis: details.investment_thesis,
                    sectors_of_interest: sectorsOfInterest
                })
                .eq('profile_id', profileId);

            if (error) throw error;
            toast({ title: "Interests updated successfully" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to save", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const searchCompanies = async (query: string, type: 'deal' | 'portfolio') => {
        if (!query || query.length < 2) {
            setCompanySearchResults([]);
            return;
        }

        setIsSearching(true);
        setActiveSearchField(type);

        try {
            const { data } = await supabase
                .from('founder_profiles')
                .select('startup_name, industry')
                .ilike('startup_name', `%${query}%`)
                .limit(5);

            if (data) {
                setCompanySearchResults(data.map((d: any) => ({
                    name: d.startup_name,
                    sector: Array.isArray(d.industry) ? d.industry[0] : d.industry,
                })));
            }
        } catch (error) {
            console.error("Error searching companies:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectCompany = (company: { name: string, sector?: string }, type: 'deal' | 'portfolio') => {
        if (type === 'deal') {
            setNewDeal(prev => ({ ...prev, startup_name: company.name }));
        } else {
            setNewPortfolio(prev => ({
                ...prev,
                company_name: company.name,
                sector: company.sector || prev.sector
            }));
        }
        setCompanySearchResults([]);
        setActiveSearchField(null);
    };

    const toggleSector = (sector: string) => {
        setSectorsOfInterest(prev => prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]);
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="hover:bg-zinc-800 p-2 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-serif font-bold tracking-wide">Investor Portal</h1>
                </div>
                {activeTab === 'interests' && (
                    <button
                        onClick={saveInterests}
                        disabled={saving}
                        className="text-[10px] font-bold uppercase tracking-wider bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                )}
            </header>

            <div className="p-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-white/30">{userName?.charAt(0) || "I"}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-bold">{userName || "New Investor"}</h2>
                        <p className="text-sm text-gray-500">{details.firm_name || "Firm not set"} • {details.location || "Location not set"}</p>
                    </div>
                </div>

                <Tabs defaultValue="dealflow" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full bg-zinc-900/50 border border-white/10 rounded-full p-1 mb-8 sticky top-20 z-40 backdrop-blur-md">
                        <TabsTrigger value="dealflow" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest py-3 transition-all">
                            Deal Flow
                        </TabsTrigger>
                        <TabsTrigger value="interests" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest py-3 transition-all">
                            Interests
                        </TabsTrigger>
                        <TabsTrigger value="portfolio" className="flex-1 rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest py-3 transition-all">
                            Portfolio
                        </TabsTrigger>
                    </TabsList>

                    {/* DEAL FLOW TAB */}
                    <TabsContent value="dealflow" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Add Deal Input */}
                        <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={16} className="text-emerald-500" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add New Deal</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Startup Name (e.g. Acme AI)"
                                            value={newDeal.startup_name}
                                            onChange={e => {
                                                setNewDeal({ ...newDeal, startup_name: e.target.value });
                                                searchCompanies(e.target.value, 'deal');
                                            }}
                                            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                        />
                                        {isSearching && activeSearchField === 'deal' && (
                                            <div className="absolute right-3 top-3.5"><Loader2 className="animate-spin text-zinc-500" size={16} /></div>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {activeSearchField === 'deal' && companySearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                                            {companySearchResults.map((result, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectCompany(result, 'deal')}
                                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{result.name}</span>
                                                    {result.sector && <span className="text-[10px] uppercase tracking-wider text-zinc-500">{result.sector}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Amount ($)"
                                        value={newDeal.amount}
                                        onChange={e => setNewDeal({ ...newDeal, amount: e.target.value })}
                                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                    />
                                    <select
                                        value={newDeal.stage}
                                        onChange={e => setNewDeal({ ...newDeal, stage: e.target.value })}
                                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none text-gray-300"
                                    >
                                        <option value="">Stage...</option>
                                        {FUNDING_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Key Co-Investors (Optional)"
                                    value={newDeal.key_co_investors}
                                    onChange={e => setNewDeal({ ...newDeal, key_co_investors: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                />
                                <textarea
                                    placeholder="Private Notes..."
                                    value={newDeal.notes}
                                    onChange={e => setNewDeal({ ...newDeal, notes: e.target.value })}
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700 resize-none h-20"
                                />
                            </div>
                            <button
                                onClick={handleAddDeal}
                                disabled={!newDeal.startup_name}
                                className="w-full bg-white text-black font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Pipeline
                            </button>
                        </div>

                        {/* Deal List */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-2 mb-4">Pipeline ({dealFlow.length})</h3>
                            {dealFlow.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-gray-500 text-sm">No active deals being tracked.</p>
                                </div>
                            ) : (
                                dealFlow.map(deal => (
                                    <div key={deal.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between group hover:border-zinc-700 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                {deal.startup_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-base text-white">{deal.startup_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-emerald-400 font-medium">{deal.amount || 'N/A'}</span>
                                                    <span className="text-[10px] text-gray-600">•</span>
                                                    <span className="text-xs text-gray-400">{deal.stage}</span>
                                                </div>
                                                {deal.notes && <p className="text-xs text-gray-600 mt-2 italic line-clamp-1">{deal.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold uppercase text-gray-400">
                                                {deal.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* INTERESTS TAB */}
                    <TabsContent value="interests" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Firm Name</label>
                                    <input
                                        type="text"
                                        value={details.firm_name}
                                        onChange={e => setDetails({ ...details, firm_name: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Position</label>
                                    <input
                                        type="text"
                                        value={details.position}
                                        onChange={e => setDetails({ ...details, position: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Investment Thesis</label>
                                <textarea
                                    value={details.investment_thesis}
                                    onChange={e => setDetails({ ...details, investment_thesis: e.target.value })}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors min-h-[100px] resize-y"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Ideal Stage</label>
                                <div className="flex flex-wrap gap-2">
                                    {FUNDING_STAGES.map(stage => (
                                        <button
                                            key={stage.value}
                                            onClick={() => setDetails({ ...details, preferred_stage: stage.value })}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${details.preferred_stage === stage.value ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'}`}
                                        >
                                            {stage.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Ticket Size</label>
                                <input
                                    type="text"
                                    value={details.typical_check_size}
                                    onChange={e => setDetails({ ...details, typical_check_size: e.target.value })}
                                    placeholder="$25k - $100k"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">Location Preference</label>
                                <input
                                    type="text"
                                    value={details.location}
                                    onChange={e => setDetails({ ...details, location: e.target.value })}
                                    placeholder="Global / Remote"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                />
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1 mb-2 block">Sectors</label>
                                <div className="flex flex-wrap gap-2">
                                    {INDUSTRIES.map(ind => (
                                        <button
                                            key={ind}
                                            onClick={() => toggleSector(ind)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border ${sectorsOfInterest.includes(ind) ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-zinc-800 hover:border-zinc-600'}`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <button
                                    onClick={() => setDetails({ ...details, leads_rounds: !details.leads_rounds })}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${details.leads_rounds ? 'bg-emerald-950/30 border-emerald-900' : 'bg-zinc-900/30 border-zinc-800'}`}
                                >
                                    <span className={`text-sm font-bold ${details.leads_rounds ? 'text-emerald-400' : 'text-gray-400'}`}>Leads Rounds?</span>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${details.leads_rounds ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${details.leads_rounds ? 'translate-x-full' : ''}`} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PORTFOLIO TAB */}
                    <TabsContent value="portfolio" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Add Portfolio Input */}
                        <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Rocket size={16} className="text-blue-500" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Investment</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Company Name"
                                            value={newPortfolio.company_name}
                                            onChange={e => {
                                                setNewPortfolio({ ...newPortfolio, company_name: e.target.value });
                                                searchCompanies(e.target.value, 'portfolio');
                                            }}
                                            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                        />
                                        {isSearching && activeSearchField === 'portfolio' && (
                                            <div className="absolute right-3 top-3.5"><Loader2 className="animate-spin text-zinc-500" size={16} /></div>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {activeSearchField === 'portfolio' && companySearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                                            {companySearchResults.map((result, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectCompany(result, 'portfolio')}
                                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{result.name}</span>
                                                    {result.sector && <span className="text-[10px] uppercase tracking-wider text-zinc-500">{result.sector}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Year (e.g. 2023)"
                                        value={newPortfolio.investment_year}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, investment_year: e.target.value })}
                                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700"
                                    />
                                    <select
                                        value={newPortfolio.sector}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, sector: e.target.value })}
                                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none text-gray-300"
                                    >
                                        <option value="">Sector...</option>
                                        {INDUSTRIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={newPortfolio.investment_stage}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, investment_stage: e.target.value })}
                                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none text-gray-300"
                                    >
                                        <option value="">Stage...</option>
                                        {FUNDING_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                    <div className="flex items-center gap-3 px-2">
                                        <label className="text-xs text-gray-400">Lead Investor?</label>
                                        <input
                                            type="checkbox"
                                            checked={newPortfolio.is_lead || false}
                                            onChange={e => setNewPortfolio({ ...newPortfolio, is_lead: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-700 bg-black text-white focus:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleAddPortfolio}
                                disabled={!newPortfolio.company_name}
                                className="w-full bg-white text-black font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Portfolio
                            </button>
                        </div>

                        {/* Portfolio List */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 pl-2 mb-4">Current Holdings ({portfolio.length})</h3>
                            {portfolio.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                                    <p className="text-gray-500 text-sm">No investments added yet.</p>
                                </div>
                            ) : (
                                portfolio.map(item => (
                                    <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            {item.company_image_url ? (
                                                <Avatar className="h-10 w-10 border border-white/10">
                                                    <AvatarImage src={item.company_image_url} />
                                                    <AvatarFallback>{item.company_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {item.company_name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="font-bold text-base text-white flex items-center gap-2">
                                                    {item.company_name}
                                                    {item.is_lead && <span className="text-[8px] bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase">Lead</span>}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-green-400 font-medium">Inv. {item.investment_year}</span>
                                                    <span className="text-[10px] text-gray-500">• {item.investment_stage}</span>
                                                    <span className="text-[10px] text-gray-500">• {item.sector}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                            <Edit2 size={14} />
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
