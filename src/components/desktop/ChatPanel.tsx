import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

interface ChatPanelProps {
  match: any;
  messages: any[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  loading?: boolean;
  onBack?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  match, 
  messages, 
  currentUserId, 
  onSendMessage, 
  loading,
  onBack 
}) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!match) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-zinc-600">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const profile = match.profile;
  const subtitle = match.founderProfile?.startup_name
    ? `Founder @ ${match.founderProfile.startup_name}`
    : match.investorProfile?.firm_name
      ? `Investor @ ${match.investorProfile.firm_name}`
      : profile.user_type;

  return (
    <div className="flex-1 flex flex-col bg-black h-full">
      {/* Header with Back Button */}
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-zinc-800 bg-black">
        <div className="flex items-center gap-4">
          {/* Back to Discover Button */}
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">Back to Discover</span>
            </Button>
          )}
          
          <div className="h-6 w-px bg-zinc-800" />
          
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-zinc-700">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-zinc-800 text-zinc-400">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-white font-medium text-sm">{profile.name}</h2>
              <p className="text-zinc-500 text-xs">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center text-zinc-600 text-sm py-10">Loading history...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-zinc-600 text-sm py-20">
              <p className="font-playfair text-lg text-zinc-500 mb-2">Start the conversation</p>
              <p className="text-xs">This is the beginning of your chat with {profile.name}.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[65%] rounded-2xl px-5 py-3 text-sm ${
                    isMe
                      ? 'bg-luxury-gold/10 text-white border border-luxury-gold/20 rounded-tr-sm'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-luxury-gold/60' : 'text-zinc-500'}`}>
                      {format(new Date(msg.created_at), 'p')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-black border-t border-zinc-800">
        <div className="max-w-3xl mx-auto flex items-center gap-3 bg-zinc-900 rounded-2xl px-5 py-3 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-transparent border-none text-white placeholder:text-zinc-600 focus-visible:ring-0 shadow-none h-auto py-1 text-sm"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full bg-luxury-gold hover:bg-luxury-gold/90 text-black h-9 w-9 shrink-0"
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
