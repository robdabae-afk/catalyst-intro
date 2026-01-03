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

interface TokenPurchaseDialogProps {
  userId: string;
  trigger?: React.ReactNode;
  onPurchaseComplete?: () => void;
}

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price_cents: number;
  displayPrice: string;
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
  const [internalOpen, setInternalOpen] = useState(false);
  
  const dialogOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setDialogOpen = controlledOnOpenChange || setInternalOpen;
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    if (dialogOpen) {
      loadPackages();
    }
  }, [dialogOpen]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPackages = (data || []).map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        tokens: pkg.tokens,
        price_cents: pkg.price_cents,
        displayPrice: `$${(pkg.price_cents / 100).toFixed(2)}`,
      }));

      setPackages(formattedPackages);
    } catch (error: any) {
      console.error('Error loading token packages:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load token packages',
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-tokens', {
        body: {
          action: 'purchase_tokens',
          packageId,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start token purchase',
      });
    } finally {
      setLoading(false);
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
            <Coins className="w-5 h-5 text-amber-500" />
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
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-bold">{balance}</span>
                  <span className="text-sm text-muted-foreground">tokens</span>
                </div>
              )}
            </div>
          </div>

          {/* Token Packages */}
          {loadingPackages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No token packages available at this time.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <Badge variant="secondary">{pkg.tokens} tokens</Badge>
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
                      {loading ? (
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
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">How tokens work:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pro subscriptions grant monthly tokens automatically</li>
              <li>Tokens never expire</li>
              <li>Use tokens to purchase Concierge Matches and Spotlight Boosts</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

