import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LAST_VIEWED_KEY = 'support_chat_last_viewed';

export function useUnreadSupportReplies() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
    const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);

    // Get user's open tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (!tickets || tickets.length === 0) {
      setCount(0);
      return;
    }

    const ticketIds = tickets.map(t => t.id);
    
    const { data: adminMessages } = await supabase
      .from('support_messages')
      .select('id, created_at')
      .in('ticket_id', ticketIds)
      .neq('sender_id', user.id)
      .gt('created_at', lastViewedDate.toISOString());

    setCount(adminMessages?.length || 0);
  }, []);

  const markAsViewed = useCallback(() => {
    localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
    setCount(0);
  }, []);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel('support-replies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCount]);

  return { count, markAsViewed };
}
