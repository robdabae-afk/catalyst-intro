import { useTokens } from '@/hooks/useTokens';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';
import { Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TokenBalanceProps {
  userId: string;
  variant?: 'default' | 'compact' | 'badge';
  showPurchaseButton?: boolean;
}

export const TokenBalance = ({ 
  userId, 
  variant = 'default',
  showPurchaseButton = true 
}: TokenBalanceProps) => {
  const { balance, loading } = useTokens(userId);

  if (variant === 'badge') {
    return (
      <Badge variant="secondary" className="gap-1">
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <Coins className="w-3 h-3" />
            {balance}
          </>
        )}
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">{balance}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </>
        )}
        {showPurchaseButton && (
          <TokenPurchaseDialog userId={userId} />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-amber-500" />
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span className="text-2xl font-bold">{balance}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </>
        )}
      </div>
      {showPurchaseButton && (
        <TokenPurchaseDialog userId={userId} />
      )}
    </div>
  );
};

