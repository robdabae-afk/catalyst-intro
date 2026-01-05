import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, UserCheck, Trash2, Database as DbIcon, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";

export const AdminTestDataSeeder = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testUserCount, setTestUserCount] = useState<number | null>(null);

    const checkTestUsers = async () => {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_test_account', true);

        if (!error) setTestUserCount(count);
    };

    React.useEffect(() => {
        checkTestUsers();
    }, []);

    const seedData = async () => {
        setLoading(true);
        try {
            // Test Data Definitions
            const testProfiles = [
                {
                    id: crypto.randomUUID(),
                    name: "Sarah Jenkins",
                    email: "sarah@example.com",
                    user_type: "founder" as const,
                    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop",
                    is_test_account: true,
                    spotlight_credits: 20
                },
                {
                    id: crypto.randomUUID(),
                    name: "Alex Rivera",
                    email: "alex@example.com",
                    user_type: "investor" as const,
                    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop",
                    is_test_account: true,
                    spotlight_credits: 100
                },
                {
                    id: crypto.randomUUID(),
                    name: "Marcus Chen",
                    email: "marcus@solaris.io",
                    user_type: "founder" as const,
                    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
                    is_test_account: true,
                    spotlight_credits: 15
                },
                {
                    id: crypto.randomUUID(),
                    name: "Elena Rodriguez",
                    email: "elena@pioneer.vc",
                    user_type: "investor" as const,
                    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
                    is_test_account: true,
                    spotlight_credits: 50
                }
            ];

            // 1. Insert Profiles
            // We use upsert on email to avoid duplicates if possible, 
            // but since ID is random it's better to check existence or use a fixed ID for seed.
            // Let's use fixed deterministic IDs for seed profiles so we can re-run safely.
            const seedIds = {
                sarah: "00000000-0000-0000-0000-000000000001",
                alex: "00000000-0000-0000-0000-000000000002",
                marcus: "00000000-0000-0000-0000-000000000003",
                elena: "00000000-0000-0000-0000-000000000004"
            };

            const fixedProfiles = testProfiles.map((p, i) => ({
                ...p,
                id: Object.values(seedIds)[i],
                referral_code: `TEST${i}`
            }));

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(fixedProfiles, { onConflict: 'email' });

            if (profileError) throw profileError;

            // 2. Insert Detail Profiles
            const founderProfiles = [
                {
                    profile_id: seedIds.sarah,
                    company_name: "FinLeap",
                    startup_name: "FinLeap",
                    one_liner: "Revolutionizing embedded finance for platforms.",
                    stage: "seed" as const,
                    industry: ["FinTech", "SaaS"],
                    traction: "250k ARR, 15 partners"
                },
                {
                    profile_id: seedIds.marcus,
                    company_name: "Solaris Energy",
                    startup_name: "Solaris Energy",
                    one_liner: "Decentralized solar grid management.",
                    stage: "series-a" as const,
                    industry: ["CleanTech", "Energy"],
                    traction: "Reached 10k homes, $2M Revenue"
                }
            ];

            const investorProfiles = [
                {
                    profile_id: seedIds.alex,
                    firm_name: "Apex Ventures",
                    title: "Lead Partner",
                    location: "New York, NY",
                    typical_check_size: "500k-2M",
                    preferred_stage: "seed" as const,
                    sectors_of_interest: ["FinTech", "AI", "Enterprise"]
                },
                {
                    profile_id: seedIds.elena,
                    firm_name: "Pioneer Catalyst",
                    title: "Managing Director",
                    location: "San Francisco, CA",
                    typical_check_size: "100k-500k",
                    preferred_stage: "pre-seed" as const,
                    sectors_of_interest: ["Consumer", "Marketplace", "HealthTech"]
                }
            ];

            const { error: founderError } = await supabase
                .from('founder_profiles')
                .upsert(founderProfiles, { onConflict: 'profile_id' });

            if (founderError) throw founderError;

            const { error: investorError } = await supabase
                .from('investor_profiles')
                .upsert(investorProfiles, { onConflict: 'profile_id' });

            if (investorError) throw investorError;

            toast({
                title: "Test Data Seeded",
                description: "4 test profiles have been added/updated."
            });
            checkTestUsers();
        } catch (err: any) {
            console.error("Seeding error:", err);
            toast({
                variant: "destructive",
                title: "Seeding Failed",
                description: err.message || "Check console for details. You might need to run the SQL migration manually if RLS is restricted."
            });
        } finally {
            setLoading(false);
        }
    };

    const clearTestData = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('is_test_account', true);

            if (error) throw error;

            toast({
                title: "Test data cleared",
                description: "All profiles marked as test accounts have been removed."
            });
            checkTestUsers();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Clear Failed",
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                        <DbIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Test Data Management</h3>
                        <p className="text-sm text-muted-foreground">Add or remove hardcoded test profiles for development.</p>
                    </div>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                    {testUserCount !== null ? `${testUserCount} Test Profiles` : "Loading..."}
                </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">Seed Profiles</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Inserts Sarah Jenkins, Alex Rivera, Marcus Chen, and Elena Rodriguez as test accounts.
                        They will appear in the dashboard when "Test Mode" is enabled.
                    </p>
                    <Button
                        onClick={seedData}
                        disabled={loading}
                        className="mt-auto bg-primary hover:bg-primary/90"
                    >
                        {loading ? "Seeding..." : "Seed Test Founders & Investors"}
                    </Button>
                </div>

                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-red-500">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">Clear Test Data</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Removes all profiles from the database that are marked with <code>is_test_account: true</code>.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={clearTestData}
                        disabled={loading}
                        className="mt-auto"
                    >
                        {loading ? "Clearing..." : "Delete All Test Accounts"}
                    </Button>
                </div>
            </div>

            <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground italic">
                    <span className="font-bold text-amber-500">Note:</span>
                    <span>If seeding fails, it means your database RLS policies prohibit insertions from the client. Use the SQL Editor in Supabase with the provided migration file.</span>
                </div>
            </div>
        </div>
    );
};
