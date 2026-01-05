import { useState, useCallback, useMemo } from 'react';

export interface AdProfile {
  id: string;
  isAd: true;
  ad_type: 'startup' | 'investment_fund' | 'external';
  name: string;
  company_name?: string | null;
  firm_name?: string | null;
  description?: string | null;
  one_liner?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  cta_url?: string | null;
  cta_text?: string | null;
  industry?: string[] | null;
  sectors_of_interest?: string[] | null;
  stage?: string | null;
  typical_check_size?: string | null;
  portfolio_link?: string | null;
  website_url?: string | null;
}

export interface OrganicProfile {
  id: string;
  isAd?: false;
  user_type: 'founder' | 'investor';
  name: string;
  email: string;
  avatar_url?: string;
  instant_message_count?: number;
  founder_profiles?: any[] | any;
  investor_profiles?: any[] | any;
  is_verified?: boolean;
}

export type QueueItem = OrganicProfile | AdProfile;

const AD_FREQUENCY = 3; // Insert ad every 3 organic swipes

// Hardcoded test profiles for Test Mode
const hardcodedTestProfiles: OrganicProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    user_type: 'founder',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
    founder_profiles: [{
      id: '00000000-0000-0000-0000-000000000001',
      profile_id: '00000000-0000-0000-0000-000000000001',
      company_name: 'FinLeap',
      startup_name: 'FinLeap',
      one_liner: 'Revolutionizing embedded finance for platforms.',
      stage: 'seed',
      industry: ['FinTech', 'SaaS'],
      traction: '250k ARR, 15 partners'
    }]
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    user_type: 'investor',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
    investor_profiles: [{
      id: '00000000-0000-0000-0000-000000000002',
      profile_id: '00000000-0000-0000-0000-000000000002',
      firm_name: 'Apex Ventures',
      location: 'New York, NY',
      typical_check_size: '500k-2M',
      preferred_stage: 'seed',
      sectors_of_interest: ['FinTech', 'AI', 'Enterprise']
    }]
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Marcus Chen',
    email: 'marcus@solaris.io',
    user_type: 'founder',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
    founder_profiles: [{
      id: '00000000-0000-0000-0000-000000000003',
      profile_id: '00000000-0000-0000-0000-000000000003',
      company_name: 'Solaris Energy',
      startup_name: 'Solaris Energy',
      one_liner: 'Decentralized solar grid management.',
      stage: 'series-a',
      industry: ['CleanTech', 'Energy'],
      traction: 'Reached 10k homes, $2M Revenue'
    }]
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Elena Rodriguez',
    email: 'elena@pioneer.vc',
    user_type: 'investor',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop',
    investor_profiles: [{
      id: '00000000-0000-0000-0000-000000000004',
      profile_id: '00000000-0000-0000-0000-000000000004',
      firm_name: 'Pioneer Catalyst',
      location: 'San Francisco, CA',
      typical_check_size: '100k-500k',
      preferred_stage: 'pre-seed',
      sectors_of_interest: ['Consumer', 'Marketplace', 'HealthTech']
    }]
  }
];

export function useSwipeQueue(
  organicProfiles: OrganicProfile[],
  adProfiles: AdProfile[],
  isPro: boolean = false, // Pro users bypass all ads
  testMode: boolean = false // Test mode to inject hardcoded profiles
) {
  // Prepend hardcoded test profiles when in test mode
  const effectiveOrganic = testMode
    ? [...hardcodedTestProfiles, ...organicProfiles]
    : organicProfiles;

  const [organicIndex, setOrganicIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [adIndex, setAdIndex] = useState(0);

  // Build the current item to show
  const currentItem = useMemo((): QueueItem | null => {
    const hasOrganic = organicIndex < effectiveOrganic.length;
    const hasAds = adProfiles.length > 0;

    // PRO BYPASS: Pro users NEVER see ads
    if (isPro) {
      return hasOrganic ? effectiveOrganic[organicIndex] : null;
    }

    // Check if we should show an ad
    const shouldShowAd = swipeCount > 0 && swipeCount % AD_FREQUENCY === 0;

    if (shouldShowAd && hasAds) {
      // Return current ad (loop through ads)
      const loopedAdIndex = adIndex % adProfiles.length;
      return adProfiles[loopedAdIndex];
    }

    if (hasOrganic) {
      return effectiveOrganic[organicIndex];
    }

    // No organic profiles left - show ads only (loop)
    if (hasAds) {
      const loopedAdIndex = adIndex % adProfiles.length;
      return adProfiles[loopedAdIndex];
    }

    // No profiles at all
    return null;
  }, [effectiveOrganic, adProfiles, organicIndex, swipeCount, adIndex, isPro]);

  // PRO BYPASS: Pro users never see ads, so isCurrentItemAd is always false for them
  const isCurrentItemAd = !isPro && currentItem?.isAd === true;

  const handleSwipe = useCallback(() => {
    if (!currentItem) return;

    // PRO BYPASS: Pro users only advance organic profiles
    if (isPro) {
      setOrganicIndex(prev => prev + 1);
      return;
    }

    if (currentItem.isAd) {
      // Move to next ad in rotation
      setAdIndex(prev => prev + 1);
    } else {
      // Move to next organic profile
      setOrganicIndex(prev => prev + 1);
      setSwipeCount(prev => prev + 1);
    }
  }, [currentItem, isPro]);

  const resetQueue = useCallback(() => {
    setOrganicIndex(0);
    setSwipeCount(0);
    setAdIndex(0);
  }, []);

  const remainingOrganic = effectiveOrganic.length - organicIndex;
  const isQueueEmpty = !currentItem;
  const hasOnlyAds = remainingOrganic <= 0 && adProfiles.length > 0;

  return {
    currentItem,
    isCurrentItemAd,
    handleSwipe,
    resetQueue,
    remainingOrganic,
    isQueueEmpty,
    hasOnlyAds,
    totalOrganic: effectiveOrganic.length,
  };
}
