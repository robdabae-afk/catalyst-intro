import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TokenData {
  balance: number;
  loading: boolean;
  error: string | null;
}

export const useTokens = (userId: string | null): TokenData => {
  const [tokenData, setTokenData] = useState<TokenData>({
    balance: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setTokenData({ balance: 0, loading: false, error: null });
      return;
    }

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tokens')
          .eq('id', userId)
          .single();

        if (error) throw error;

        setTokenData({
          balance: data?.tokens || 0,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        console.error('Error fetching token balance:', error);
        setTokenData({
          balance: 0,
          loading: false,
          error: error.message || 'Failed to fetch token balance',
        });
      }
    };

    fetchBalance();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`tokens-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newTokens = (payload.new as any)?.tokens || 0;
          setTokenData((prev) => ({
            ...prev,
            balance: newTokens,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return tokenData;
};

