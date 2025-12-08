import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingRequests() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: pendingCount } = await supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', user.id)
        .eq('status', 'pending');

      setCount(pendingCount || 0);
    };

    fetchCount();

    // Subscribe to changes
    const channel = supabase
      .channel('pending-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_requests' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
