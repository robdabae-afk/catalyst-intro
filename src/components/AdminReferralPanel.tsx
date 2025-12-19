import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Check, Clock, XCircle } from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: string;
  referred_user_type: string | null;
  created_at: string;
  approved_at: string | null;
  referrer?: { name: string; email: string };
  referred_user?: { name: string; email: string };
}

export const AdminReferralPanel = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Get profile info for referrers and referred users
      const userIds = [...new Set([
        ...data.map(r => r.referrer_id),
        ...data.filter(r => r.referred_user_id).map(r => r.referred_user_id)
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};

      setReferrals(data.map(r => ({
        ...r,
        referrer: profileMap[r.referrer_id],
        referred_user: r.referred_user_id ? profileMap[r.referred_user_id] : undefined
      })));
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: referrals.length,
    approved: referrals.filter(r => r.status === 'approved').length,
    pending: referrals.filter(r => r.status === 'pending').length,
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Referrals</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-500">{stats.approved}</p><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-amber-500">{stats.pending}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />All Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.referrer?.name || 'Unknown'}<br/><span className="text-xs text-muted-foreground">{r.referrer?.email}</span></TableCell>
                  <TableCell>{r.referred_user?.name || 'Pending signup'}<br/><span className="text-xs text-muted-foreground">{r.referred_user?.email || r.referral_code}</span></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.referred_user_type || '-'}</Badge></TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
