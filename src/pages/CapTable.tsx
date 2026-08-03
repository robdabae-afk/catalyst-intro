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
import { ArrowLeft, Plus, Calculator, Trash2, AlertTriangle, Megaphone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

interface FundingRound {
  id: string;
  round_type: string;
  amount: number | null;
  valuation: number | null;
  date: string | null;
  investors: string[] | null;
}

interface StartupUpdate {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
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
  const [updates, setUpdates] = useState<StartupUpdate[]>([]);
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [showRoundDialog, setShowRoundDialog] = useState(false);
  const [roundForm, setRoundForm] = useState({
    round_type: "Pre-seed",
    amount: "",
    valuation: "",
    date: "",
    investors: "",
  });
  const [savingRound, setSavingRound] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "", link: "" });
  const [postingUpdate, setPostingUpdate] = useState(false);

  useEffect(() => {
    loadCapTable();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadUpdates(currentUserId);
      loadRounds(currentUserId);
    }
  }, [currentUserId]);

  const loadRounds = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("funding_rounds")
      .select("id, round_type, amount, valuation, date, investors")
      .eq("founder_id", userId)
      .order("date", { ascending: false });
    setRounds((data ?? []) as FundingRound[]);
  };

  const handleSaveRound = async () => {
    if (!currentUserId || !roundForm.round_type) return;
    setSavingRound(true);
    const { error } = await (supabase as any).from("funding_rounds").insert({
      founder_id: currentUserId,
      round_type: roundForm.round_type,
      amount: roundForm.amount ? parseFloat(roundForm.amount) : null,
      valuation: roundForm.valuation ? parseFloat(roundForm.valuation) : null,
      date: roundForm.date || null,
      investors: roundForm.investors.trim()
        ? roundForm.investors.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
    });
    setSavingRound(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to record round", description: error.message });
      return;
    }
    toast({ title: "Round recorded", description: "Your closed round has been saved." });
    setShowRoundDialog(false);
    setRoundForm({ round_type: "Pre-seed", amount: "", valuation: "", date: "", investors: "" });
    loadRounds(currentUserId);
  };

  const handleDeleteRound = async (id: string) => {
    if (!currentUserId) return;
    await (supabase as any).from("funding_rounds").delete().eq("id", id);
    loadRounds(currentUserId);
  };

  const loadUpdates = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("startup_updates")
      .select("id, title, body, link, created_at")
      .eq("founder_id", userId)
      .order("created_at", { ascending: false });
    setUpdates((data ?? []) as StartupUpdate[]);
  };

  const handlePostUpdate = async () => {
    if (!currentUserId || !updateForm.title.trim()) {
      toast({ variant: "destructive", title: "Title is required" });
      return;
    }
    setPostingUpdate(true);
    const { error } = await (supabase as any).from("startup_updates").insert({
      founder_id: currentUserId,
      title: updateForm.title.trim(),
      body: updateForm.body.trim() || null,
      link: updateForm.link.trim() || null,
    });
    setPostingUpdate(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to post update", description: error.message });
      return;
    }
    toast({ title: "Update posted", description: "Your investors will see this on their portfolio page." });
    setUpdateForm({ title: "", body: "", link: "" });
    setShowUpdateDialog(false);
    loadUpdates(currentUserId);
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!currentUserId) return;
    const { error } = await (supabase as any).from("startup_updates").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Failed to delete update", description: error.message });
      return;
    }
    loadUpdates(currentUserId);
  };

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
            <Button variant="outline" onClick={() => setShowUpdateDialog(true)}>
              <Megaphone className="w-4 h-4 mr-2" />
              Post investor update
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
        {/* Closed rounds */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Closed Rounds</CardTitle>
                <CardDescription>Record rounds you've closed to keep your history accurate.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowRoundDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Record Round
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rounds.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No closed rounds recorded yet</p>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{r.round_type}</p>
                        {r.amount != null && <span className="text-sm">{formatCurrency(r.amount)}</span>}
                        {r.valuation != null && (
                          <span className="text-sm text-muted-foreground">at {formatCurrency(r.valuation)} valuation</span>
                        )}
                        {r.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {r.investors && r.investors.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Investors: {r.investors.join(", ")}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRound(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investor updates */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Investor Updates
            </CardTitle>
            <CardDescription>
              News and announcements you post here are shown to investors who hold your startup in
              their portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No updates posted yet</p>
                <Button variant="outline" onClick={() => setShowUpdateDialog(true)}>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Post Your First Update
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((u) => (
                  <div key={u.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{u.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {u.body && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{u.body}</p>
                      )}
                      {u.link && (
                        <a
                          href={u.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline mt-1 inline-block"
                        >
                          {u.link}
                        </a>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUpdate(u.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Round Dialog */}
      <Dialog open={showRoundDialog} onOpenChange={setShowRoundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a Closed Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="round_type">Round type *</Label>
              <select
                id="round_type"
                value={roundForm.round_type}
                onChange={(e) => setRoundForm({ ...roundForm, round_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {["Pre-seed", "Seed", "Series A", "Series B", "Bridge / SAFE", "Angel", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="round_amount">Amount raised ($)</Label>
                <Input
                  id="round_amount"
                  type="number"
                  value={roundForm.amount}
                  onChange={(e) => setRoundForm({ ...roundForm, amount: e.target.value })}
                  placeholder="e.g., 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="round_valuation">Valuation ($)</Label>
                <Input
                  id="round_valuation"
                  type="number"
                  value={roundForm.valuation}
                  onChange={(e) => setRoundForm({ ...roundForm, valuation: e.target.value })}
                  placeholder="e.g., 5000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="round_date">Close date</Label>
              <Input
                id="round_date"
                type="date"
                value={roundForm.date}
                onChange={(e) => setRoundForm({ ...roundForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round_investors">Investors (comma-separated)</Label>
              <Input
                id="round_investors"
                value={roundForm.investors}
                onChange={(e) => setRoundForm({ ...roundForm, investors: e.target.value })}
                placeholder="e.g., Meridian Ventures, Jane Smith"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoundDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRound} disabled={savingRound}>
              {savingRound ? "Saving..." : "Record Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Investor Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update_title">Title *</Label>
              <Input
                id="update_title"
                value={updateForm.title}
                maxLength={200}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                placeholder="e.g., Closed our seed round"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update_body">Update</Label>
              <Textarea
                id="update_body"
                value={updateForm.body}
                maxLength={2000}
                rows={4}
                onChange={(e) => setUpdateForm({ ...updateForm, body: e.target.value })}
                placeholder="Share news, metrics, or announcements with your investors..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update_link">Link (optional)</Label>
              <Input
                id="update_link"
                value={updateForm.link}
                maxLength={500}
                onChange={(e) => setUpdateForm({ ...updateForm, link: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostUpdate} disabled={postingUpdate}>
              {postingUpdate ? "Posting..." : "Post Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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