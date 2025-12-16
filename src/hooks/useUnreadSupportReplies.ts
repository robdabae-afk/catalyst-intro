import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadSupportReplies() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's open tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'open');

      if (!tickets || tickets.length === 0) {
        setCount(0);
        return;
      }

      // Count messages from admins (not from the user) in open tickets
      const ticketIds = tickets.map(t => t.id);
      
      const { data: adminMessages } = await supabase
        .from('support_messages')
        .select('id, ticket_id, sender_id, created_at')
        .in('ticket_id', ticketIds)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false });

      // Count admin replies from last 24 hours as "new"
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const newReplies = adminMessages?.filter(m => 
        new Date(m.created_at) > oneDayAgo
      ).length || 0;

      setCount(newReplies);
    };

    fetchCount();

    // Subscribe to support_messages changes
    const channel = supabase
      .channel('support-replies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
