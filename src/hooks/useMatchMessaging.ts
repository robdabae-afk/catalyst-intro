import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MatchInfo {
  matchId: string | null;
  status: 'active' | 'unmatched' | 'successful_collaboration' | null;
  firstMessageSenderId: string | null;
  investorSentFirstMessage: boolean;
  canSendMessage: boolean;
  loading: boolean;
}

interface UseMatchMessagingProps {
  currentUserId: string | null;
  matchedUserId: string | null;
  currentUserType: 'founder' | 'investor' | null;
  isPro: boolean;
}

export const useMatchMessaging = ({
  currentUserId,
  matchedUserId,
  currentUserType,
  isPro,
}: UseMatchMessagingProps): MatchInfo & {
  createOrGetMatch: () => Promise<string | null>;
  recordFirstMessage: (senderId: string) => Promise<void>;
  unmatch: () => Promise<boolean>;
  markAsSuccessful: () => Promise<boolean>;
} => {
  const [matchInfo, setMatchInfo] = useState<MatchInfo>({
    matchId: null,
    status: null,
    firstMessageSenderId: null,
    investorSentFirstMessage: false,
    canSendMessage: true,
    loading: true,
  });

  const fetchMatchInfo = useCallback(async () => {
    if (!currentUserId || !matchedUserId) {
      setMatchInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Find the match record
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .or(
          `and(user_1_id.eq.${currentUserId},user_2_id.eq.${matchedUserId}),and(user_1_id.eq.${matchedUserId},user_2_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (error) throw error;

      if (match) {
        // Determine if investor sent the first message
        // The investor is the one who is NOT the founder
        const isCurrentUserFounder = currentUserType === 'founder';
        const investorId = isCurrentUserFounder ? matchedUserId : currentUserId;
        const investorSentFirst = match.first_message_sender_id === investorId;

        // For Basic Founders: can only send messages if investor sent first
        // For Pro Founders: can always send (within initiation limits handled elsewhere)
        // For Investors: can always send
        let canSend = true;
        if (currentUserType === 'founder' && !isPro) {
          canSend = investorSentFirst;
        }

        setMatchInfo({
          matchId: match.id,
          status: match.status,
          firstMessageSenderId: match.first_message_sender_id,
          investorSentFirstMessage: investorSentFirst,
          canSendMessage: canSend && match.status === 'active',
          loading: false,
        });
      } else {
        setMatchInfo(prev => ({ ...prev, matchId: null, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching match info:', error);
      setMatchInfo(prev => ({ ...prev, loading: false }));
    }
  }, [currentUserId, matchedUserId, currentUserType, isPro]);

  useEffect(() => {
    fetchMatchInfo();
  }, [fetchMatchInfo]);

  const createOrGetMatch = useCallback(async (): Promise<string | null> => {
    if (!currentUserId || !matchedUserId) return null;

    try {
      // Check if match already exists
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user_1_id.eq.${currentUserId},user_2_id.eq.${matchedUserId}),and(user_1_id.eq.${matchedUserId},user_2_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existing) return existing.id;

      // Create new match (use smaller ID as user_1 for consistency)
      const [user1, user2] = currentUserId < matchedUserId 
        ? [currentUserId, matchedUserId] 
        : [matchedUserId, currentUserId];

      const { data: newMatch, error } = await supabase
        .from('matches')
        .insert({
          user_1_id: user1,
          user_2_id: user2,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) throw error;
      
      await fetchMatchInfo();
      return newMatch.id;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }, [currentUserId, matchedUserId, fetchMatchInfo]);

  const recordFirstMessage = useCallback(async (senderId: string) => {
    if (!matchInfo.matchId || matchInfo.firstMessageSenderId) return;

    try {
      await supabase
        .from('matches')
        .update({
          first_message_sender_id: senderId,
          first_message_at: new Date().toISOString(),
        })
        .eq('id', matchInfo.matchId);

      await fetchMatchInfo();
    } catch (error) {
      console.error('Error recording first message:', error);
    }
  }, [matchInfo.matchId, matchInfo.firstMessageSenderId, fetchMatchInfo]);

  const unmatch = useCallback(async (): Promise<boolean> => {
    if (!matchInfo.matchId || !currentUserId) return false;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'unmatched',
          unmatched_by: currentUserId,
          unmatched_at: new Date().toISOString(),
        })
        .eq('id', matchInfo.matchId);

      if (error) throw error;
      await fetchMatchInfo();
      return true;
    } catch (error) {
      console.error('Error unmatching:', error);
      return false;
    }
  }, [matchInfo.matchId, currentUserId, fetchMatchInfo]);

  const markAsSuccessful = useCallback(async (): Promise<boolean> => {
    if (!matchInfo.matchId || !currentUserId) return false;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'successful_collaboration',
          marked_successful_by: currentUserId,
          marked_successful_at: new Date().toISOString(),
        })
        .eq('id', matchInfo.matchId);

      if (error) throw error;
      await fetchMatchInfo();
      return true;
    } catch (error) {
      console.error('Error marking as successful:', error);
      return false;
    }
  }, [matchInfo.matchId, currentUserId, fetchMatchInfo]);

  return {
    ...matchInfo,
    createOrGetMatch,
    recordFirstMessage,
    unmatch,
    markAsSuccessful,
  };
};
