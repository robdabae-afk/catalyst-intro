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
  founder_profiles?: any[];
  investor_profiles?: any[];
}

export type QueueItem = OrganicProfile | AdProfile;

const AD_FREQUENCY = 3; // Insert ad every 3 organic swipes

export function useSwipeQueue(
  organicProfiles: OrganicProfile[], 
  adProfiles: AdProfile[],
  isPro: boolean = false // Pro users bypass all ads
) {
  const [organicIndex, setOrganicIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [adIndex, setAdIndex] = useState(0);

  // Build the current item to show
  const currentItem = useMemo((): QueueItem | null => {
    const hasOrganic = organicIndex < organicProfiles.length;
    const hasAds = adProfiles.length > 0;
    
    // PRO BYPASS: Pro users NEVER see ads
    if (isPro) {
      return hasOrganic ? organicProfiles[organicIndex] : null;
    }
    
    // Check if we should show an ad
    const shouldShowAd = swipeCount > 0 && swipeCount % AD_FREQUENCY === 0;
    
    if (shouldShowAd && hasAds) {
      // Return current ad (loop through ads)
      const loopedAdIndex = adIndex % adProfiles.length;
      return adProfiles[loopedAdIndex];
    }
    
    if (hasOrganic) {
      return organicProfiles[organicIndex];
    }
    
    // No organic profiles left - show ads only (loop)
    if (hasAds) {
      const loopedAdIndex = adIndex % adProfiles.length;
      return adProfiles[loopedAdIndex];
    }
    
    // No profiles at all
    return null;
  }, [organicProfiles, adProfiles, organicIndex, swipeCount, adIndex, isPro]);

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

  const remainingOrganic = organicProfiles.length - organicIndex;
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
    totalOrganic: organicProfiles.length,
  };
}
