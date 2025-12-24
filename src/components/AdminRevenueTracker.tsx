import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Crown, CreditCard, TrendingUp, Users } from 'lucide-react';

interface SubscriptionRecord {
  id: string;
  name: string;
  displayName: string; // startup_name or firm_name or name
  userType: 'founder' | 'investor';
  plan: string | null;
  status: string | null;
  expiresAt: string | null;
}

interface ConciergeRecord {
  id: string;
  displayName: string;
  userType: string;
  amountPaid: number;
  paymentStatus: string;
  createdAt: string;
}

export const AdminRevenueTracker = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [concierge, setConcierge] = useState<ConciergeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    setLoading(true);
    
    // Load subscriptions with startup/firm names
    const { data: subData } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        user_type,
        subscription_plan,
        subscription_status,
        subscription_expires_at
      `)
      .or('subscription_status.not.is.null,subscription_plan.not.is.null');

    if (subData) {
      // Get founder and investor profiles for display names
      const userIds = subData.map(s => s.id);
      
      const { data: founderProfiles } = await supabase
        .from('founder_profiles')
        .select('profile_id, startup_name')
        .in('profile_id', userIds);
      
      const { data: investorProfiles } = await supabase
        .from('investor_profiles')
        .select('profile_id, firm_name')
        .in('profile_id', userIds);

      const founderMap = founderProfiles?.reduce((acc, fp) => ({ ...acc, [fp.profile_id]: fp.startup_name }), {}) || {};
      const investorMap = investorProfiles?.reduce((acc, ip) => ({ ...acc, [ip.profile_id]: ip.firm_name }), {}) || {};

      setSubscriptions(subData.map(s => ({
        id: s.id,
        name: s.name,
        displayName: s.user_type === 'founder' 
          ? (founderMap[s.id] || s.name) 
          : (investorMap[s.id] || s.name),
        userType: s.user_type,
        plan: s.subscription_plan,
        status: s.subscription_status,
        expiresAt: s.subscription_expires_at
      })));
    }

    // Load concierge purchases with startup/firm names
    const { data: conciergeData } = await supabase
      .from('manual_matches')
      .select('id, requester_id, user_type, amount_paid, payment_status, created_at')
      .order('created_at', { ascending: false });

    if (conciergeData) {
      const requesterIds = conciergeData.map(c => c.requester_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', requesterIds);

      const { data: founderProfiles } = await supabase
        .from('founder_profiles')
        .select('profile_id, startup_name')
        .in('profile_id', requesterIds);

      const { data: investorProfiles } = await supabase
        .from('investor_profiles')
        .select('profile_id, firm_name')
        .in('profile_id', requesterIds);

      const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {}) || {};
      const founderMap = founderProfiles?.reduce((acc, fp) => ({ ...acc, [fp.profile_id]: fp.startup_name }), {}) || {};
      const investorMap = investorProfiles?.reduce((acc, ip) => ({ ...acc, [ip.profile_id]: ip.firm_name }), {}) || {};

      setConcierge(conciergeData.map(c => ({
        id: c.id,
        displayName: c.user_type === 'founder'
          ? (founderMap[c.requester_id] || profileMap[c.requester_id] || 'Unknown')
          : (investorMap[c.requester_id] || profileMap[c.requester_id] || 'Unknown'),
        userType: c.user_type,
        amountPaid: c.amount_paid || 0,
        paymentStatus: c.payment_status,
        createdAt: c.created_at
      })));
    }

    setLoading(false);
  };

  // Calculate stats
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const paidConcierge = concierge.filter(c => ['paid', 'fulfilled'].includes(c.paymentStatus));
  
  // Estimate subscription revenue (rough estimate - would need Stripe integration for exact)
  const subscriptionMRR = activeSubscriptions.length * 29.99; // Assuming $29.99/month avg
  const conciergeRevenue = paidConcierge.reduce((sum, c) => sum + c.amountPaid, 0) / 100;
  const totalRevenue = conciergeRevenue; // Subscription tracking would need Stripe integration

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-500/20 text-amber-400">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status || 'None'}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-amber-500/20 text-amber-400">Paid - Awaiting</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-500/20 text-green-400">Fulfilled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    if (!plan) return <Badge variant="outline">None</Badge>;
    const planLabels: Record<string, string> = {
      startup_pro: 'Startup Pro',
      investor_pro: 'Investor Pro',
      startup_plus: 'Startup Plus',
      investor_plus: 'Investor Plus'
    };
    return <Badge className="bg-primary/20 text-primary">{planLabels[plan] || plan}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold text-green-500">${conciergeRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Concierge Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{activeSubscriptions.length}</p>
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-3xl font-bold">{paidConcierge.length}</p>
            <p className="text-sm text-muted-foreground">Concierge Purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold">${subscriptionMRR.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Est. Subscription MRR</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Subscriptions ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="concierge" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Concierge ({concierge.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No subscriptions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User / Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.displayName}</p>
                            {sub.displayName !== sub.name && (
                              <p className="text-xs text-muted-foreground">{sub.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{sub.userType}</Badge>
                        </TableCell>
                        <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concierge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Concierge Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {concierge.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No concierge purchases found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User / Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concierge.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.displayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{c.userType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">${(c.amountPaid / 100).toFixed(2)}</TableCell>
                        <TableCell>{getPaymentBadge(c.paymentStatus)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
