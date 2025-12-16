import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface Ticket {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
}

interface SupportChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function SupportChat({ open, onOpenChange, userId }: SupportChatProps) {
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && userId) {
      loadOrCreateTicket();
    }
  }, [open, userId]);

  useEffect(() => {
    if (!ticket) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`support-messages-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadOrCreateTicket = async () => {
    setLoading(true);
    try {
      // Check for existing open ticket
      const { data: existingTicket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .maybeSingle();

      if (ticketError) throw ticketError;

      if (existingTicket) {
        setTicket(existingTicket as Ticket);
        await loadMessages(existingTicket.id);
      } else {
        setTicket(null);
        setMessages([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading support chat",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setMessages(data as Message[]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      let currentTicket = ticket;

      // Create ticket if none exists
      if (!currentTicket) {
        const { data: newTicket, error: createError } = await supabase
          .from('support_tickets')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        currentTicket = newTicket as Ticket;
        setTicket(currentTicket);
      }

      // Send message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: currentTicket.id,
          sender_id: userId,
          message: newMessage.trim()
        });

      if (messageError) throw messageError;

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Contact Support
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-sm">Send a message to start a conversation with our support team.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.sender_id === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === userId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {ticket?.status === 'closed' ? (
              <div className="p-4 border-t bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  This ticket has been closed. Send a new message to open a new ticket.
                </p>
              </div>
            ) : null}

            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type your message..."
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
