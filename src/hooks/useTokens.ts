import { useState, useEffect } from 'react';

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

    // Token balance feature not yet implemented - return placeholder
    // TODO: Add tokens column to profiles table or create token_balances table
    setTokenData({
      balance: 0,
      loading: false,
      error: null,
    });
  }, [userId]);

  return tokenData;
};


