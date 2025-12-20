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
import { STRIPE_PRICES } from '@/lib/stripe-constants';
import { Sparkles, Loader2, TrendingUp, Eye, Users } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'create_spotlight_checkout' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        setDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start spotlight purchase',
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
            <div className="text-center py-2 border-t border-b border-border">
              <span className="text-2xl font-bold">{STRIPE_PRICES.SPOTLIGHT_BOOST.displayPrice}</span>
              <span className="text-muted-foreground text-sm"> for 8 hours</span>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Purchase Spotlight ({STRIPE_PRICES.SPOTLIGHT_BOOST.displayPrice})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
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
            <div className="text-center py-2 border-t border-b border-border">
              <span className="text-2xl font-bold">{STRIPE_PRICES.SPOTLIGHT_BOOST.displayPrice}</span>
              <span className="text-muted-foreground text-sm"> for 8 hours</span>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Purchase Spotlight ({STRIPE_PRICES.SPOTLIGHT_BOOST.displayPrice})
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
