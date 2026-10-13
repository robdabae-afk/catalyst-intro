import { useState, useEffect } from 'react';
import { billingRpc, type Entitlements } from '@/lib/billing';
import { supabase } from '@/integrations/supabase/client';

// Re-export SUBSCRIPTION_PLANS from centralized constants for backward compatibility
export { SUBSCRIPTION_PLANS } from '@/lib/stripe-constants';

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
      setSubscriptionData({isPro:false,plan:null,status:null,expiresAt:null,canUseSpotlight:false,hasStripeSubscription:false,loading:false});
      return;
    }

    let canceled = false;
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
        let snapshot: Entitlements | null = null;
        try { snapshot = await billingRpc<Entitlements>('billing_snapshot'); } catch { /* pre-migration legacy fallback */ }
        const isActive = snapshot?.isPro ?? (data?.subscription_status === 'active' && !!expiresAt && expiresAt > now);

        // Check if spotlight can be used (resets weekly)
        const spotlightUsedAt = data?.weekly_spotlight_used_at ? new Date(data.weekly_spotlight_used_at) : null;
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const canUseSpotlight = isActive && (!spotlightUsedAt || spotlightUsedAt < oneWeekAgo);

        // Check if user has a Stripe customer ID (indicates Stripe-managed subscription)
        const hasStripeSubscription = snapshot?.hasStripeSubscription ?? !!data?.stripe_customer_id;

        if (canceled) return;
        setSubscriptionData({
          isPro: isActive,
          plan: isActive ? ((data?.subscription_plan as 'investor_pro' | 'startup_pro') || (snapshot?.role === 'founder' ? 'startup_pro' : 'investor_pro')) : null,
          status: isActive ? 'active' : data?.subscription_status,
          expiresAt: snapshot?.expiresAt ? new Date(snapshot.expiresAt) : expiresAt,
          canUseSpotlight,
          hasStripeSubscription,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData({isPro:false,plan:null,status:null,expiresAt:null,canUseSpotlight:false,hasStripeSubscription:false,loading:false});
      }
    };

    checkSubscription();
    const timer = window.setInterval(checkSubscription, 30000);

    // Subscribe to realtime updates for subscription changes
    const channel = supabase
      .channel(`subscription-${userId}-${Math.random().toString(36).slice(2)}`)
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
      canceled = true;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return subscriptionData;
};
