import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeckLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    check_size: string | null;
    created_at: string;
}

export function AdminDeckLeadsPanel() {
    const [leads, setLeads] = useState<DeckLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            // @ts-ignore - Table likely needs creation in Supabase
            const { data, error } = await supabase
                .from('deck_leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error loading leads:", error);
                return;
            }

            setLeads(data || []);
        } catch (err) {
            console.error("Error loading leads:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Source', 'Check Size', 'Date'];
        const csvContent = [
            headers.join(','),
            ...leads.map(lead => [
                `"${lead.name}"`,
                `"${lead.email}"`,
                `"${lead.phone}"`,
                `"${lead.source}"`,
                `"${lead.check_size || ''}"`,
                `"${new Date(lead.created_at).toLocaleString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `catalyst_deck_leads_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Deck Leads/Acknowledgements</h2>
                <Button onClick={exportCSV} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">From Gate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.filter(l => l.source === 'gate').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Funding Interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.filter(l => l.source === 'funding').length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Check Size</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow key={lead.id}>
                                <TableCell className="text-nowrap">{new Date(lead.created_at).toLocaleString()}</TableCell>
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                <TableCell>{lead.phone}</TableCell>
                                <TableCell>
                                    <Badge variant={lead.source === 'funding' ? 'default' : 'secondary'}>
                                        {lead.source}
                                    </Badge>
                                </TableCell>
                                <TableCell>{lead.check_size || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {leads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No leads found. Please ensure 'deck_leads' table exists in Supabase.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
