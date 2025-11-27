import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, CheckCircle, Clock, FileText } from "lucide-react";

interface SAFE {
  id: string;
  amount: number;
  valuation_cap: number | null;
  discount_rate: number | null;
  execution_date: string | null;
  status: string;
  founder_signed_at: string | null;
  investor_signed_at: string | null;
  investor: {
    name: string;
  };
}

const SafesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [safes, setSafes] = useState<SAFE[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'founder' | 'investor' | null>(null);

  useEffect(() => {
    loadSafes();
  }, []);

  const loadSafes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get user profile to check type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      setUserType(profile?.user_type || null);

      // Load SAFEs based on user type
      const query = supabase
        .from('safes')
        .select(`
          *,
          investor:profiles!safes_investor_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (profile?.user_type === 'founder') {
        query.eq('founder_id', user.id);
      } else {
        query.eq('investor_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSafes(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading SAFEs",
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

  const getStatusBadge = (safe: SAFE) => {
    if (safe.founder_signed_at && safe.investor_signed_at) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Executed</Badge>;
    }
    if (safe.status === 'pending_signatures') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending Signatures</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
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
          {userType === 'founder' && (
            <Button onClick={() => navigate('/safe')}>
              <Plus className="w-4 h-4 mr-2" />
              Create SAFE
            </Button>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8" />
              SAFE Agreements
            </CardTitle>
            <CardDescription>
              Simple Agreements for Future Equity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading SAFEs...</p>
              </div>
            ) : safes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No SAFE agreements yet</p>
                {userType === 'founder' && (
                  <Button onClick={() => navigate('/safe')}>
                    Create Your First SAFE
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Valuation Cap</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safes.map((safe) => (
                    <TableRow 
                      key={safe.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/safe/${safe.id}`)}
                    >
                      <TableCell className="font-medium">{safe.investor.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(safe.amount)}</TableCell>
                      <TableCell className="text-right">
                        {safe.valuation_cap ? formatCurrency(safe.valuation_cap) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {safe.discount_rate ? `${safe.discount_rate}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {safe.execution_date ? new Date(safe.execution_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(safe)}</TableCell>
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

export default SafesList;
