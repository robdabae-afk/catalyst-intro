import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const COOLDOWN_DAYS = 14;

interface SwipeHistoryData {
  swipedIds: Set<string>;
  resetAt: Date | null;
  loading: boolean;
}

/**
 * Hook to manage swipe history filtering.
 * Returns IDs that should be excluded from the swipe feed based on:
 * - Recent swipes within 14-day cooldown
 * - Active matches (excluded permanently)
 */
export function useSwipeHistory(userId: string | undefined) {
  const [data, setData] = useState<SwipeHistoryData>({
    swipedIds: new Set(),
    resetAt: null,
    loading: true
  });
  // Track IDs swiped during this session (not yet in DB query results)
  const [sessionSwipedIds, setSessionSwipedIds] = useState<Set<string>>(new Set());

  const fetchSwipeHistory = useCallback(async () => {
    if (!userId) {
      setData({ swipedIds: new Set(), resetAt: null, loading: false });
      return;
    }

    try {
      // 1. Get user's last reset timestamp (if any)
      const { data: resetData } = await supabase
        .from('discover_resets')
        .select('reset_at')
        .eq('user_id', userId)
        .maybeSingle();

      const resetAt = resetData?.reset_at ? new Date(resetData.reset_at) : null;
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

      // Use the later of: reset timestamp or 14 days ago
      const effectiveCutoff = resetAt && resetAt > cooldownDate ? resetAt : cooldownDate;

      // 2. Get swipes after the effective cutoff
      const { data: recentSwipes, error: swipesError } = await supabase
        .from('swipes')
        .select('swiped_id, created_at')
        .eq('swiper_id', userId)
        .gte('created_at', effectiveCutoff.toISOString());

      if (swipesError) {
        console.error('Error fetching swipe history:', swipesError);
        setData({ swipedIds: new Set(), resetAt, loading: false });
        return;
      }

      // 3. Get active matches (these are always excluded)
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
        .eq('status', 'active');

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
      }

      // Build set of IDs to exclude
      const excludeIds = new Set<string>();

      // Add recently swiped profiles (within cooldown)
      recentSwipes?.forEach(swipe => {
        excludeIds.add(swipe.swiped_id);
      });

      // Add matched profiles (always excluded from swipe feed)
      matches?.forEach(match => {
        const matchedUserId = match.user_1_id === userId ? match.user_2_id : match.user_1_id;
        excludeIds.add(matchedUserId);
      });

      setData({
        swipedIds: excludeIds,
        resetAt,
        loading: false
      });
    } catch (err) {
      console.error('Error in useSwipeHistory:', err);
      setData({ swipedIds: new Set(), resetAt: null, loading: false });
    }
  }, [userId]);

  useEffect(() => {
    fetchSwipeHistory();
  }, [fetchSwipeHistory]);

  /**
   * Reset the user's swipe history, making all profiles eligible again (except matches)
   */
  const resetSwipeHistory = useCallback(async () => {
    if (!userId) return false;

    try {
      // Upsert the reset timestamp
      const { error } = await supabase
        .from('discover_resets')
        .upsert(
          { user_id: userId, reset_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error resetting swipe history:', error);
        return false;
      }

      // Refresh the data
      await fetchSwipeHistory();
      return true;
    } catch (err) {
      console.error('Error in resetSwipeHistory:', err);
      return false;
    }
  }, [userId, fetchSwipeHistory]);

  /**
   * Filter profiles to exclude recently swiped and matched ones
   */
  const filterProfiles = useCallback(<T extends { id: string }>(profiles: T[]): T[] => {
    if (data.loading) return profiles;
    return profiles.filter(p => !data.swipedIds.has(p.id));
  }, [data.swipedIds, data.loading]);

  return {
    excludedIds: data.swipedIds,
    resetAt: data.resetAt,
    loading: data.loading,
    resetSwipeHistory,
    filterProfiles,
    refetch: fetchSwipeHistory
  };
}
