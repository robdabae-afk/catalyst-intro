import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Check, X, Calendar, MapPin, Clock, Coffee, Users } from "lucide-react";
import { format } from "date-fns";
import { NavLink } from "@/components/NavLink";

interface CoffeeChatInvite {
  id: string;
  founder_id: string;
  investor_id: string;
  proposed_date: string | null;
  meeting_location: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  sender_profile?: any;
  receiver_profile?: any;
}

interface Match {
  id: string;
  name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
}

const CoffeeChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [receivedInvites, setReceivedInvites] = useState<CoffeeChatInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<CoffeeChatInvite[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    selectedMatch: "",
    proposedDate: "",
    meetingLocation: "",
    notes: ""
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      navigate('/');
      return;
    }

    setCurrentUserId(user.id);
    setCurrentUserType(profile.user_type);
    
    await Promise.all([
      fetchInvites(user.id, profile.user_type),
      fetchMatches(user.id)
    ]);
    
    setLoading(false);
  };

  const fetchMatches = async (userId: string) => {
    // Get all users I've liked
    const { data: myLikes } = await supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", userId)
      .eq("action", "like");

    if (!myLikes || myLikes.length === 0) return;

    const likedIds = myLikes.map(like => like.swiped_id);

    // Get users who liked me back
    const { data: mutualLikes } = await supabase
      .from("swipes")
      .select("swiper_id")
      .eq("action", "like")
      .in("swiper_id", likedIds)
      .eq("swiped_id", userId);

    if (!mutualLikes || mutualLikes.length === 0) return;

    const matchedIds = mutualLikes.map(like => like.swiper_id);

    // Fetch profiles of matched users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", matchedIds);

    if (profiles) {
      setMatches(profiles);
    }
  };

  const fetchInvites = async (userId: string, userType: string) => {
    const isFounder = userType === 'founder';
    
    // Fetch received invites
    const receivedField = isFounder ? 'founder_id' : 'investor_id';
    const { data: received } = await supabase
      .from('coffee_chats')
      .select('*')
      .eq(receivedField, userId)
      .neq(isFounder ? 'investor_id' : 'founder_id', userId)
      .order('created_at', { ascending: false });

    // Fetch sent invites  
    const sentField = isFounder ? 'investor_id' : 'founder_id';
    const { data: sent } = await supabase
      .from('coffee_chats')
      .select('*')
      .eq(isFounder ? 'founder_id' : 'investor_id', userId)
      .neq(sentField, userId)
      .order('created_at', { ascending: false });

    // Fetch profiles for invites
    const allInvites = [...(received || []), ...(sent || [])];
    const profileIds = new Set<string>();
    allInvites.forEach(invite => {
      profileIds.add(invite.founder_id);
      profileIds.add(invite.investor_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(profileIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Attach profiles to invites
    const receivedWithProfiles = (received || []).map(invite => ({
      ...invite,
      sender_profile: profileMap.get(isFounder ? invite.investor_id : invite.founder_id)
    }));

    const sentWithProfiles = (sent || []).map(invite => ({
      ...invite,
      receiver_profile: profileMap.get(isFounder ? invite.investor_id : invite.founder_id)
    }));

    setReceivedInvites(receivedWithProfiles);
    setSentInvites(sentWithProfiles);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !formData.selectedMatch) return;

    setSendingInvite(true);

    try {
      const selectedMatchProfile = matches.find(m => m.id === formData.selectedMatch);
      const isFounder = currentUserType === 'founder';
      
      const { error } = await supabase
        .from('coffee_chats')
        .insert({
          founder_id: isFounder ? currentUserId : formData.selectedMatch,
          investor_id: isFounder ? formData.selectedMatch : currentUserId,
          proposed_date: formData.proposedDate || null,
          meeting_location: formData.meetingLocation || null,
          notes: formData.notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Invite Sent!",
        description: `Coffee chat invite sent to ${selectedMatchProfile?.name}`,
      });

      setDialogOpen(false);
      setFormData({ selectedMatch: "", proposedDate: "", meetingLocation: "", notes: "" });
      await fetchInvites(currentUserId, currentUserType!);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invite",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRespond = async (inviteId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('coffee_chats')
        .update({ status })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? "Invite Accepted!" : "Invite Declined",
        description: status === 'accepted' ? "Get ready for your coffee chat!" : "The invite has been declined.",
      });

      if (currentUserId && currentUserType) {
        await fetchInvites(currentUserId, currentUserType);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to respond to invite",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Declined</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const pendingReceivedCount = receivedInvites.filter(i => i.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FundMatch
            </h1>
            <div className="flex gap-2 sm:gap-4">
              <NavLink to="/dashboard">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Discover</span>
              </NavLink>
              <NavLink to="/matches">
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink to="/coffeechat">
                <Coffee className="w-5 h-5" />
                <span className="hidden sm:inline">Invites</span>
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Coffee Chat Invites</h2>
            <p className="text-muted-foreground">Send and receive meeting invitations</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={matches.length === 0}>
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Coffee Chat Invite</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSendInvite} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select a Match</Label>
                  <Select 
                    value={formData.selectedMatch} 
                    onValueChange={(value) => setFormData({ ...formData, selectedMatch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose who to invite..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposedDate">Proposed Date & Time</Label>
                  <Input
                    id="proposedDate"
                    type="datetime-local"
                    value={formData.proposedDate}
                    onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meetingLocation">Meeting Location</Label>
                  <Input
                    id="meetingLocation"
                    placeholder="Coffee shop, address, or video call link"
                    value={formData.meetingLocation}
                    onChange={(e) => setFormData({ ...formData, meetingLocation: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Message (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add a personal message..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendingInvite || !formData.selectedMatch} className="flex-1">
                    {sendingInvite ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {matches.length === 0 && (
          <Card className="mb-6 border-dashed">
            <CardContent className="py-8 text-center">
              <Coffee className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                You need matches before you can send coffee chat invites.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
                Find Matches
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="relative">
              Received
              {pendingReceivedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingReceivedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {receivedInvites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No invites received yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedInvites.map((invite) => (
                  <Card key={invite.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={invite.sender_profile?.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {invite.sender_profile?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{invite.sender_profile?.name}</h3>
                            {getStatusBadge(invite.status)}
                          </div>
                          
                          {invite.proposed_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(invite.proposed_date), "PPP 'at' p")}
                            </div>
                          )}
                          
                          {invite.meeting_location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <MapPin className="w-4 h-4" />
                              {invite.meeting_location}
                            </div>
                          )}
                          
                          {invite.notes && (
                            <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">
                              "{invite.notes}"
                            </p>
                          )}

                          {invite.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                onClick={() => handleRespond(invite.id, 'accepted')}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRespond(invite.id, 'declined')}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sentInvites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No invites sent yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentInvites.map((invite) => (
                  <Card key={invite.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={invite.receiver_profile?.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {invite.receiver_profile?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">To: {invite.receiver_profile?.name}</h3>
                            {getStatusBadge(invite.status)}
                          </div>
                          
                          {invite.proposed_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(invite.proposed_date), "PPP 'at' p")}
                            </div>
                          )}
                          
                          {invite.meeting_location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {invite.meeting_location}
                            </div>
                          )}
                          
                          {invite.notes && (
                            <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">
                              "{invite.notes}"
                            </p>
                          )}

                          {invite.created_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Sent {format(new Date(invite.created_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoffeeChat;