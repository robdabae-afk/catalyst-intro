import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calculator, Trash2, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CapTableEntry {
  id: string;
  investment_amount: number;
  equity_percentage: number | null;
  valuation: number | null;
  investment_date: string | null;
  investor_name: string;
  firm_name: string | null;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [founderEquity, setFounderEquity] = useState(100);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    investor_name: "",
    firm_name: "",
    investment_amount: "",
    equity_percentage: "",
    valuation: "",
    investment_date: "",
  });
  const [dilutionScenario, setDilutionScenario] = useState<DilutionScenario>({
    newInvestment: 1000000,
    preMoneyValuation: 10000000,
  });

  useEffect(() => {
    loadCapTable();
  }, []);

  useEffect(() => {
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

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('cap_table_entries')
        .select('*')
        .eq('founder_id', user.id)
        .order('investment_date', { ascending: false });

      if (error) throw error;

      // Map to simplified structure for manual tracking
      const mappedEntries = (data || []).map(entry => ({
        id: entry.id,
        investment_amount: entry.investment_amount,
        equity_percentage: entry.equity_percentage,
        valuation: entry.valuation,
        investment_date: entry.investment_date,
        investor_name: 'Investor', // Will be stored in a different way for manual tracking
        firm_name: null,
      }));

      setEntries(mappedEntries);
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

  const handleAddEntry = async () => {
    if (!currentUserId || !formData.investor_name || !formData.investment_amount) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Investor name and investment amount are required"
      });
      return;
    }

    try {
      const { error } = await supabase.from('cap_table_entries').insert({
        founder_id: currentUserId,
        investor_id: currentUserId, // Self-reference for manual tracking
        investment_amount: parseFloat(formData.investment_amount),
        equity_percentage: formData.equity_percentage ? parseFloat(formData.equity_percentage) : null,
        valuation: formData.valuation ? parseFloat(formData.valuation) : null,
        investment_date: formData.investment_date || null,
      });

      if (error) throw error;

      toast({
        title: "Entry Added",
        description: "Cap table entry has been recorded"
      });

      setShowAddDialog(false);
      setFormData({
        investor_name: "",
        firm_name: "",
        investment_amount: "",
        equity_percentage: "",
        valuation: "",
        investment_date: "",
      });
      loadCapTable();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding entry",
        description: error.message
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('cap_table_entries').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Entry Removed",
        description: "The cap table entry has been deleted"
      });
      loadCapTable();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting entry",
        description: error.message
      });
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

  const getOwnershipData = () => {
    const data = entries
      .filter(entry => entry.equity_percentage && entry.equity_percentage > 0)
      .map(entry => ({
        name: entry.investor_name,
        value: entry.equity_percentage || 0,
        firm: entry.firm_name || '',
      }));

    if (founderEquity > 0) {
      data.unshift({ name: 'Founders', value: founderEquity, firm: '' });
    }

    return data;
  };

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
        name: entry.investor_name,
        originalEquity: entry.equity_percentage || 0,
        dilutedEquity: (entry.equity_percentage || 0) * dilutionFactor,
      })),
    };
  };

  const dilutionResults = calculateDilution();

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/safe')}>
              Download SAFE Template
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            <strong>Important:</strong> This is a manual tracking tool only. All SAFE agreements must be executed off-platform via email or other legal means. Do not rely on this platform for legal document execution.
          </AlertDescription>
        </Alert>

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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Ownership Breakdown</CardTitle>
              <CardDescription>Current equity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {getOwnershipData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={getOwnershipData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      labelLine={false}
                    >
                      {getOwnershipData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Legend 
                      formatter={(value, entry: any) => `${value}: ${entry.payload.value.toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No equity data to display
                </div>
              )}
            </CardContent>
          </Card>

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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Cap Table</CardTitle>
            <CardDescription>Manually track your equity and investments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No entries yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Entry
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
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const postDilutionEquity = (entry.equity_percentage || 0) * dilutionResults.dilutionFactor;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.investor_name}</TableCell>
                        <TableCell>{entry.firm_name || '-'}</TableCell>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cap Table Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="investor_name">Investor Name *</Label>
              <Input
                id="investor_name"
                value={formData.investor_name}
                onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firm_name">Firm Name</Label>
              <Input
                id="firm_name"
                value={formData.firm_name}
                onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                placeholder="e.g., Acme Ventures"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment_amount">Investment Amount ($) *</Label>
              <Input
                id="investment_amount"
                type="number"
                value={formData.investment_amount}
                onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equity_percentage">Equity Percentage (%)</Label>
              <Input
                id="equity_percentage"
                type="number"
                step="0.01"
                value={formData.equity_percentage}
                onChange={(e) => setFormData({ ...formData, equity_percentage: e.target.value })}
                placeholder="e.g., 5.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valuation">Valuation ($)</Label>
              <Input
                id="valuation"
                type="number"
                value={formData.valuation}
                onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                placeholder="e.g., 5000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment_date">Investment Date</Label>
              <Input
                id="investment_date"
                type="date"
                value={formData.investment_date}
                onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CapTable;