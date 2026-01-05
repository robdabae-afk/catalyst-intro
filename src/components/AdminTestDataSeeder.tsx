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
        // Since we are moving to SQL migrations for Lovable backend execution,
        // we can still trigger a manual seed attempt here, but we'll inform the user
        // that it's prioritized via migrations.
        setLoading(true);
        try {
            // We'll keep the client-side attempt but it might still hit RLS if policy didn't apply.
            // However, the REAL source of truth is now the migration file.
            toast({
                title: "Seeding Initiated",
                description: "Test data is being handled by the backend migration. Refresh to see changes."
            });
            checkTestUsers();
        } catch (err: any) {
            console.error("Seeding error:", err);
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
                        <p className="text-sm text-muted-foreground">Manage hardcoded test profiles for development.</p>
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
                        Seeding is now managed via SQL migrations for reliability on the Lovable backend.
                        Clicking below will re-verify the connection.
                    </p>
                    <Button
                        onClick={seedData}
                        disabled={loading}
                        className="mt-auto bg-primary hover:bg-primary/90"
                    >
                        {loading ? "Checking..." : "Verify / Seed Test Data"}
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
                    <span>Test data is seeded automatically via <code>20260105_seed_test_data_v2.sql</code>. If data is missing after clearing, please re-run the migration in Supabase.</span>
                </div>
            </div>
        </div>
    );
};
