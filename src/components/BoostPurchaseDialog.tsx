import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import { Loader2, Zap, Coins, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';

interface BoostPurchaseDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BOOST_PACKAGES = [
  { id: 'boost_1', boosts: 1, cost: 15, label: '1 Boost', savings: null },
  { id: 'boost_3', boosts: 3, cost: 30, label: '3 Boosts', savings: '50% OFF' },
];

export const BoostPurchaseDialog = ({ userId, open, onOpenChange }: BoostPurchaseDialogProps) => {
  const { toast } = useToast();
  const { balance: tokenBalance, loading: tokensLoading, refetch: refetchTokens } = useTokens(userId);
  const [boostCredits, setBoostCredits] = useState(0);
  const [spotlightActiveUntil, setSpotlightActiveUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Fetch boost credits and spotlight status
  useEffect(() => {
    if (!userId || !open) return;

    const fetchBoostData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('spotlight_credits, spotlight_active_until')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setBoostCredits(data.spotlight_credits || 0);
        if (data.spotlight_active_until) {
          const activeUntil = new Date(data.spotlight_active_until);
          if (activeUntil > new Date()) {
            setSpotlightActiveUntil(activeUntil);
          } else {
            setSpotlightActiveUntil(null);
          }
        } else {
          setSpotlightActiveUntil(null);
        }
      }
      setLoading(false);
    };

    fetchBoostData();
    refetchTokens();
  }, [userId, open, refetchTokens]);

  // Countdown timer for active boost
  useEffect(() => {
    if (!spotlightActiveUntil) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = spotlightActiveUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        setSpotlightActiveUntil(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [spotlightActiveUntil]);

  const handlePurchaseBoosts = async (packageId: string, boosts: number, cost: number) => {
    if (tokenBalance < cost) {
      setShowTokenPurchase(true);
      return;
    }

    setPurchasing(packageId);
    try {
      // Deduct tokens and add boost credits
      const { error } = await supabase
        .from('profiles')
        .update({
          tokens: tokenBalance - cost,
          spotlight_credits: boostCredits + boosts,
        })
        .eq('id', userId);

      if (error) throw error;

      setBoostCredits(prev => prev + boosts);
      refetchTokens();
      toast({
        title: 'Boosts Purchased!',
        description: `You now have ${boostCredits + boosts} boost${boostCredits + boosts !== 1 ? 's' : ''} available.`,
      });
    } catch (error: any) {
      console.error('Boost purchase error:', error);
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description: error.message || 'Could not purchase boosts.',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleActivateBoost = async () => {
    if (boostCredits <= 0) return;

    setLoading(true);
    try {
      const now = new Date();
      const spotlightEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

      // Deduct credit and set spotlight active
      const { error } = await supabase
        .from('profiles')
        .update({
          spotlight_credits: boostCredits - 1,
          spotlight_active_until: spotlightEnd.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setBoostCredits(prev => prev - 1);
      setSpotlightActiveUntil(spotlightEnd);

      toast({
        title: 'Boost Activated!',
        description: 'Your profile is now boosted for 8 hours.',
      });
    } catch (error: any) {
      console.error('Boost activation error:', error);
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error.message || 'Could not activate boost.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isBoostActive = !!spotlightActiveUntil;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-luxury-gold" />
              Profile Boost
            </DialogTitle>
            <DialogDescription>
              Boost your profile visibility for 8 hours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Token Balance</span>
                {tokensLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-luxury-gold" />
                    <span className="font-bold">{tokenBalance}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Boost Credits</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-luxury-gold" />
                  <span className="font-bold">{boostCredits}</span>
                </div>
              </div>
            </div>

            {/* Active Boost Status */}
            {isBoostActive && (
              <div className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-luxury-gold animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-luxury-gold">Boost Active!</p>
                    <p className="text-sm text-muted-foreground">
                      Expires in {timeRemaining}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activate Button (if has credits and no active boost) */}
            {!isBoostActive && boostCredits > 0 && (
              <Button
                onClick={handleActivateBoost}
                disabled={loading}
                className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Activate Boost (8 hours)
              </Button>
            )}

            {/* Purchase Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Buy Boosts with Tokens</p>
              <div className="grid grid-cols-2 gap-3">
                {BOOST_PACKAGES.map((pkg) => (
                  <Card key={pkg.id} className="relative">
                    {pkg.savings && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                        {pkg.savings}
                      </Badge>
                    )}
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Zap className="w-5 h-5 text-luxury-gold" />
                        <span className="text-lg font-bold">{pkg.boosts}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {pkg.cost} tokens
                      </p>
                      <Button
                        onClick={() => handlePurchaseBoosts(pkg.id, pkg.boosts, pkg.cost)}
                        disabled={loading || purchasing === pkg.id}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {purchasing === pkg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tokenBalance < pkg.cost ? (
                          'Buy Tokens'
                        ) : (
                          'Purchase'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p>🚀 Boosted profiles appear at the top of everyone's feed for 8 hours!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Purchase Dialog */}
      <TokenPurchaseDialog
        userId={userId}
        open={showTokenPurchase}
        onOpenChange={setShowTokenPurchase}
        onPurchaseComplete={() => {
          refetchTokens();
          setShowTokenPurchase(false);
        }}
      />
    </>
  );
};
