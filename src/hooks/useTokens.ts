import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TokenData {
  balance: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTokens = (userId: string | null): TokenData => {
  const [tokenData, setTokenData] = useState<{ balance: number; loading: boolean; error: string | null }>({
    balance: 0,
    loading: true,
    error: null,
  });

  const fetchTokens = useCallback(async () => {
    if (!userId) {
      setTokenData({ balance: 0, loading: false, error: null });
      return;
    }

    setTokenData(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error);
      setTokenData({ balance: 0, loading: false, error: error.message });
    } else {
      setTokenData({ balance: data?.tokens || 0, loading: false, error: null });
    }
  }, [userId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    ...tokenData,
    refetch: fetchTokens,
  };
};
