import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Send, Coffee, Eye, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { RequestMenu } from "@/components/RequestMenu";
import { AppNavigation } from "@/components/AppNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface Profile {
  id: string;
  name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
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
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
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

      // Get user info
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, name, avatar_url")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentUserType(profile.user_type);
        setCurrentUserName(profile.name);
        setCurrentUserAvatar(profile.avatar_url);
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

      // Only fetch future coffee chats
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("coffee_chats")
        .select("*")
        .or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`)
        .gte("proposed_date", now)
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

  const handleBackToList = () => {
    setSelectedMatch(null);
    setMessages([]);
  };

  // Mobile: Full-screen chat view when a match is selected
  if (isMobile && selectedMatch) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Chat Header */}
        <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary">
                {selectedMatch.profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedMatch.profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedMatch.founderProfile?.startup_name || 
                 selectedMatch.investorProfile?.firm_name ||
                 selectedMatch.profile.user_type}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/profile/${selectedMatch.profile.id}`)}
              >
                <Eye className="w-5 h-5" />
              </Button>
              {currentUserType === 'investor' && selectedMatch.profile.user_type === 'founder' && (
                <RequestMenu 
                  targetId={selectedMatch.profile.id} 
                  targetName={selectedMatch.profile.name} 
                />
              )}
            </div>
          </div>
        </header>

        {/* Mobile Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
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
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
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
        </div>

        {/* Mobile Chat Input */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
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
        </div>
      </div>
    );
  }

  // Desktop layout OR Mobile matches list
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <AppNavigation 
        userType={currentUserType as 'founder' | 'investor' | null}
        userName={currentUserName || undefined}
        avatarUrl={currentUserAvatar || undefined}
        pageTitle="Matches"
      />

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
              <ScrollArea className="h-[400px] lg:h-[600px] pr-4">
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
                        <div className="flex items-center gap-2">
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {match.profile.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="font-semibold truncate">{match.profile.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {match.founderProfile?.startup_name || match.investorProfile?.firm_name || match.profile.user_type}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize shrink-0 text-[10px] px-2 py-0.5 whitespace-nowrap min-w-fit">
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

          {/* Chat Area - Desktop Only */}
          {!isMobile && (
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/profile/${selectedMatch.profile.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                        {currentUserType === 'investor' && selectedMatch.profile.user_type === 'founder' && (
                          <RequestMenu 
                            targetId={selectedMatch.profile.id} 
                            targetName={selectedMatch.profile.name} 
                          />
                        )}
                      </div>
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
          )}
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
                      <Badge variant={chat.status === 'accepted' ? 'default' : 'secondary'}>
                        {chat.status || 'pending'}
                      </Badge>
                    </div>
                    {chat.proposed_date && (
                      <p className="text-sm">
                        {format(new Date(chat.proposed_date), "PPP 'at' p")}
                      </p>
                    )}
                    {chat.meeting_location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {chat.meeting_location}
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
