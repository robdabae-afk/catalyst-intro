import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavLink } from '@/components/NavLink';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, DollarSign, Calendar, BarChart3, Table, MoreHorizontal, Upload, Check, X } from 'lucide-react';

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

const REQUEST_ICONS: Record<string, any> = {
  pitch_deck: FileText,
  financials: BarChart3,
  cap_table: Table,
  funding_interest: DollarSign,
  meeting: Calendar,
  other: MoreHorizontal,
};

const REQUEST_LABELS: Record<string, string> = {
  pitch_deck: 'Pitch Deck',
  financials: 'Financials',
  cap_table: 'Cap Table',
  funding_interest: 'Funding Interest',
  meeting: 'Meeting Request',
  other: 'Other',
};

export default function Requests() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<DocumentRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserType(profile?.user_type || null);
      await fetchRequests(user.id);
    };
    init();
  }, [navigate]);

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

  const handleResponse = async (requestId: string, status: 'approved' | 'denied') => {
    const { error } = await supabase
      .from('document_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? 'Approved' : 'Denied' });
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CATALYST
            </h1>
            <div className="flex gap-2 sm:gap-4">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/matches">Matches</NavLink>
              <NavLink to="/requests">Requests</NavLink>
              {userType === 'investor' && <NavLink to="/investments">Investments</NavLink>}
              {userType === 'founder' && <NavLink to="/safes">SAFEs</NavLink>}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Document Requests</h2>

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
                          <Button size="sm" onClick={() => handleResponse(req.id, 'approved')}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleResponse(req.id, 'denied')}>
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
