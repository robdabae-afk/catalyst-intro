import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessages() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      setCount(unreadCount || 0);
    };

    fetchCount();

    // Subscribe to changes
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
