import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRO_FOUNDER_WEEKLY_INITIATIONS } from '@/lib/membership-constants';

interface WeeklyInitiationsData {
  initiationsUsed: number;
  remaining: number;
  canInitiate: boolean;
  loading: boolean;
  increment: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useWeeklyInitiations = (
  userId: string | null,
  isPro: boolean,
  userType: 'founder' | 'investor' | null
): WeeklyInitiationsData => {
  const [initiationsUsed, setInitiationsUsed] = useState(0);
  const [resetAt, setResetAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInitiations = useCallback(async () => {
    if (!userId || userType !== 'founder' || !isPro) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('weekly_initiations_count, weekly_initiations_reset_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const now = new Date();
      const resetDate = data?.weekly_initiations_reset_at 
        ? new Date(data.weekly_initiations_reset_at) 
        : null;

      // Check if we need to reset (7 days passed)
      if (!resetDate || now >= resetDate) {
        // Reset the count
        await supabase
          .from('profiles')
          .update({
            weekly_initiations_count: 0,
            weekly_initiations_reset_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', userId);

        setInitiationsUsed(0);
        setResetAt(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
      } else {
        setInitiationsUsed(data?.weekly_initiations_count || 0);
        setResetAt(resetDate);
      }
    } catch (error) {
      console.error('Error fetching weekly initiations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, isPro]);

  useEffect(() => {
    fetchInitiations();
  }, [fetchInitiations]);

  const increment = useCallback(async (): Promise<boolean> => {
    if (!userId || !isPro || userType !== 'founder') return false;
    if (initiationsUsed >= PRO_FOUNDER_WEEKLY_INITIATIONS) return false;

    try {
      const newCount = initiationsUsed + 1;
      const now = new Date();
      
      // If no reset date set, set it to 7 days from now
      const newResetAt = resetAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('profiles')
        .update({
          weekly_initiations_count: newCount,
          weekly_initiations_reset_at: newResetAt.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setInitiationsUsed(newCount);
      setResetAt(newResetAt);
      return true;
    } catch (error) {
      console.error('Error incrementing weekly initiations:', error);
      return false;
    }
  }, [userId, isPro, userType, initiationsUsed, resetAt]);

  // Non-pro founders or investors don't use this system
  if (!isPro || userType !== 'founder') {
    return {
      initiationsUsed: 0,
      remaining: 0,
      canInitiate: false,
      loading: false,
      increment: async () => false,
      refresh: async () => {},
    };
  }

  const remaining = Math.max(0, PRO_FOUNDER_WEEKLY_INITIATIONS - initiationsUsed);
  const canInitiate = remaining > 0;

  return {
    initiationsUsed,
    remaining,
    canInitiate,
    loading,
    increment,
    refresh: fetchInitiations,
  };
};
