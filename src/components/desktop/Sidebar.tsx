import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SidebarProps {
    matches: any[]; // Using any to match the shape coming from parent
    selectedMatchId: string | null;
    onSelectMatch: (match: any) => void;
    loading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ matches, selectedMatchId, onSelectMatch, loading }) => {

    // Split matches into "New Matches" (Queue) and "Conversations"
    // Assumption: A match is a "Conversation" if it has messages or is 'active' with content?
    // Actually, Matches.tsx doesn't preload message counts.
    // We'll assume if there is a 'matchRecord' it's a match.
    // But to distinguish "Queue" vs "Conversation", usually it's based on if a message has been sent.
    // The `matchRecord` has `first_message_sender_id`. If active and this is null, it might be new?
    // Or we simply put everyone in Conversation list if we can't tell, but Mockup has two sections.
    // Let's deduce: If `first_message_sender_id` is present, it's a conversation. Else, it's a new match.

    const newMatches = matches.filter(m => !m.matchRecord?.first_message_sender_id);
    const conversations = matches.filter(m => m.matchRecord?.first_message_sender_id);

    // Fallback: if all have no `first_message_sender_id`, maybe just put them all in conversations?
    // Or if `conversations` is empty, maybe just show all in Conversations?
    // Let's stick to the logic: No message = New Match (Queue). Message = Conversation.

    return (
        <div className="glass w-[360px] flex flex-col border-r border-border-subtle h-full flex-shrink-0">
            {/* Header */}
            <div className="p-6 pb-2">
                <h3 className="text-luxury-gold text-xs uppercase tracking-widest font-bold mb-4">Match Queue</h3>

                {/* Match Queue Row */}
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex w-max space-x-4 px-1">
                        {loading ? (
                            <div className="text-zinc-500 text-sm">Loading...</div>
                        ) : newMatches.length === 0 ? (
                            <div className="text-zinc-600 text-xs italic">No new matches</div>
                        ) : (
                            newMatches.map(match => (
                                <div
                                    key={match.profile.id}
                                    className="flex flex-col items-center gap-2 cursor-pointer group"
                                    onClick={() => onSelectMatch(match)}
                                >
                                    <div className="relative">
                                        <Avatar className="w-14 h-14 border-2 border-luxury-gold/50 group-hover:border-luxury-gold transition-all">
                                            <AvatarImage src={match.profile.avatar_url} />
                                            <AvatarFallback className="bg-zinc-800 text-luxury-gold">{match.profile.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-luxury-gold rounded-full border-2 border-black"></div>
                                    </div>
                                    <span className="text-xs text-zinc-400 group-hover:text-white truncate w-14 text-center">
                                        {match.profile.name.split(' ')[0]}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="h-px bg-[#222] mx-4 mb-4"></div>

            {/* Conversations List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 mb-2 flex items-center justify-between">
                    <h3 className="text-luxury-gold text-xs uppercase tracking-widest font-bold">Conversations</h3>
                    <span className="text-xs text-zinc-500">Recent</span>
                </div>

                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-1 pb-4">
                        {loading && conversations.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">Loading chats...</div>
                        ) : conversations.length === 0 && newMatches.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">No matches yet. Go swipe!</div>
                        ) : (
                            conversations.map(match => (
                                <div
                                    key={match.profile.id}
                                    onClick={() => onSelectMatch(match)}
                                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${selectedMatchId === match.profile.id
                                        ? 'bg-surface-card border border-zinc-800'
                                        : 'hover:bg-zinc-900/50 border border-transparent'
                                        }`}
                                >
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={match.profile.avatar_url} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400">{match.profile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm font-medium ${selectedMatchId === match.profile.id ? 'text-white' : 'text-zinc-300'}`}>
                                                {match.profile.name}
                                            </span>
                                            {/* Timestamp would go here if we had msg data in this list */}
                                            {/* <span className="text-[10px] text-zinc-600">10:42 PM</span> */}
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">
                                            {match.founderProfile?.startup_name || match.investorProfile?.firm_name || 'Click to chat'}
                                        </p>
                                    </div>
                                    {selectedMatchId === match.profile.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold"></div>
                                    )}
                                </div>
                            ))
                        )}
                        {conversations.length === 0 && newMatches.length > 0 && (
                            <div className="p-4 text-center text-zinc-500 text-xs italic">
                                Start a conversation with your new matches above!
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
