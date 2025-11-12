import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";

const CapTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCapTable();
  }, []);

  const loadCapTable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('cap_table_entries')
        .select(`
          *,
          investor:investor_id (
            name,
            investor_profiles (firm_name)
          )
        `)
        .eq('founder_id', user.id)
        .order('investment_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading cap table",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/safe')}>
            <Plus className="w-4 h-4 mr-2" />
            Create SAFE
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Cap Table</CardTitle>
            <CardDescription>Track your equity and investments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No investments yet</p>
                <Button onClick={() => navigate('/safe')}>
                  Create Your First SAFE
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Equity %</TableHead>
                    <TableHead className="text-right">Valuation</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.investor?.name}</TableCell>
                      <TableCell>{entry.investor?.investor_profiles?.[0]?.firm_name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.investment_amount)}</TableCell>
                      <TableCell className="text-right">{entry.equity_percentage ? `${entry.equity_percentage}%` : '-'}</TableCell>
                      <TableCell className="text-right">{entry.valuation ? formatCurrency(entry.valuation) : '-'}</TableCell>
                      <TableCell>{entry.investment_date ? new Date(entry.investment_date).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CapTable;
