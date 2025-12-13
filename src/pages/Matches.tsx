import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Send, Coffee, TrendingUp, Inbox, Users, Heart, FileText, Shield } from "lucide-react";
import { format } from "date-fns";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { RequestMenu } from "@/components/RequestMenu";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePendingRequests } from "@/hooks/usePendingRequests";

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface Match {
  profile: Profile;
  founderProfile?: any;
  investorProfile?: any;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface CoffeeChat {
  id: string;
  proposed_date: string | null;
  meeting_location: string | null;
  status: string | null;
  investor_id: string;
  founder_id: string;
}

export default function Matches() {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const pendingRequests = usePendingRequests();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    fetchCoffeeChats();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch.profile.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedMatch.profile.id},receiver_id=eq.${currentUserId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedMatch, currentUserId]);

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Get user type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentUserType(profile.user_type);
      }

      // Get all users I've liked
      const { data: myLikes } = await supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", user.id)
        .eq("action", "like");

      if (!myLikes || myLikes.length === 0) {
        setLoading(false);
        return;
      }

      const likedIds = myLikes.map(like => like.swiped_id);

      // Get users who liked me back
      const { data: mutualLikes } = await supabase
        .from("swipes")
        .select("swiper_id")
        .eq("action", "like")
        .in("swiper_id", likedIds)
        .eq("swiped_id", user.id);

      if (!mutualLikes || mutualLikes.length === 0) {
        setLoading(false);
        return;
      }

      const matchedIds = mutualLikes.map(like => like.swiper_id);

      // Fetch profiles of matched users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", matchedIds);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch additional profile details
      const matchesWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          let additionalProfile = null;
          
          if (profile.user_type === "founder") {
            const { data } = await supabase
              .from("founder_profiles")
              .select("*")
              .eq("profile_id", profile.id)
              .single();
            additionalProfile = data;
          } else if (profile.user_type === "investor") {
            const { data } = await supabase
              .from("investor_profiles")
              .select("*")
              .eq("profile_id", profile.id)
              .single();
            additionalProfile = data;
          }

          return {
            profile,
            founderProfile: profile.user_type === "founder" ? additionalProfile : null,
            investorProfile: profile.user_type === "investor" ? additionalProfile : null,
          };
        })
      );

      setMatches(matchesWithDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${matchId}),and(sender_id.eq.${matchId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchCoffeeChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("coffee_chats")
        .select("*")
        .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
        .order("proposed_date", { ascending: true });

      if (data) {
        setCoffeeChats(data);
      }
    } catch (error) {
      console.error("Error fetching coffee chats:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !currentUserId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedMatch.profile.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedMatch.profile.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CATALYST
            </h1>
            <div className="flex gap-2 sm:gap-4">
              <NavLink to="/dashboard">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Discover</span>
              </NavLink>
              <NavLink to="/matches">
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink to="/coffeechat">
                <Coffee className="w-5 h-5" />
                <span className="hidden sm:inline">Invites</span>
              </NavLink>
              <NavLink to="/requests" badge={pendingRequests}>
                <Inbox className="w-5 h-5" />
                <span className="hidden sm:inline">Requests</span>
              </NavLink>
              {currentUserType === 'founder' && (
                <>
                  <NavLink to="/safes">
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">SAFEs</span>
                  </NavLink>
                  <NavLink to="/captable">
                    <TrendingUp className="w-5 h-5" />
                    <span className="hidden sm:inline">Cap Table</span>
                  </NavLink>
                </>
              )}
              {currentUserType === 'investor' && (
                <NavLink to="/investments">
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Investments</span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin">
                  <Shield className="w-5 h-5" />
                  <span className="hidden sm:inline">Admin</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <Card className="lg:col-span-1 bg-card/95 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Your Matches ({matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-8">Loading matches...</p>
                ) : matches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No matches yet. Keep swiping!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div
                        key={match.profile.id}
                        onClick={() => setSelectedMatch(match)}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedMatch?.profile.id === match.profile.id
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-secondary/50 border border-border/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {match.profile.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{match.profile.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {match.founderProfile?.startup_name || match.investorProfile?.firm_name || match.profile.user_type}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {match.profile.user_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-card/95 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>
                {selectedMatch ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {selectedMatch.profile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{selectedMatch.profile.name}</p>
                        <p className="text-sm font-normal text-muted-foreground">
                          {selectedMatch.founderProfile?.one_liner || 
                           selectedMatch.investorProfile?.firm_name ||
                           "Start a conversation"}
                        </p>
                      </div>
                    </div>
                    {currentUserType === 'investor' && selectedMatch.profile.user_type === 'founder' && (
                      <RequestMenu 
                        targetId={selectedMatch.profile.id} 
                        targetName={selectedMatch.profile.name} 
                      />
                    )}
                  </div>
                ) : (
                  "Select a match to start chatting"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMatch ? (
                <>
                  <ScrollArea className="h-[450px] mb-4 pr-4">
                    {messages.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No messages yet. Say hi! 👋
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === currentUserId
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.sender_id === currentUserId
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(new Date(message.created_at), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  Select a match from the list to view conversation
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Coffee Chats */}
        <Card className="mt-6 bg-card/95 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Coffee Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coffeeChats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming coffee chats scheduled
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coffeeChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-4 rounded-lg bg-secondary/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={chat.status === "confirmed" ? "default" : "secondary"}>
                        {chat.status}
                      </Badge>
                      {chat.proposed_date && (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(chat.proposed_date), "MMM dd, yyyy")}
                        </span>
                      )}
                    </div>
                    {chat.meeting_location && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Location:</span>{" "}
                        {chat.meeting_location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
