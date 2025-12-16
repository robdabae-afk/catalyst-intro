import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Building2, FileText, CheckCircle, Clock } from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";

interface Investment {
  id: string;
  amount: number;
  valuation_cap: number | null;
  discount_rate: number | null;
  execution_date: string | null;
  status: string;
  founder_signed_at: string | null;
  investor_signed_at: string | null;
  created_at: string;
  founder: {
    name: string;
  };
  founder_profile: {
    startup_name: string;
    company_name: string | null;
    industry: string[] | null;
  } | null;
}

const Investments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

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

      // Load SAFEs where user is the investor
      const { data, error } = await supabase
        .from('safes')
        .select(`
          *,
          founder:profiles!safes_founder_id_fkey(name)
        `)
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load founder profiles separately
      const investmentsWithProfiles = await Promise.all(
        (data || []).map(async (safe) => {
          const { data: founderProfile } = await supabase
            .from('founder_profiles')
            .select('startup_name, company_name, industry')
            .eq('profile_id', safe.founder_id)
            .single();
          
          return {
            ...safe,
            founder_profile: founderProfile
          };
        })
      );

      setInvestments(investmentsWithProfiles);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (investment: Investment) => {
    if (investment.founder_signed_at && investment.investor_signed_at) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Executed</Badge>;
    }
    if (investment.status === 'sent' || investment.status === 'pending_signatures') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const totalInvested = investments
    .filter(i => i.founder_signed_at && i.investor_signed_at)
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingInvestments = investments.filter(
    i => (i.status === 'sent' || i.status === 'pending_signatures') && 
         !(i.founder_signed_at && i.investor_signed_at)
  );

  const executedInvestments = investments.filter(
    i => i.founder_signed_at && i.investor_signed_at
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppNavigation 
        userType="investor"
        userName={userName || undefined}
        avatarUrl={userAvatar || undefined}
        pageTitle="Investments"
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Investment Portfolio
          </h1>
          <p className="text-muted-foreground">Track your SAFE investments and portfolio companies</p>
        </div>

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
              <p className="text-3xl font-bold">{executedInvestments.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending SAFEs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingInvestments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending SAFEs requiring action */}
        {pendingInvestments.length > 0 && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Action Required
              </CardTitle>
              <CardDescription>SAFEs waiting for your signature</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Valuation Cap</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvestments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">
                        {investment.founder_profile?.company_name || 
                         investment.founder_profile?.startup_name || 
                         investment.founder.name}
                      </TableCell>
                      <TableCell>{investment.founder_profile?.industry || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(investment.amount)}</TableCell>
                      <TableCell className="text-right">
                        {investment.valuation_cap ? formatCurrency(investment.valuation_cap) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(investment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/safe/${investment.id}`)}
                        >
                          Review & Sign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* All Investments */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Investments
            </CardTitle>
            <CardDescription>Your complete investment history</CardDescription>
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
                <p className="text-muted-foreground">No investments yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Match with founders on the dashboard to start investing
                </p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4">
                  Discover Startups
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
                    <TableRow 
                      key={investment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/safe/${investment.id}`)}
                    >
                      <TableCell className="font-medium">
                        {investment.founder_profile?.company_name || 
                         investment.founder_profile?.startup_name || 
                         '-'}
                      </TableCell>
                      <TableCell>{investment.founder.name}</TableCell>
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
                      <TableCell>{getStatusBadge(investment)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
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

export default Investments;
