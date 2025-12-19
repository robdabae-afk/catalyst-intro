import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FREE_DAILY_SWIPES = 5;
const MAX_REFERRAL_BONUS = 3;
const STORAGE_KEY = 'catalyst_daily_swipes';

interface DailySwipeData {
  date: string;
  count: number;
}

export const useDailySwipes = (userId: string | null, isPro: boolean) => {
  const [swipesToday, setSwipesToday] = useState(0);
  const [bonusSwipes, setBonusSwipes] = useState(0);
  const [loading, setLoading] = useState(true);

  const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Load swipe count and bonus swipes on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadSwipeData = async () => {
      const today = getTodayKey();
      
      // Check localStorage for cached swipe count
      const cached = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (cached) {
        try {
          const data: DailySwipeData = JSON.parse(cached);
          if (data.date === today) {
            setSwipesToday(data.count);
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch bonus swipes from approved referrals (capped at 3)
      const { count: approvedReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('status', 'approved');

      const calculatedBonus = Math.min(approvedReferrals || 0, MAX_REFERRAL_BONUS);
      setBonusSwipes(calculatedBonus);

      // Fetch today's swipe count from database
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

    loadSwipeData();
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

  // Total daily limit = base swipes + bonus (capped at 3)
  const dailyLimit = isPro ? Infinity : FREE_DAILY_SWIPES + bonusSwipes;
  const remainingSwipes = isPro ? Infinity : Math.max(0, dailyLimit - swipesToday);
  const canSwipe = isPro || swipesToday < dailyLimit;
  const shouldShowUpgradePrompt = !isPro && swipesToday >= dailyLimit;

  return {
    swipesToday,
    remainingSwipes,
    canSwipe,
    shouldShowUpgradePrompt,
    incrementSwipe,
    loading,
    FREE_DAILY_SWIPES,
    bonusSwipes,
    dailyLimit,
  };
};
