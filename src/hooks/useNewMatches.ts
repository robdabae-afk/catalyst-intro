import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useNewMatches() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all mutual matches (where both users liked each other)
      // A match exists when user A liked user B AND user B liked user A
      const { data: myLikes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)
        .eq('action', 'like');

      if (!myLikes || myLikes.length === 0) {
        setCount(0);
        return;
      }

      const likedUserIds = myLikes.map(s => s.swiped_id);

      // Find users who also liked me back (mutual matches)
      const { data: mutualMatches } = await supabase
        .from('swipes')
        .select('swiper_id, created_at')
        .eq('swiped_id', user.id)
        .eq('action', 'like')
        .in('swiper_id', likedUserIds);

      // Count matches from last 7 days as "new"
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newMatchCount = mutualMatches?.filter(m => 
        new Date(m.created_at) > sevenDaysAgo
      ).length || 0;

      setCount(newMatchCount);
    };

    fetchCount();

    // Subscribe to swipes changes
    const channel = supabase
      .channel('new-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swipes' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
