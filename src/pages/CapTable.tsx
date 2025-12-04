import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calculator } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CapTableEntry {
  id: string;
  investment_amount: number;
  equity_percentage: number | null;
  valuation: number | null;
  investment_date: string | null;
  safe_id: string | null;
  investor: {
    name: string;
    investor_profiles: { firm_name: string } | null;
  } | null;
}

interface DilutionScenario {
  newInvestment: number;
  preMoneyValuation: number;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
];

const CapTable = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<CapTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [founderEquity, setFounderEquity] = useState(100);
  const [dilutionScenario, setDilutionScenario] = useState<DilutionScenario>({
    newInvestment: 1000000,
    preMoneyValuation: 10000000,
  });

  useEffect(() => {
    loadCapTable();
  }, []);

  useEffect(() => {
    // Calculate founder equity based on total investor equity
    const totalInvestorEquity = entries.reduce((sum, entry) => sum + (entry.equity_percentage || 0), 0);
    setFounderEquity(Math.max(0, 100 - totalInvestorEquity));
  }, [entries]);

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
          investor:profiles!cap_table_entries_investor_id_fkey (
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

  // Calculate ownership breakdown for pie chart
  const getOwnershipData = () => {
    const data = entries
      .filter(entry => entry.equity_percentage && entry.equity_percentage > 0)
      .map(entry => ({
        name: entry.investor?.name || 'Unknown',
        value: entry.equity_percentage || 0,
        firm: entry.investor?.investor_profiles?.firm_name || '',
      }));

    if (founderEquity > 0) {
      data.unshift({ name: 'Founders', value: founderEquity, firm: '' });
    }

    return data;
  };

  // Calculate dilution scenario
  const calculateDilution = () => {
    const { newInvestment, preMoneyValuation } = dilutionScenario;
    const postMoneyValuation = preMoneyValuation + newInvestment;
    const newInvestorEquity = (newInvestment / postMoneyValuation) * 100;
    const dilutionFactor = preMoneyValuation / postMoneyValuation;

    return {
      postMoneyValuation,
      newInvestorEquity,
      dilutionFactor,
      dilutedFounderEquity: founderEquity * dilutionFactor,
      existingInvestorsDiluted: entries.map(entry => ({
        name: entry.investor?.name || 'Unknown',
        originalEquity: entry.equity_percentage || 0,
        dilutedEquity: (entry.equity_percentage || 0) * dilutionFactor,
      })),
    };
  };

  const dilutionResults = calculateDilution();

  // Data for dilution comparison chart
  const getDilutionComparisonData = () => {
    const data = [
      {
        name: 'Founders',
        before: founderEquity,
        after: dilutionResults.dilutedFounderEquity,
      },
      ...dilutionResults.existingInvestorsDiluted.map(inv => ({
        name: inv.name,
        before: inv.originalEquity,
        after: inv.dilutedEquity,
      })),
      {
        name: 'New Investor',
        before: 0,
        after: dilutionResults.newInvestorEquity,
      },
    ];
    return data;
  };

  const totalRaised = entries.reduce((sum, entry) => sum + entry.investment_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/safe')}>
            <Plus className="w-4 h-4 mr-2" />
            Create SAFE
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Raised</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalRaised)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Founder Equity</CardDescription>
              <CardTitle className="text-2xl">{founderEquity.toFixed(2)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Investors</CardDescription>
              <CardTitle className="text-2xl">{entries.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Investor Equity</CardDescription>
              <CardTitle className="text-2xl">{(100 - founderEquity).toFixed(2)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ownership Breakdown Pie Chart */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Ownership Breakdown</CardTitle>
              <CardDescription>Current equity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {getOwnershipData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getOwnershipData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {getOwnershipData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No equity data to display
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dilution Modeling */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Dilution Modeling
              </CardTitle>
              <CardDescription>Simulate new investment rounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newInvestment">New Investment ($)</Label>
                  <Input
                    id="newInvestment"
                    type="number"
                    value={dilutionScenario.newInvestment}
                    onChange={(e) => setDilutionScenario(prev => ({
                      ...prev,
                      newInvestment: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preMoneyValuation">Pre-Money Valuation ($)</Label>
                  <Input
                    id="preMoneyValuation"
                    type="number"
                    value={dilutionScenario.preMoneyValuation}
                    onChange={(e) => setDilutionScenario(prev => ({
                      ...prev,
                      preMoneyValuation: Number(e.target.value)
                    }))}
                  />
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Post-Money Valuation:</span>
                  <span className="font-semibold">{formatCurrency(dilutionResults.postMoneyValuation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Investor Equity:</span>
                  <span className="font-semibold">{dilutionResults.newInvestorEquity.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founder Equity After:</span>
                  <span className="font-semibold">{dilutionResults.dilutedFounderEquity.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dilution Factor:</span>
                  <span className="font-semibold">{((1 - dilutionResults.dilutionFactor) * 100).toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dilution Comparison Chart */}
        {entries.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Dilution Impact Comparison</CardTitle>
              <CardDescription>Before vs. after new investment round</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDilutionComparisonData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="before" fill="hsl(var(--primary))" name="Current" />
                  <Bar dataKey="after" fill="hsl(var(--secondary))" name="After Round" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cap Table */}
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
                    <TableHead className="text-right">Post-Dilution %</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const postDilutionEquity = (entry.equity_percentage || 0) * dilutionResults.dilutionFactor;
                    return (
                      <TableRow 
                        key={entry.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => entry.safe_id && navigate(`/safe/${entry.safe_id}`)}
                      >
                        <TableCell className="font-medium">{entry.investor?.name || '-'}</TableCell>
                        <TableCell>{entry.investor?.investor_profiles?.firm_name || '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.investment_amount)}</TableCell>
                        <TableCell className="text-right">
                          {entry.equity_percentage ? `${entry.equity_percentage.toFixed(2)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.valuation ? formatCurrency(entry.valuation) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {entry.equity_percentage ? `${postDilutionEquity.toFixed(2)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {entry.investment_date ? new Date(entry.investment_date).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
