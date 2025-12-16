import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, DollarSign, Calendar, BarChart3, Table, MoreHorizontal, Upload, Check, X, Wallet, Briefcase, FileCheck, Plus } from 'lucide-react';
import { AppNavigation } from '@/components/AppNavigation';

interface DocumentRequest {
  id: string;
  requester_id: string;
  target_id: string;
  request_type: string;
  status: string;
  message: string | null;
  response_message: string | null;
  file_url: string | null;
  created_at: string;
  requester?: { name: string; email: string };
  target?: { name: string; email: string };
}

interface MatchedProfile {
  id: string;
  name: string;
  user_type: string;
}

const REQUEST_ICONS: Record<string, any> = {
  pitch_deck: FileText,
  financials: BarChart3,
  cap_table: Table,
  funding_interest: DollarSign,
  meeting: Calendar,
  proof_of_funds: Wallet,
  investment_portfolio: Briefcase,
  term_sheet: FileCheck,
  safe_request: FileText,
  other: MoreHorizontal,
};

const REQUEST_LABELS: Record<string, string> = {
  pitch_deck: 'Pitch Deck',
  financials: 'Financials',
  cap_table: 'Cap Table',
  funding_interest: 'Funding Interest',
  meeting: 'Meeting Request',
  proof_of_funds: 'Proof of Funds',
  investment_portfolio: 'Investment Portfolio',
  term_sheet: 'Term Sheet',
  safe_request: 'SAFE Signature Request',
  other: 'Other',
};

// Investor requesting from Founder
const INVESTOR_REQUEST_TYPES = [
  { value: 'pitch_deck', label: 'Pitch Deck', icon: FileText },
  { value: 'financials', label: 'Financials', icon: BarChart3 },
  { value: 'cap_table', label: 'Cap Table', icon: Table },
  { value: 'funding_interest', label: 'Express Funding Interest', icon: DollarSign },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal },
];

// Founder requesting from Investor
const FOUNDER_REQUEST_TYPES = [
  { value: 'proof_of_funds', label: 'Proof of Funds', icon: Wallet },
  { value: 'investment_portfolio', label: 'Investment Portfolio', icon: Briefcase },
  { value: 'term_sheet', label: 'Term Sheet', icon: FileCheck },
  { value: 'safe_request', label: 'Request SAFE Signature', icon: FileText },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal },
];

