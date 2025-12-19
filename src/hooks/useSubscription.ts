import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  isPro: boolean;
  plan: 'investor_pro' | 'startup_pro' | null;
  status: string | null;
  expiresAt: Date | null;
  canUseSpotlight: boolean;
  hasStripeSubscription: boolean;
  loading: boolean;
}

export const useSubscription = (userId: string | null): SubscriptionData => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isPro: false,
    plan: null,
    status: null,
    expiresAt: null,
    canUseSpotlight: false,
    hasStripeSubscription: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setSubscriptionData(prev => ({ ...prev, loading: false }));
      return;
    }

    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_plan, subscription_status, subscription_expires_at, weekly_spotlight_used_at, stripe_customer_id')
          .eq('id', userId)
          .single();

        if (error) throw error;

        const now = new Date();
        const expiresAt = data?.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
        const isActive = data?.subscription_status === 'active' && expiresAt && expiresAt > now;

        // Check if spotlight can be used (resets weekly)
        const spotlightUsedAt = data?.weekly_spotlight_used_at ? new Date(data.weekly_spotlight_used_at) : null;
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const canUseSpotlight = isActive && (!spotlightUsedAt || spotlightUsedAt < oneWeekAgo);

        // Check if user has a Stripe customer ID (indicates Stripe-managed subscription)
        const hasStripeSubscription = !!data?.stripe_customer_id;

        setSubscriptionData({
          isPro: isActive,
          plan: isActive ? (data?.subscription_plan as 'investor_pro' | 'startup_pro') : null,
          status: data?.subscription_status,
          expiresAt,
          canUseSpotlight,
          hasStripeSubscription,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData(prev => ({ ...prev, loading: false }));
      }
    };

    checkSubscription();

    // Subscribe to realtime updates for subscription changes
    const channel = supabase
      .channel(`subscription-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          checkSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return subscriptionData;
};

// Subscription plan details for UI
export const SUBSCRIPTION_PLANS = {
  investor_pro: {
    name: 'Investor Pro',
    price: 10000, // cents
    priceDisplay: '$100/month',
    stripePriceId: '', // Will be set after Stripe setup
  },
  startup_pro: {
    name: 'Startup Pro',
    price: 2499, // cents
    priceDisplay: '$24.99/month',
    stripePriceId: '', // Will be set after Stripe setup
  },
} as const;
