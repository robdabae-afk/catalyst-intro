import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let channelSeq = 0;

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

    // Subscribe to changes — unique topic per hook instance so multiple
    // mounts (e.g. Messages page + menu drawer) don't collide
    const topic = `unread-messages-${++channelSeq}-${Date.now()}`;
    const channel = supabase.channel(topic);
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      () => { fetchCount(); },
    );
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);


  return count;
}
