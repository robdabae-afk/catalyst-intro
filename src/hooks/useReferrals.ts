import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: 'pending' | 'approved' | 'rejected';
  referred_user_type: string | null;
  created_at: string;
  approved_at: string | null;
  referred_user?: {
    name: string;
    email: string;
  };
}

interface ReferralStats {
  totalReferrals: number;
  approvedReferrals: number;
  pendingReferrals: number;
  approvedInvestorReferrals: number;
  bonusSwipes: number;
  spotlightCredits: number;
  spotlightActiveUntil: Date | null;
}

export const useReferrals = (userId: string | null) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    approvedReferrals: 0,
    pendingReferrals: 0,
    approvedInvestorReferrals: 0,
    bonusSwipes: 0,
    spotlightCredits: 0,
    spotlightActiveUntil: null,
  });
  const [loading, setLoading] = useState(true);

  const loadReferralData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get user's referral code and spotlight info
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, bonus_swipes, spotlight_credits, spotlight_active_until')
        .eq('id', userId)
        .single();

      if (profile) {
        setReferralCode(profile.referral_code);
        setStats(prev => ({
          ...prev,
          bonusSwipes: Math.min(profile.bonus_swipes || 0, 3),
          spotlightCredits: profile.spotlight_credits || 0,
          spotlightActiveUntil: profile.spotlight_active_until 
            ? new Date(profile.spotlight_active_until) 
            : null,
        }));
      }

      // Get referrals made by this user
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (referralsData) {
        // Get referred user names
        const referredUserIds = referralsData
          .filter(r => r.referred_user_id)
          .map(r => r.referred_user_id);

        let referredProfiles: Record<string, { name: string; email: string }> = {};
        
        if (referredUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', referredUserIds);

          if (profiles) {
            referredProfiles = profiles.reduce((acc, p) => ({
              ...acc,
              [p.id]: { name: p.name, email: p.email }
            }), {});
          }
        }

        const enrichedReferrals = referralsData.map(r => ({
          ...r,
          status: r.status as 'pending' | 'approved' | 'rejected',
          referred_user: r.referred_user_id ? referredProfiles[r.referred_user_id] : undefined
        }));

        setReferrals(enrichedReferrals);

        // Calculate stats
        const approved = enrichedReferrals.filter(r => r.status === 'approved');
        const pending = enrichedReferrals.filter(r => r.status === 'pending');
        const approvedInvestors = approved.filter(r => r.referred_user_type === 'investor');

        setStats(prev => ({
          ...prev,
          totalReferrals: enrichedReferrals.length,
          approvedReferrals: approved.length,
          pendingReferrals: pending.length,
          approvedInvestorReferrals: approvedInvestors.length,
          bonusSwipes: Math.min(approved.length, 3),
        }));
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const activateSpotlight = useCallback(async () => {
    if (!userId || stats.spotlightCredits < 1) return false;

    try {
      const spotlightEnd = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const { error } = await supabase
        .from('profiles')
        .update({
          spotlight_credits: stats.spotlightCredits - 1,
          spotlight_active_until: spotlightEnd.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        spotlightCredits: prev.spotlightCredits - 1,
        spotlightActiveUntil: spotlightEnd,
      }));

      return true;
    } catch (error) {
      console.error('Error activating spotlight:', error);
      return false;
    }
  }, [userId, stats.spotlightCredits]);

  const getReferralLink = useCallback(() => {
    if (!referralCode) return '';
    return `${window.location.origin}?ref=${referralCode}`;
  }, [referralCode]);

  return {
    referralCode,
    referrals,
    stats,
    loading,
    activateSpotlight,
    getReferralLink,
    refresh: loadReferralData,
  };
};
