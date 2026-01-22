import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { ProfilePanel } from './ProfilePanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppNavigation } from '@/components/AppNavigation';

// Interfaces duplicated from Matches.tsx to ensure compatibility
interface Profile {
    id: string;
    name: string;
    email: string;
    user_type: string;
    avatar_url?: string;
    location?: string; // Added for ProfilePanel
    verified?: boolean; // Added for ProfilePanel
}

interface Match {
    profile: Profile;
    founderProfile?: any;
    investorProfile?: any;
    matchRecord?: {
        id: string;
        status: string;
        first_message_sender_id: string | null;
    };
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

interface DesktopLayoutProps {
    currentUser: any;
    isPro: boolean;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ currentUser, isPro }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Fetch Matches
    useEffect(() => {
        if (!currentUser) return;

        const fetchMatches = async () => {
            try {
                setLoadingMatches(true);
                // 1. Get my likes
                const { data: myLikes } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", currentUser.id).eq("action", "like");
                if (!myLikes || myLikes.length === 0) {
                    setLoadingMatches(false);
                    return;
                }
                const likedIds = myLikes.map(l => l.swiped_id);

                // 2. Get mutual likes
                const { data: mutualLikes } = await supabase.from("swipes").select("swiper_id").eq("action", "like").in("swiper_id", likedIds).eq("swiped_id", currentUser.id);
                if (!mutualLikes || mutualLikes.length === 0) {
                    setLoadingMatches(false);
                    return;
                }
                const matchedIds = mutualLikes.map(l => l.swiper_id);

                // 3. Get Profiles & Match Records
                const [profilesResult, matchRecordsResult] = await Promise.all([
                    supabase.from("profiles").select("*").in("id", matchedIds),
                    supabase.from("matches").select("*").or(`user_1_id.eq.${currentUser.id},user_2_id.eq.${currentUser.id}`)
                ]);

                const profiles = profilesResult.data || [];
                const matchRecords = matchRecordsResult.data || [];

                // 4. Get Details
                const matchesWithDetails = await Promise.all(profiles.map(async (profile) => {
                    let additional = null;
                    if (profile.user_type === 'founder') {
                        const { data } = await supabase.from("founder_profiles").select("*").eq("profile_id", profile.id).single();
                        additional = data;
                    } else if (profile.user_type === 'investor') {
                        const { data } = await supabase.from("investor_profiles").select("*").eq("profile_id", profile.id).single();
                        additional = data;
                    }

                    const matchRecord = matchRecords.find(m =>
                        (m.user_1_id === currentUser.id && m.user_2_id === profile.id) ||
                        (m.user_2_id === currentUser.id && m.user_1_id === profile.id)
                    );

                    return {
                        profile,
                        founderProfile: profile.user_type === 'founder' ? additional : null,
                        investorProfile: profile.user_type === 'investor' ? additional : null,
                        matchRecord: matchRecord ? {
                            id: matchRecord.id,
                            status: matchRecord.status,
                            first_message_sender_id: matchRecord.first_message_sender_id
                        } : undefined
                    };
                }));

                const activeMatches = matchesWithDetails.filter(m => !m.matchRecord || m.matchRecord.status === 'active');
                setMatches(activeMatches as Match[]);

            } catch (err) {
                console.error("Error fetching matches", err);
            } finally {
                setLoadingMatches(false);
            }
        };

        fetchMatches();
    }, [currentUser]);

    // Fetch Messages when Match Selected
    useEffect(() => {
        if (!selectedMatch || !currentUser) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            const { data } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedMatch.profile.id}),and(sender_id.eq.${selectedMatch.profile.id},receiver_id.eq.${currentUser.id})`)
                .order("created_at", { ascending: true });

            setMessages(data || []);
            setLoadingMessages(false);
        };

        fetchMessages();

        // Subscribe
        const channel = supabase
            .channel('chat-' + selectedMatch.profile.id)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${selectedMatch.profile.id},receiver_id=eq.${currentUser.id}` // Incoming
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .on('postgres_changes', { // Also listen for my own messages if I send via another tab/device? Optional but good practice. For now just incoming.
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${currentUser.id},receiver_id=eq.${selectedMatch.profile.id}`
            }, (payload) => {
                // Optimization: Only add if not already in state (handled by onSendMessage usually, but good for sync)
                setMessages(prev => {
                    if (prev.find(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new as Message];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [selectedMatch, currentUser]);

    const handleSendMessage = async (content: string) => {
        if (!selectedMatch || !currentUser) return;

        // Optimistic Update
        const tempId = Math.random().toString();
        const tempMessage = {
            id: tempId,
            sender_id: currentUser.id,
            content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        // Send
        const { error } = await supabase.from("messages").insert({
            sender_id: currentUser.id,
            receiver_id: selectedMatch.profile.id,
            content
        });

        if (error) {
            toast.error("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert
        } else {
            // Refresh to get real ID? Subscription might handle it basically
        }
    };

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-black text-white">
            <AppNavigation
                userType={currentUser?.user_type}
                userName={currentUser?.name}
                avatarUrl={currentUser?.avatar_url}
                isPro={isPro}
            />
            <div className="flex flex-1 overflow-hidden">
                {/* 1. Sidebar */}
                <Sidebar
                    matches={matches}
                    selectedMatchId={selectedMatch?.profile.id || null}
                    onSelectMatch={setSelectedMatch}
                    loading={loadingMatches}
                />

                {/* 2. Center Chat */}
                <div className="flex-1 min-w-[300px] border-r border-[#333]">
                    <ChatPanel
                        match={selectedMatch}
                        messages={messages}
                        currentUserId={currentUser?.id}
                        onSendMessage={handleSendMessage}
                        loading={loadingMessages}
                    />
                </div>

                {/* 3. Right Profile Panel */}
                <div className={`w-[600px] flex-shrink-0 transition-all duration-500 ease-in-out ${selectedMatch ? 'translate-x-0 opacity-100' : 'translate-x-[100px] opacity-0 hidden'}`}>
                    {/* Only render if we have a match selected */}
                    {selectedMatch && (
                        <ProfilePanel
                            profile={{
                                ...selectedMatch.profile,
                                founder_profiles: selectedMatch.founderProfile,
                                investor_profiles: selectedMatch.investorProfile
                            }}
                            userType={selectedMatch.profile.user_type as 'founder' | 'investor'}
                        />
                    )}
                </div>
                {!selectedMatch && (
                    <div className="w-[600px] flex-shrink-0 bg-[#050505] flex items-center justify-center border-l border-[#333]">
                        <div className="text-zinc-700 text-center">
                            <p className="text-lg font-playfair mb-2">Select a match</p>
                            <p className="text-sm">to view their profile details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
