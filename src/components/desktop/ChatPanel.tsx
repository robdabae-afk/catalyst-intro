import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreVertical, Phone, Video, Send } from "lucide-react";
import { format } from "date-fns";

interface ChatPanelProps {
    match: any;
    messages: any[];
    currentUserId: string;
    onSendMessage: (content: string) => void;
    loading?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ match, messages, currentUserId, onSendMessage, loading }) => {
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
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (!match) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#090909] text-zinc-600">
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
        <div className="flex-1 flex flex-col bg-surface-dark h-full relative">
            {/* Header */}
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-border-subtle bg-surface-dark">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-zinc-800">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-400">{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-white font-medium text-sm">{profile.name}</h2>
                        <p className="text-zinc-500 text-xs">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-zinc-800">
                        <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-zinc-800">
                        <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-zinc-800">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                    {loading ? (
                        <div className="text-center text-zinc-600 text-sm py-10">Loading history...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-zinc-600 text-sm py-10">
                            <p>This is the start of your conversation with {profile.name}.</p>
                            <p className="text-xs mt-1">Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${isMe
                                        ? 'bg-zinc-800 text-white rounded-tr-sm'
                                        : 'bg-[#1A1A1A] text-zinc-200 border border-border-subtle rounded-tl-sm'
                                        }`}>
                                        <p>{msg.content}</p>
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
            <div className="p-4 bg-surface-dark border-t border-border-subtle">
                <div className="max-w-3xl mx-auto flex items-center gap-2 bg-[#1A1A1A] rounded-full px-4 py-2 border border-border-subtle focus-within:border-zinc-600 transition-colors">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="bg-transparent border-none text-white placeholder:text-zinc-600 focus-visible:ring-0 shadow-none h-auto py-2"
                    />
                    <Button
                        onClick={handleSend}
                        size="icon"
                        className="rounded-full bg-luxury-gold hover:bg-luxury-gold/90 text-black h-8 w-8 shrink-0"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-zinc-600">Use arrow keys to navigate profile</span>
                </div>
            </div>
        </div>
    );
};
