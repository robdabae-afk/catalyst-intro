
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Lock, UploadCloud, Plus, Trash2, TrendingUp, Users, DollarSign, Building2, Save } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types based on our schema
interface TeamMember {
    id: string;
    name: string;
    role: string;
    linkedin_url?: string;
    image_url?: string;
    is_core: boolean;
}

interface FundingRound {
    id: string;
    round_type: string;
    amount: number;
    date: string;
    valuation?: number;
    investors?: string[];
}

export const FounderProfileInput = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState("company");
    const [loading, setLoading] = useState(false);

    // Form States
    const [companyInfo, setCompanyInfo] = useState({
        company_name: "",
        one_liner: "",
        industry: [] as string[],
        startup_name: "" // Synced with company_name usually, but separate in DB schema
    });

    const [metrics, setMetrics] = useState({
        mrr: "",
        user_growth: "",
        burn_rate: "",
        valuation: "" // Current valuation estimate
    });

    const [funding, setFunding] = useState({
        total_raised: "", // Calculated or manual? Using manual for now as 'funding_amount' exists
        rounds: [] as FundingRound[],
        advisor_investments: [] as { id: string; advisor_name: string; amount: number; investment_date: string }[]
    });

    const [team, setTeam] = useState<TeamMember[]>([]);

    // New Team Member Form State
    const [newMember, setNewMember] = useState<Partial<TeamMember>>({});
    const [newRound, setNewRound] = useState<Partial<FundingRound>>({});

    // New Advisor Investment State
    const [newAdvisorInvestment, setNewAdvisorInvestment] = useState({
        advisor_name: "",
        amount: "",
        investment_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Check if investor
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', user.id)
                .single();

            if (profile?.user_type === 'investor') {
                navigate('/dashboard');
                return;
            }

            // Fetch Founder Profile Data
            const { data: founderProfile } = await supabase
                .from('founder_profiles')
                .select('*')
                .eq('id', user.id) // founder_profiles.id is same as auth.id usually? 
                // wait, schema says id is uuid primary key, profile_id is fk.
                // Looking at schema: founder_profiles.id is PK, profile_id FK.
                // Usually query by profile_id = user.id
                .eq('profile_id', user.id)
                .single();

            if (founderProfile) {
                setCompanyInfo({
                    company_name: founderProfile.company_name || "",
                    one_liner: founderProfile.one_liner || "",
                    industry: founderProfile.industry || [],
                    startup_name: founderProfile.startup_name || ""
                });
                // Metrics are not stored in founder_profiles table yet
                // Setting empty defaults since these columns don't exist
                setMetrics({
                    mrr: "",
                    user_growth: "",
                    burn_rate: "",
                    valuation: ""
                });
            }

            // Note: team_members and funding_rounds tables don't exist yet
            // Commenting out these queries until tables are created
            /*
            const { data: teamData } = await supabase
                .from('team_members')
                .select('*')
                .eq('founder_id', user.id);

            if (teamData) setTeam(teamData);

            const { data: roundsData } = await supabase
                .from('funding_rounds')
                .select('*')
                .eq('founder_id', user.id);

            if (roundsData) setFunding(prev => ({ ...prev, rounds: roundsData }));
            */
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            // Update Founder Profile (only with columns that exist)
            const { error: profileError } = await supabase
                .from('founder_profiles')
                .update({
                    company_name: companyInfo.company_name,
                    startup_name: companyInfo.company_name, // Syncing for now
                    one_liner: companyInfo.one_liner,
                    industry: companyInfo.industry
                    // Note: mrr, user_growth, burn_rate, valuation columns don't exist yet
                })
                .eq('profile_id', userId);

            if (profileError) throw profileError;

            toast.success("Profile saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const addTeamMember = async () => {
        if (!userId || !newMember.name || !newMember.role) return;
        // Note: team_members table doesn't exist yet - mocking locally
        const mockMember: TeamMember = {
            id: crypto.randomUUID(),
            name: newMember.name,
            role: newMember.role,
            linkedin_url: newMember.linkedin_url,
            is_core: true
        };
        setTeam([...team, mockMember]);
        setNewMember({});
        toast.success("Team member added (local only)");
    };

    const deleteTeamMember = async (id: string) => {
        setTeam(team.filter(m => m.id !== id));
        toast.success("Member removed");
    };

    const addFundingRound = async () => {
        if (!userId || !newRound.round_type || !newRound.amount) return;
        // Note: funding_rounds table doesn't exist yet - mocking locally
        const mockRound: FundingRound = {
            id: crypto.randomUUID(),
            round_type: newRound.round_type,
            amount: newRound.amount,
            date: newRound.date || new Date().toISOString(),
            valuation: newRound.valuation
        };
        setFunding(prev => ({ ...prev, rounds: [...prev.rounds, mockRound] }));
        setNewRound({});
        toast.success("Funding round added (local only)");
    };

    const addAdvisorInvestment = async () => {
        if (!userId || !newAdvisorInvestment.advisor_name || !newAdvisorInvestment.amount) return;
        // Note: advisor_investments table doesn't exist yet - mocking locally
        const mockInvestment = {
            id: crypto.randomUUID(),
            advisor_name: newAdvisorInvestment.advisor_name,
            amount: parseFloat(newAdvisorInvestment.amount),
            investment_date: newAdvisorInvestment.investment_date
        };
        setFunding(prev => ({ ...prev, advisor_investments: [...prev.advisor_investments, mockInvestment] }));
        setNewAdvisorInvestment({ advisor_name: "", amount: "", investment_date: new Date().toISOString().split('T')[0] });
        toast.success("Advisor investment added (local only)");
    };

    const sections = [
        { id: "company", label: "Company Info", icon: Building2 },
        { id: "metrics", label: "Key Metrics", icon: TrendingUp },
        { id: "funding", label: "Funding", icon: DollarSign },
        { id: "team", label: "Team", icon: Users },
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-luxury-gold selection:text-black">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 sticky top-0 bg-black/90 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-serif font-bold tracking-tight text-white">
                        Update Profile
                    </h1>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Completeness</p>
                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[65%] rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1
                                ${activeSection === section.id
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }
                            `}
                        >
                            {/* <section.icon className="w-4 h-4" /> */}
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6 space-y-6">

                {/* COMPANY INFO SECTION */}
                {activeSection === "company" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Company Name</Label>
                            <Input
                                value={companyInfo.company_name}
                                onChange={e => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                                placeholder="e.g. Acme AI"
                                className="bg-zinc-950 border-white/10 text-white h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">One-Liner</Label>
                            <Input
                                value={companyInfo.one_liner}
                                onChange={e => setCompanyInfo({ ...companyInfo, one_liner: e.target.value })}
                                placeholder="Describe slightly more about your company..."
                                className="bg-zinc-950 border-white/10 text-white h-12"
                            />
                        </div>
                        <div className="pt-4">
                            <div className="w-full h-32 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                                    <UploadCloud className="text-zinc-500 group-hover:text-white transition-colors" size={24} />
                                </div>
                                <p className="text-xs text-zinc-600 font-medium group-hover:text-zinc-400">Upload Pitch Deck (PDF)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* METRICS SECTION */}
                {activeSection === "metrics" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/30">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-luxury-gold" />
                                Key Metrics
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Monthly Recurring Revenue</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <Input
                                            value={metrics.mrr}
                                            onChange={e => setMetrics({ ...metrics, mrr: e.target.value })}
                                            placeholder="0"
                                            className="bg-black border-white/10 text-white h-12 pl-8 text-lg font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Net Burn Rate</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                        <Input
                                            value={metrics.burn_rate}
                                            onChange={e => setMetrics({ ...metrics, burn_rate: e.target.value })}
                                            placeholder="0"
                                            className="bg-black border-white/10 text-white h-12 pl-8 text-lg font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">User Growth (MoM)</Label>
                                    <div className="relative">
                                        <Input
                                            value={metrics.user_growth}
                                            onChange={e => setMetrics({ ...metrics, user_growth: e.target.value })}
                                            placeholder="0"
                                            className="bg-black border-white/10 text-white h-12 pr-8 text-lg font-mono"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FUNDING SECTION */}
                {activeSection === "funding" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10">
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Raised To Date</p>
                            <p className="text-4xl font-serif font-bold text-white mb-4">$4.2M</p>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase">Last Round</p>
                                    <p className="text-sm font-bold text-white">Seed</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase">Valuation</p>
                                    <p className="text-sm font-bold text-white">$18.5M</p>
                                </div>
                            </div>
                        </div>

                        {/* Existing Rounds List */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Funding Rounds</h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-zinc-800">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Add Funding Round</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Round Type</Label>
                                                <Select onValueChange={v => setNewRound({ ...newRound, round_type: v })}>
                                                    <SelectTrigger className="bg-zinc-900 border-white/10">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                                                        <SelectItem value="Seed">Seed</SelectItem>
                                                        <SelectItem value="Series A">Series A</SelectItem>
                                                        <SelectItem value="Series B">Series B</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Amount</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-zinc-900 border-white/10"
                                                    onChange={e => setNewRound({ ...newRound, amount: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={addFundingRound} className="w-full bg-white text-black hover:bg-zinc-200">
                                            Add Round
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {funding.rounds.length === 0 && (
                                <p className="text-sm text-zinc-600 italic">No funding rounds added yet.</p>
                            )}

                            {funding.rounds.map((round) => (
                                <div key={round.id} className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                    <div>
                                        <p className="font-bold text-white">{round.round_type}</p>
                                        <p className="text-xs text-zinc-500">{new Date(round.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm text-luxury-gold">${round.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Advisor Investments Logic */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Advisor Funding</h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-zinc-800">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Add Advisor Investment</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Advisor Name</Label>
                                                <Input
                                                    className="bg-zinc-900 border-white/10"
                                                    value={newAdvisorInvestment.advisor_name}
                                                    onChange={e => setNewAdvisorInvestment({ ...newAdvisorInvestment, advisor_name: e.target.value })}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Amount</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-zinc-900 border-white/10"
                                                    value={newAdvisorInvestment.amount}
                                                    onChange={e => setNewAdvisorInvestment({ ...newAdvisorInvestment, amount: e.target.value })}
                                                    placeholder="10000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <Input
                                                    type="date"
                                                    className="bg-zinc-900 border-white/10"
                                                    value={newAdvisorInvestment.investment_date}
                                                    onChange={e => setNewAdvisorInvestment({ ...newAdvisorInvestment, investment_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={addAdvisorInvestment} className="w-full bg-white text-black hover:bg-zinc-200">
                                            Add Investment
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {funding.advisor_investments.length === 0 && (
                                <p className="text-sm text-zinc-600 italic">No advisor investments added yet.</p>
                            )}

                            {funding.advisor_investments.map((inv) => (
                                <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">{inv.advisor_name}</p>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-zinc-400 uppercase">Advisor</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">{new Date(inv.investment_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm text-luxury-gold">${inv.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TEAM SECTION */}
                {activeSection === "team" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h2 className="text-lg font-bold text-white">Core Team</h2>
                                <p className="text-xs text-zinc-500">Highlight your key talent.</p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-transparent hover:bg-white/5 text-white">
                                        <Plus className="w-4 h-4" /> Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-950 border-white/10 text-white">
                                    <DialogHeader>
                                        <DialogTitle>Add Team Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                className="bg-zinc-900 border-white/10"
                                                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Input
                                                className="bg-zinc-900 border-white/10"
                                                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>LinkedIn URL</Label>
                                            <Input
                                                className="bg-zinc-900 border-white/10"
                                                onChange={e => setNewMember({ ...newMember, linkedin_url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={addTeamMember} className="w-full bg-white text-black hover:bg-zinc-200">
                                        Add Member
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="space-y-3">
                            {team.map((member) => (
                                <div key={member.id} className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors">
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={member.image_url} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
                                            {member.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-white">{member.name}</h4>
                                            {member.linkedin_url && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0077b5]/20 text-[#0077b5] font-medium">in</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{member.role}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500"
                                        onClick={() => deleteTeamMember(member.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {team.length === 0 && (
                                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                                    <p className="text-zinc-600 text-sm">No team members added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black via-black/95 to-transparent z-10">
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full h-14 bg-white text-black rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-zinc-200"
                >
                    {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Profile</>}
                </Button>
            </div>

            <BottomNavigation />
        </div>
    );
};

export default FounderProfileInput;
