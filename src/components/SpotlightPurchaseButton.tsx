import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TOKEN_COSTS } from '@/lib/stripe-constants';
import { useTokens } from '@/hooks/useTokens';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';
import { Sparkles, Loader2, TrendingUp, Eye, Users, Coins } from 'lucide-react';

interface SpotlightPurchaseButtonProps {
  userId: string;
  variant?: 'default' | 'compact';
}

const SPOTLIGHT_BENEFITS = [
  { icon: TrendingUp, text: 'Boost your profile to the top of discovery' },
  { icon: Eye, text: 'Get seen by more potential matches' },
  { icon: Users, text: 'Increase your connection opportunities' },
];

export const SpotlightPurchaseButton = ({ userId, variant = 'default' }: SpotlightPurchaseButtonProps) => {
  const { toast } = useToast();
  const { balance, loading: balanceLoading } = useTokens(userId);
  const tokenCost = TOKEN_COSTS.SPOTLIGHT_BOOST;
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);

  const handlePurchase = async () => {
    // Check token balance
    if (balance < tokenCost) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Tokens',
        description: `You need ${tokenCost} tokens but only have ${balance}. Purchase more tokens to continue.`,
      });
      setShowTokenPurchase(true);
      return;
    }

    setLoading(true);
    try {
      // Deduct tokens and activate spotlight
      const { data: error } = await supabase.functions.invoke('manage-tokens', {
        body: {
          action: 'spend_tokens',
          amount: tokenCost,
          productType: 'spotlight_boost',
          description: 'Spotlight Boost - 8 hours',
        },
      });

      if (error) {
        if (error.error?.includes('Insufficient tokens')) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Tokens',
            description: error.error,
          });
          setShowTokenPurchase(true);
        } else {
          throw new Error(error.error || 'Failed to purchase spotlight');
        }
        return;
      }

      // Activate spotlight (update profile)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          spotlight_active_until: expiresAt.toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: 'Spotlight Activated!',
        description: `Your profile is now boosted for 8 hours. ${tokenCost} tokens deducted.`,
      });

      setDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to activate spotlight',
      });
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Boost
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Spotlight Your Profile
            </DialogTitle>
            <DialogDescription>
              Stand out from the crowd and get more matches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {SPOTLIGHT_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <benefit.icon className="w-4 h-4 text-purple-500" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Cost:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-purple-600" />
                  <span className="text-lg font-bold">{tokenCost} tokens</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Balance:</span>
                {balanceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-purple-600" />
                    <span className={`text-lg font-bold ${balance < tokenCost ? 'text-red-600' : 'text-green-600'}`}>
                      {balance} tokens
                    </span>
                  </div>
                )}
              </div>
              {balance < tokenCost && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-red-600">
                    Insufficient tokens. Purchase more to continue.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTokenPurchase(true)}
                    className="w-full"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Purchase Here
                  </Button>
                </div>
              )}
            </div>
            <div className="text-center py-2 border-t border-b border-border">
              <span className="text-muted-foreground text-sm">Active for 8 hours</span>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={loading || balanceLoading || balance < tokenCost}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Activate Spotlight ({tokenCost} tokens)
            </Button>
            <TokenPurchaseDialog
              userId={userId}
              open={showTokenPurchase}
              onOpenChange={setShowTokenPurchase}
              onPurchaseComplete={() => setShowTokenPurchase(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {showTokenPurchase && (
        <TokenPurchaseDialog
          userId={userId}
          onPurchaseComplete={() => setShowTokenPurchase(false)}
        />
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Boost Profile
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Spotlight Your Profile
            </DialogTitle>
            <DialogDescription>
              Stand out from the crowd and get more matches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {SPOTLIGHT_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <benefit.icon className="w-4 h-4 text-purple-500" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Cost:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-purple-600" />
                  <span className="text-lg font-bold">{tokenCost} tokens</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Balance:</span>
                {balanceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-purple-600" />
                    <span className={`text-lg font-bold ${balance < tokenCost ? 'text-red-600' : 'text-green-600'}`}>
                      {balance} tokens
                    </span>
                  </div>
                )}
              </div>
              {balance < tokenCost && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-red-600">
                    Insufficient tokens. Purchase more to continue.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTokenPurchase(true)}
                    className="w-full"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Purchase Here
                  </Button>
                </div>
              )}
            </div>
            <div className="text-center py-2 border-t border-b border-border">
              <span className="text-muted-foreground text-sm">Active for 8 hours</span>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={loading || balanceLoading || balance < tokenCost}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Activate Spotlight ({tokenCost} tokens)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TokenPurchaseDialog
        userId={userId}
        open={showTokenPurchase}
        onOpenChange={setShowTokenPurchase}
        onPurchaseComplete={() => setShowTokenPurchase(false)}
      />
    </>
  );
};
