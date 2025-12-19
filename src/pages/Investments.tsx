import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Building2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Investment {
  id: string;
  amount: number;
  valuation_cap: number | null;
  discount_rate: number | null;
  execution_date: string | null;
  status: string;
  created_at: string;
  company_name: string;
  founder_name: string;
}

const Investments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    founder_name: "",
    amount: "",
    valuation_cap: "",
    discount_rate: "",
    execution_date: "",
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      setCurrentUserId(user.id);

      // Check if user is an investor
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.user_type !== 'investor') {
        navigate('/dashboard');
        return;
      }

      setUserName(profile.name);
      setUserAvatar(profile.avatar_url);

      // Load manually tracked SAFEs
      const { data, error } = await supabase
        .from('safes')
        .select('*')
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to simplified investment structure
      const mappedInvestments = (data || []).map(safe => ({
        id: safe.id,
        amount: safe.amount,
        valuation_cap: safe.valuation_cap,
        discount_rate: safe.discount_rate,
        execution_date: safe.execution_date,
        status: safe.status || 'tracked',
        created_at: safe.created_at || '',
        company_name: safe.document_url?.split('Company: ')[1]?.split('\n')[0] || 'Unknown Company',
        founder_name: safe.document_url?.split('Founder: ')[1]?.split('\n')[0] || 'Unknown Founder',
      }));

      setInvestments(mappedInvestments);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading investments",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!currentUserId || !formData.company_name || !formData.amount) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Company name and amount are required"
      });
      return;
    }

    try {
      const { error } = await supabase.from('safes').insert({
        investor_id: currentUserId,
        founder_id: currentUserId, // Self-reference for manual tracking
        amount: parseFloat(formData.amount),
        valuation_cap: formData.valuation_cap ? parseFloat(formData.valuation_cap) : null,
        discount_rate: formData.discount_rate ? parseFloat(formData.discount_rate) : null,
        execution_date: formData.execution_date || null,
        status: 'tracked',
        document_url: `Company: ${formData.company_name}\nFounder: ${formData.founder_name}`,
      });

      if (error) throw error;

      toast({
        title: "Investment Added",
        description: "Your investment has been recorded"
      });

      setShowAddDialog(false);
      setFormData({
        company_name: "",
        founder_name: "",
        amount: "",
        valuation_cap: "",
        discount_rate: "",
        execution_date: "",
      });
      loadInvestments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding investment",
        description: error.message
      });
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      const { error } = await supabase.from('safes').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Investment Removed",
        description: "The investment record has been deleted"
      });
      loadInvestments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting investment",
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

  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppNavigation 
        userType="investor"
        userName={userName || undefined}
        avatarUrl={userAvatar || undefined}
        pageTitle="Investments"
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8" />
              Investment Portfolio
            </h1>
            <p className="text-muted-foreground">Manually track your SAFE investments</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        </div>

        {/* Disclaimer */}
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            <strong>Important:</strong> This is a manual tracking tool only. All SAFE agreements must be executed off-platform via email or other legal means. Do not rely on this platform for legal document execution.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(totalInvested)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Portfolio Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{investments.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Check Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {investments.length > 0 ? formatCurrency(totalInvested / investments.length) : '$0'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investments Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Investments</CardTitle>
            <CardDescription>Your manually tracked investment history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading investments...</p>
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No investments tracked yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your first investment to start tracking your portfolio
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investment
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Founder</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Valuation Cap</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">{investment.company_name}</TableCell>
                      <TableCell>{investment.founder_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(investment.amount)}</TableCell>
                      <TableCell className="text-right">
                        {investment.valuation_cap ? formatCurrency(investment.valuation_cap) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {investment.discount_rate ? `${investment.discount_rate}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {investment.execution_date 
                          ? new Date(investment.execution_date).toLocaleDateString()
                          : new Date(investment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Tracked</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvestment(investment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Investment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g., Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="founder_name">Founder Name</Label>
              <Input
                id="founder_name"
                value={formData.founder_name}
                onChange={(e) => setFormData({ ...formData, founder_name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g., 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valuation_cap">Valuation Cap ($)</Label>
              <Input
                id="valuation_cap"
                type="number"
                value={formData.valuation_cap}
                onChange={(e) => setFormData({ ...formData, valuation_cap: e.target.value })}
                placeholder="e.g., 5000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_rate">Discount Rate (%)</Label>
              <Input
                id="discount_rate"
                type="number"
                value={formData.discount_rate}
                onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                placeholder="e.g., 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="execution_date">Investment Date</Label>
              <Input
                id="execution_date"
                type="date"
                value={formData.execution_date}
                onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInvestment}>
              Add Investment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investments;