export default function Requests() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<DocumentRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<DocumentRequest[]>([]);
  const [matchedProfiles, setMatchedProfiles] = useState<MatchedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // New request dialog state
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [requestMessage, setRequestMessage] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserType(profile?.user_type || null);
      setUserName(profile?.name || null);
      setUserAvatar(profile?.avatar_url || null);
      await fetchRequests(user.id);
      await fetchMatchedProfiles(user.id);
    };
    init();
  }, [navigate]);

  const fetchMatchedProfiles = async (uid: string) => {
    // Get users I've liked
    const { data: myLikes } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', uid)
      .eq('action', 'like');

    if (!myLikes || myLikes.length === 0) {
      setMatchedProfiles([]);
      return;
    }

    const likedIds = myLikes.map(like => like.swiped_id);

    // Get users who liked me back (mutual matches)
    const { data: mutualLikes } = await supabase
      .from('swipes')
      .select('swiper_id')
      .eq('action', 'like')
      .in('swiper_id', likedIds)
      .eq('swiped_id', uid);

    if (!mutualLikes || mutualLikes.length === 0) {
      setMatchedProfiles([]);
      return;
    }

    const matchedIds = mutualLikes.map(like => like.swiper_id);

    // Fetch matched profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, user_type')
      .in('id', matchedIds);

    setMatchedProfiles(profiles || []);
  };

  const fetchRequests = async (uid: string) => {
    setLoading(true);
    
    // Fetch incoming requests (where user is target)
    const { data: incoming } = await supabase
      .from('document_requests')
      .select('*')
      .eq('target_id', uid)
      .order('created_at', { ascending: false });

    // Fetch outgoing requests (where user is requester)
    const { data: outgoing } = await supabase
      .from('document_requests')
      .select('*')
      .eq('requester_id', uid)
      .order('created_at', { ascending: false });

    // Fetch profile names for all requests
    const allIds = new Set<string>();
    incoming?.forEach(r => allIds.add(r.requester_id));
    outgoing?.forEach(r => allIds.add(r.target_id));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', Array.from(allIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    setIncomingRequests(
      incoming?.map(r => ({
        ...r,
        requester: profileMap.get(r.requester_id),
      })) || []
    );
    
    setOutgoingRequests(
      outgoing?.map(r => ({
        ...r,
        target: profileMap.get(r.target_id),
      })) || []
    );

    setLoading(false);
  };

  // Extract funding amount from message
  const extractFundingAmount = (message: string | null): number | null => {
    if (!message) return null;
    const match = message.match(/Funding Amount: \$(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const handleResponse = async (requestId: string, status: 'approved' | 'denied', request?: DocumentRequest) => {
    const { error } = await supabase
      .from('document_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? 'Approved' : 'Denied' });
      
      // If approving a funding interest request, redirect to SAFE creation
      if (status === 'approved' && request?.request_type === 'funding_interest') {
        const amount = extractFundingAmount(request.message);
        navigate(`/safe?investor_id=${request.requester_id}&amount=${amount || ''}`);
        return;
      }
      
      if (userId) fetchRequests(userId);
    }
  };

  const handleFileUpload = async (requestId: string, file: File) => {
    if (!userId) return;
    
    setUploadingId(requestId);
    try {
      const filePath = `${userId}/${requestId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      await supabase
        .from('document_requests')
        .update({ file_url: publicUrl, status: 'approved' })
        .eq('id', requestId);

      toast({ title: 'File uploaded and request approved' });
      fetchRequests(userId);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingId(null);
    }
  };

  const submitNewRequest = async () => {
    if (!selectedTarget || !selectedType || !userId) return;
    
    setSubmitting(true);
    try {
      let finalMessage = requestMessage.trim() || null;
      if (selectedType === 'funding_interest' && fundingAmount) {
        finalMessage = `Funding Amount: $${fundingAmount}${requestMessage.trim() ? `\n\n${requestMessage.trim()}` : ''}`;
      }

      const { error } = await supabase.from('document_requests').insert({
        requester_id: userId,
        target_id: selectedTarget,
        request_type: selectedType,
        message: finalMessage,
      });

      if (error) throw error;

      const targetName = matchedProfiles.find(p => p.id === selectedTarget)?.name || 'user';
      toast({
        title: 'Request sent',
        description: `Your request has been sent to ${targetName}`,
      });
      
      setNewRequestOpen(false);
      setSelectedTarget('');
      setSelectedType('');
      setRequestMessage('');
      setFundingAmount('');
      await fetchRequests(userId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = ({ type }: { type: string }) => {
    const IconComponent = REQUEST_ICONS[type] || MoreHorizontal;
    return <IconComponent className="h-4 w-4" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      approved: 'default',
      denied: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const requestTypes = userType === 'founder' ? FOUNDER_REQUEST_TYPES : INVESTOR_REQUEST_TYPES;

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation 
        userType={userType as 'founder' | 'investor' | null}
        userName={userName || undefined}
        avatarUrl={userAvatar || undefined}
        pageTitle="Inbox"
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Document Requests</h2>
          <Button onClick={() => setNewRequestOpen(true)} disabled={matchedProfiles.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* New Request Dialog */}
        <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Contact</Label>
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a matched contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchedProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.user_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="What do you need?" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType === 'funding_interest' && (
                <div className="space-y-2">
                  <Label>Investment Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Add context or notes..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewRequestOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitNewRequest} 
                disabled={submitting || !selectedTarget || !selectedType}
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="incoming">
              Incoming {incomingRequests.filter(r => r.status === 'pending').length > 0 && 
                `(${incomingRequests.filter(r => r.status === 'pending').length})`}
            </TabsTrigger>
            <TabsTrigger value="outgoing">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : incomingRequests.length === 0 ? (
              <p className="text-muted-foreground">No incoming requests</p>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <Card key={req.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Icon type={req.request_type} />
                          {REQUEST_LABELS[req.request_type]}
                        </CardTitle>
                        <StatusBadge status={req.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        From: <span className="text-foreground">{req.requester?.name || 'Unknown'}</span>
                      </p>
                      {req.message && (
                        <p className="text-sm mb-4 p-2 bg-muted rounded">{req.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mb-4">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                      
                      {req.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          {['pitch_deck', 'financials', 'cap_table'].includes(req.request_type) && (
                            <div>
                              <Label htmlFor={`file-${req.id}`} className="cursor-pointer">
                                <Button variant="outline" size="sm" asChild disabled={uploadingId === req.id}>
                                  <span>
                                    <Upload className="h-4 w-4 mr-1" />
                                    {uploadingId === req.id ? 'Uploading...' : 'Upload & Approve'}
                                  </span>
                                </Button>
                              </Label>
                              <Input
                                id={`file-${req.id}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(req.id, e.target.files[0])}
                              />
                            </div>
                          )}
                          <Button size="sm" onClick={() => handleResponse(req.id, 'approved', req)}>
                            <Check className="h-4 w-4 mr-1" /> 
                            {req.request_type === 'funding_interest' ? 'Accept & Create SAFE' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleResponse(req.id, 'denied', req)}>
                            <X className="h-4 w-4 mr-1" /> Deny
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : outgoingRequests.length === 0 ? (
              <p className="text-muted-foreground">No sent requests</p>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((req) => (
                  <Card key={req.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Icon type={req.request_type} />
                          {REQUEST_LABELS[req.request_type]}
                        </CardTitle>
                        <StatusBadge status={req.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        To: <span className="text-foreground">{req.target?.name || 'Unknown'}</span>
                      </p>
                      {req.message && (
                        <p className="text-sm mb-2 p-2 bg-muted rounded">{req.message}</p>
                      )}
                      {req.file_url && (
                        <a 
                          href={req.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          View Document
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
