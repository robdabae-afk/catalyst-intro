import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  BASIC_FOUNDER_ACTIVE_CHATS,
  PRO_FOUNDER_ACTIVE_CHATS,
  BASIC_INVESTOR_ACTIVE_CHATS,
  PRO_INVESTOR_ACTIVE_CHATS,
} from '@/lib/membership-constants';

interface ActiveConversationsData {
  activeCount: number;
  limit: number;
  canStartNew: boolean;
  remaining: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useActiveConversations = (
  userId: string | null,
  userType: 'founder' | 'investor' | null,
  isPro: boolean
): ActiveConversationsData => {
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Determine the limit based on user type and subscription
  const limit = userType === 'founder'
    ? (isPro ? PRO_FOUNDER_ACTIVE_CHATS : BASIC_FOUNDER_ACTIVE_CHATS)
    : (isPro ? PRO_INVESTOR_ACTIVE_CHATS : BASIC_INVESTOR_ACTIVE_CHATS);

  const fetchActiveCount = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
        .eq('status', 'active');

      if (error) throw error;
      setActiveCount(data ? 0 : 0); // head query returns null data
      
      // Use count from the response
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
        .eq('status', 'active');

      setActiveCount(count || 0);
    } catch (error) {
      console.error('Error fetching active conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActiveCount();

    if (!userId) return;

    // Subscribe to match changes
    const channel = supabase
      .channel(`active-conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchActiveCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchActiveCount]);

  const canStartNew = limit === Infinity || activeCount < limit;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - activeCount);

  return {
    activeCount,
    limit,
    canStartNew,
    remaining,
    loading,
    refresh: fetchActiveCount,
  };
};
