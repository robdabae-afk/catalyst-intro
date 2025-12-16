import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageCircle, CheckCircle, User, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface TicketWithUser {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export function AdminSupportPanel() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAdminAndTickets();
  }, []);

  useEffect(() => {
    // Subscribe to new tickets
    const ticketChannel = supabase
      .channel('admin-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-messages-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadAdminAndTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminId(user.id);
    }
    await loadTickets();
  };

  const loadTickets = async () => {
    try {
      // Get all open tickets first, then closed
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (ticketError) throw ticketError;

      if (!ticketData || ticketData.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      // Get user profiles for these tickets
      const userIds = [...new Set(ticketData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      // Get last message time for each ticket
      const { data: lastMessages } = await supabase
        .from('support_messages')
        .select('ticket_id, created_at')
        .in('ticket_id', ticketData.map(t => t.id))
        .order('created_at', { ascending: false });

      const ticketsWithUsers: TicketWithUser[] = ticketData.map(ticket => {
        const profile = profiles?.find(p => p.id === ticket.user_id);
        const lastMsg = lastMessages?.find(m => m.ticket_id === ticket.id);
        
        return {
          id: ticket.id,
          user_id: ticket.user_id,
          status: ticket.status as 'open' | 'closed',
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          user_name: profile?.name || 'Unknown User',
          user_email: profile?.email || '',
          user_avatar: profile?.avatar_url,
          last_message_at: lastMsg?.created_at || ticket.created_at,
          unread_count: 0 // Could implement proper unread tracking
        };
      });

      // Sort: open tickets first, then by last message
      ticketsWithUsers.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return new Date(b.last_message_at || b.created_at).getTime() - 
               new Date(a.last_message_at || a.created_at).getTime();
      });

      setTickets(ticketsWithUsers);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading tickets",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const selectTicket = async (ticket: TicketWithUser) => {
    setSelectedTicket(ticket);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading messages",
        description: error.message
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !adminId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: adminId,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Ticket closed",
        description: "The support ticket has been marked as resolved."
      });

      setSelectedTicket({ ...selectedTicket, status: 'closed' });
      loadTickets();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error closing ticket",
        description: error.message
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Ticket List */}
        <div className="border-r border-border">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Support Tickets
              {openTickets.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {openTickets.length} open
                </Badge>
              )}
            </h3>
          </div>
          <ScrollArea className="h-[calc(600px-57px)]">
            {tickets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No support tickets yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={ticket.user_avatar || undefined} />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{ticket.user_name}</span>
                          <Badge 
                            variant={ticket.status === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.user_email}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.last_message_at || ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="col-span-2 flex flex-col">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedTicket.user_avatar || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedTicket.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                  </div>
                </div>
                {selectedTicket.status === 'open' && (
                  <Button variant="outline" size="sm" onClick={closeTicket}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Close Ticket
                  </Button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.sender_id === adminId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === adminId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              {selectedTicket.status === 'open' ? (
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-t bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">This ticket is closed</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
