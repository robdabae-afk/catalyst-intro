import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { getProPrice, getProMonthlyTokens } from '@/lib/stripe-constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, Loader2, Check, Sparkles, Ban, ExternalLink, Coins } from 'lucide-react';

interface SubscriptionSettingsProps {
  userId: string;
  userType: 'founder' | 'investor';
}

export const SubscriptionSettings = ({ userId, userType }: SubscriptionSettingsProps) => {
  const { toast } = useToast();
  const { isPro, plan, status, expiresAt, hasStripeSubscription, loading } = useSubscription(userId);
  const [processing, setProcessing] = useState(false);

  const targetPlan = userType === 'founder' ? 'startup_pro' : 'investor_pro';
  const planDetails = getProPrice(userType);

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: 'destructive', title: 'Please sign in to subscribe' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'create_checkout',
          plan: targetPlan,
        },
      });

      if (error) throw error;

      if (data?.error?.includes('not configured')) {
        toast({
          variant: 'destructive',
          title: 'Stripe not configured',
          description: 'Payment processing is not yet available. Please try again later.',
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        variant: 'destructive',
        title: 'Subscription error',
        description: error.message || 'Failed to start checkout',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'create_portal' },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to open billing portal',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const benefits = [
    'No ad profiles in your swipe feed',
    'No 3-second delay on ads',
    '1 weekly spotlight (8 hours) to promote yourself',
    'Priority visibility to matches',
  ];

  return (
    <Card className={isPro ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${isPro ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <CardTitle>{planDetails.name}</CardTitle>
          </div>
          {isPro && (
            <Badge className="bg-amber-500 hover:bg-amber-500">
              <Sparkles className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          {isPro
            ? `Your subscription is active until ${expiresAt?.toLocaleDateString()}`
            : 'Upgrade to Pro for an ad-free experience and weekly spotlight'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits List */}
        <div className="space-y-2">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className={`w-4 h-4 ${isPro ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className={isPro ? 'text-foreground' : 'text-muted-foreground'}>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Monthly Token Grant Info */}
        {isPro && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Coins className="w-4 h-4 text-amber-600" />
              Monthly Token Grant
            </div>
            <p className="text-sm text-muted-foreground">
              You receive <span className="font-semibold text-foreground">{getProMonthlyTokens(userType)} tokens</span> every month with your Pro subscription.
            </p>
            <p className="text-xs text-muted-foreground">
              Tokens are automatically added to your account on your subscription renewal date.
            </p>
          </div>
        )}

        {/* Pricing */}
        {!isPro && (
          <div className="flex items-baseline gap-1 py-2">
            <span className="text-3xl font-bold">{planDetails.displayPrice.split('/')[0]}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        )}

        {/* Status for past_due */}
        {status === 'past_due' && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <Ban className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              Payment failed. Please update your payment method.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isPro ? (
            hasStripeSubscription ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Your subscription was assigned by an administrator. Contact support for billing inquiries.
              </p>
            )
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Upgrade to Pro
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
