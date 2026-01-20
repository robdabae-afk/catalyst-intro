import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import { Loader2, Coins, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TOKEN_PACKAGES } from '@/lib/stripe-constants';

interface TokenPurchaseDialogProps {
  userId: string;
  trigger?: React.ReactNode;
  onPurchaseComplete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TokenPurchaseDialog = ({ 
  userId, 
  trigger,
  onPurchaseComplete,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: TokenPurchaseDialogProps) => {
  const { toast } = useToast();
  const { balance, loading: balanceLoading } = useTokens(userId);
  const [loading, setLoading] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  
  const dialogOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setDialogOpen = controlledOnOpenChange || setInternalOpen;

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    setPurchasingPackageId(packageId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-tokens', {
        body: {
          action: 'purchase_tokens',
          packageId,
        },
      });

      if (error) {
        console.error('Token purchase error:', error);
        throw new Error(error.message || 'Failed to start token purchase');
      }

      if (data?.error) {
        console.error('Token purchase error from function:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Token purchase failed:', error);
      toast({
        variant: 'destructive',
        title: 'Purchase Error',
        description: error.message || 'Failed to start token purchase. Please try again or contact support.',
      });
    } finally {
      setLoading(false);
      setPurchasingPackageId(null);
    }
  };

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tokens') === 'success') {
      toast({
        title: 'Purchase Successful!',
        description: 'Your tokens have been added to your account.',
      });
      if (onPurchaseComplete) onPurchaseComplete();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, onPurchaseComplete]);

  const defaultTrigger = (
    <Button variant="outline">
      <Coins className="w-4 h-4 mr-2" />
      Buy Tokens
    </Button>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-luxury-gold" />
            Purchase Tokens
          </DialogTitle>
          <DialogDescription>
            Buy tokens to unlock premium features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Balance */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-luxury-gold" />
                  <span className="text-2xl font-bold">{balance}</span>
                  <span className="text-sm text-muted-foreground">tokens</span>
                </div>
              )}
            </div>
          </div>

          {/* Token Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOKEN_PACKAGES.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant="secondary" className="text-black dark:text-white">{pkg.tokens} tokens</Badge>
                  </div>
                  <CardDescription>
                    {pkg.displayPrice}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    {purchasingPackageId === pkg.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">How tokens work:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pro subscriptions grant monthly tokens automatically</li>
              <li>Tokens never expire</li>
              <li>Use tokens to purchase Concierge Matches, Spotlight Boosts, and Instant Messages</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
