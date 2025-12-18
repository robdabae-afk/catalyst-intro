import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FREE_DAILY_SWIPES = 5;
const STORAGE_KEY = 'catalyst_daily_swipes';

interface DailySwipeData {
  date: string;
  count: number;
}

export const useDailySwipes = (userId: string | null, isPro: boolean) => {
  const [swipesToday, setSwipesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Load swipe count on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadSwipeCount = async () => {
      const today = getTodayKey();
      
      // First check localStorage for cached value
      const cached = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (cached) {
        try {
          const data: DailySwipeData = JSON.parse(cached);
          if (data.date === today) {
            setSwipesToday(data.count);
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch from database
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('swiper_id', userId)
        .gte('created_at', startOfDay.toISOString());

      if (!error && count !== null) {
        setSwipesToday(count);
        // Cache the result
        localStorage.setItem(
          `${STORAGE_KEY}_${userId}`,
          JSON.stringify({ date: today, count })
        );
      }
      
      setLoading(false);
    };

    loadSwipeCount();
  }, [userId]);

  const incrementSwipe = useCallback(() => {
    if (!userId) return;
    
    const newCount = swipesToday + 1;
    setSwipesToday(newCount);
    
    // Update cache
    localStorage.setItem(
      `${STORAGE_KEY}_${userId}`,
      JSON.stringify({ date: getTodayKey(), count: newCount })
    );
  }, [userId, swipesToday]);

  const remainingSwipes = isPro ? Infinity : Math.max(0, FREE_DAILY_SWIPES - swipesToday);
  const canSwipe = isPro || swipesToday < FREE_DAILY_SWIPES;
  const shouldShowUpgradePrompt = !isPro && swipesToday >= FREE_DAILY_SWIPES;

  return {
    swipesToday,
    remainingSwipes,
    canSwipe,
    shouldShowUpgradePrompt,
    incrementSwipe,
    loading,
    FREE_DAILY_SWIPES,
  };
};
