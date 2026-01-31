import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Crown, Search, Check, Clock, DollarSign, Users, RefreshCw, Mail } from 'lucide-react';

interface ManualMatch {
  id: string;
  requester_id: string;
  matched_user_id: string | null;
  payment_status: string;
  user_type: string;
  amount_paid: number;
  payment_timestamp: string | null;
  fulfilled_at: string | null;
  created_at: string;
  requester?: { name: string; email: string };
  matched_user?: { name: string; email: string };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface ConciergeInquiry {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  service_name: string;
  product_name: string;
  budget: number;
  status: string;
}

export const AdminConciergePanel = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<ManualMatch[]>([]);
  const [inquiries, setInquiries] = useState<ConciergeInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ManualMatch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [fulfilling, setFulfilling] = useState(false);

  useEffect(() => {
    loadMatches();
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    const { data } = await supabase
      .from('concierge_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setInquiries(data);
    }
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('concierge_inquiries')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status'
      });
    } else {
      toast({ title: 'Status updated' });
      loadInquiries();
    }
  };

  const loadMatches = async () => {
    const { data } = await supabase
      .from('manual_matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Get profile info for requesters
      const requesterIds = data.map(m => m.requester_id);
      const matchedIds = data.filter(m => m.matched_user_id).map(m => m.matched_user_id);
      const allIds = [...new Set([...requesterIds, ...matchedIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', allIds);

      const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};

      setMatches(data.map(m => ({
        ...m,
        requester: profileMap[m.requester_id],
        matched_user: m.matched_user_id ? profileMap[m.matched_user_id] : undefined
      })));
    }
    setLoading(false);
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, user_type')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  const handleFulfill = async () => {
    if (!selectedMatch || !selectedUser) return;

    setFulfilling(true);
    try {
      // Call the secure backend function to fulfill the match
      // This bypasses RLS and creates swipes, matches, and intro message
      const { data, error } = await supabase.functions.invoke('admin-fulfill-concierge-match', {
        body: {
          manualMatchId: selectedMatch.id,
          matchedUserId: selectedUser.id
        }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed to fulfill match');

      toast({
        title: 'Match fulfilled successfully!',
        description: data.repaired?.introSent
          ? 'Intro message sent to both users.'
          : 'Users can now chat.'
      });
      setFulfillDialogOpen(false);
      setSelectedMatch(null);
      setSelectedUser(null);
      setSearchQuery('');
      loadMatches();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setFulfilling(false);
    }
  };

  const handleBackfill = async () => {
    try {
      toast({ title: 'Running backfill...', description: 'This may take a moment.' });

      const { data, error } = await supabase.functions.invoke('admin-backfill-concierge-chats');

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Backfill failed');

      toast({
        title: 'Backfill complete!',
        description: `Processed ${data.results?.total} matches. Created ${data.results?.introsCreated} intro messages.`
      });
      loadMatches();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Backfill Error',
        description: error.message
      });
    }
  };

  const openFulfillDialog = (match: ManualMatch) => {
    setSelectedMatch(match);
    setFulfillDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="w-3 h-3 mr-1" />Awaiting Match</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-500/20 text-green-400"><Check className="w-3 h-3 mr-1" />Fulfilled</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-black">Payment Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-black">{status}</Badge>;
    }
  };

  const paidUnfulfilledMatches = matches.filter(m => m.payment_status === 'paid');
  const stats = {
    total: matches.length,
    paid: paidUnfulfilledMatches.length,
    fulfilled: matches.filter(m => m.payment_status === 'fulfilled').length,
    revenue: matches.filter(m => ['paid', 'fulfilled'].includes(m.payment_status))
      .reduce((sum, m) => sum + (m.amount_paid || 0), 0) / 100
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Requests</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-amber-500">{stats.paid}</p><p className="text-sm text-muted-foreground">Awaiting Match</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-500">{stats.fulfilled}</p><p className="text-sm text-muted-foreground">Fulfilled</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">${stats.revenue}</p><p className="text-sm text-muted-foreground">Revenue</p></CardContent></Card>
      </div>

      {/* Pending Matches - Highlighted */}
      {paidUnfulfilledMatches.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Crown className="w-5 h-5" />
              Awaiting Fulfillment ({paidUnfulfilledMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Payment Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidUnfulfilledMatches.map(match => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {match.requester?.name}<br />
                      <span className="text-xs text-muted-foreground">{match.requester?.email}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{match.user_type}</Badge></TableCell>
                    <TableCell>${(match.amount_paid || 0) / 100}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {match.payment_timestamp ? new Date(match.payment_timestamp).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openFulfillDialog(match)}>
                        <Users className="w-4 h-4 mr-1" />
                        Assign Match
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Concierge Inquiries */}
      {inquiries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Form Inquiries ({inquiries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map(inquiry => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.full_name}</TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{inquiry.phone}</TableCell>
                    <TableCell>{inquiry.service_name}</TableCell>
                    <TableCell className="text-sm">{inquiry.product_name}</TableCell>
                    <TableCell>${inquiry.budget}</TableCell>
                    <TableCell>
                      <Badge
                        variant={inquiry.status === 'pending' ? 'secondary' : inquiry.status === 'contacted' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {inquiry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {inquiry.status === 'pending' && (
                          <Button size="sm" onClick={() => updateInquiryStatus(inquiry.id, 'contacted')}>
                            Mark Contacted
                          </Button>
                        )}
                        {inquiry.status === 'contacted' && (
                          <Button size="sm" variant="outline" onClick={() => updateInquiryStatus(inquiry.id, 'completed')}>
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Matches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />All Concierge Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={handleBackfill}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Backfill Chats
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Matched With</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map(match => (
                <TableRow key={match.id}>
                  <TableCell>{match.requester?.name || 'Unknown'}</TableCell>
                  <TableCell>{match.matched_user?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(match.payment_status)}</TableCell>
                  <TableCell>${(match.amount_paid || 0) / 100}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(match.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Match for {selectedMatch?.requester?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search for user to match</label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedUser?.id === user.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email} • {user.user_type}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                <p className="text-sm text-green-400">Selected: <strong>{selectedUser.name}</strong></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFulfillDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFulfill} disabled={!selectedUser || fulfilling}>
              {fulfilling ? 'Fulfilling...' : 'Confirm Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
