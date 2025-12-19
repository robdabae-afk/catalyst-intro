import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Clock, Megaphone, CheckCircle, AlertCircle } from 'lucide-react';

interface SpotlightManagerProps {
  userId: string;
  userType: 'founder' | 'investor';
}

interface ProfileData {
  name: string;
  avatar_url: string | null;
}

interface FounderProfile {
  startup_name: string;
  one_liner: string;
  industry: string[] | null;
  banner_url: string | null;
}

interface InvestorProfile {
  firm_name: string | null;
  investment_thesis: string | null;
  sectors_of_interest: string[] | null;
  banner_url: string | null;
}

export const SpotlightManager = ({ userId, userType }: SpotlightManagerProps) => {
  const { toast } = useToast();
  const { isPro, canUseSpotlight, loading } = useSubscription(userId);
  const [activating, setActivating] = useState(false);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [spotlightExpiresAt, setSpotlightExpiresAt] = useState<Date | null>(null);
  const [profileData, setProfileData] = useState<{
    base: ProfileData | null;
    founder: FounderProfile | null;
    investor: InvestorProfile | null;
  }>({ base: null, founder: null, investor: null });

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      // Load base profile
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      if (userType === 'founder') {
        const { data: founderProfile } = await supabase
          .from('founder_profiles')
          .select('startup_name, one_liner, industry, banner_url')
          .eq('profile_id', userId)
          .single();
        
        setProfileData({ 
          base: baseProfile, 
          founder: founderProfile, 
          investor: null 
        });
      } else {
        const { data: investorProfile } = await supabase
          .from('investor_profiles')
          .select('firm_name, investment_thesis, sectors_of_interest, banner_url')
          .eq('profile_id', userId)
          .single();
        
        setProfileData({ 
          base: baseProfile, 
          founder: null, 
          investor: investorProfile 
        });
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId, userType]);

  // Check for existing active spotlight
  useEffect(() => {
    const checkActiveSpotlight = async () => {
      const { data } = await supabase
        .from('ad_profiles')
        .select('spotlight_end_date')
        .eq('linked_profile_id', userId)
        .eq('is_active', true)
        .gt('spotlight_end_date', new Date().toISOString())
        .single();

      if (data?.spotlight_end_date) {
        setSpotlightActive(true);
        setSpotlightExpiresAt(new Date(data.spotlight_end_date));
      }
    };

    if (userId) {
      checkActiveSpotlight();
    }
  }, [userId]);

  const handleActivateSpotlight = async () => {
    if (!canUseSpotlight) {
      toast({
        variant: 'destructive',
        title: 'Spotlight unavailable',
        description: 'You have already used your weekly spotlight.',
      });
      return;
    }

    setActivating(true);
    try {
      // First, use the spotlight
      const { data: spotlightResult, error: spotlightError } = await supabase.functions.invoke(
        'manage-subscription',
        { body: { action: 'use_spotlight' } }
      );

      if (spotlightError) throw spotlightError;
      if (spotlightResult?.error) throw new Error(spotlightResult.error);

      const expiresAt = new Date(spotlightResult.spotlight_expires_at);

      // Create the ad profile using existing profile data
      const adType = userType === 'founder' ? 'startup' : 'investment_fund';
      
      const spotlightName = userType === 'founder' 
        ? profileData.founder?.startup_name || profileData.base?.name || 'Spotlight'
        : profileData.investor?.firm_name || profileData.base?.name || 'Spotlight';
      
      const spotlightDescription = userType === 'founder'
        ? profileData.founder?.one_liner || null
        : profileData.investor?.investment_thesis || null;

      const spotlightIndustry = userType === 'founder'
        ? profileData.founder?.industry || null
        : profileData.investor?.sectors_of_interest || null;

      const bannerUrl = userType === 'founder'
        ? profileData.founder?.banner_url
        : profileData.investor?.banner_url;

      const { error: adError } = await supabase.from('ad_profiles').insert({
        ad_type: adType,
        name: spotlightName,
        description: spotlightDescription,
        one_liner: spotlightDescription,
        industry: spotlightIndustry,
        sectors_of_interest: spotlightIndustry,
        image_url: profileData.base?.avatar_url || null,
        banner_url: bannerUrl || null,
        linked_profile_id: userId,
        created_by: userId,
        is_active: true,
        spotlight_duration: '1_day' as const,
        spotlight_start_date: new Date().toISOString(),
        spotlight_end_date: expiresAt.toISOString(),
      });

      if (adError) throw adError;

      setSpotlightActive(true);
      setSpotlightExpiresAt(expiresAt);

      toast({
        title: 'Spotlight activated!',
        description: `Your profile will be featured for 8 hours until ${expiresAt.toLocaleTimeString()}.`,
      });
    } catch (error: any) {
      console.error('Spotlight error:', error);
      toast({
        variant: 'destructive',
        title: 'Activation failed',
        description: error.message || 'Failed to activate spotlight',
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!isPro) {
    return null; // Only show for Pro users
  }

  const timeUntilReset = () => {
    // Calculate time until next spotlight (assuming weekly reset)
    const now = new Date();
    const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const days = Math.floor((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  const displayName = userType === 'founder'
    ? profileData.founder?.startup_name || profileData.base?.name
    : profileData.investor?.firm_name || profileData.base?.name;

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-500" />
            <CardTitle>Weekly Spotlight</CardTitle>
          </div>
          {spotlightActive && (
            <Badge className="bg-purple-500 hover:bg-purple-500">
              <Sparkles className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          Feature yourself in the discover feed for 8 hours. Resets weekly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spotlight Status */}
        {spotlightActive && spotlightExpiresAt ? (
          <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-md">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            <span className="text-sm">
              Spotlight active until {spotlightExpiresAt.toLocaleTimeString()}
            </span>
          </div>
        ) : canUseSpotlight ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                You have 1 spotlight available this week
              </span>
            </div>
            {displayName && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Will spotlight as:</p>
                <p className="text-sm font-medium">{displayName}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Spotlight used. Resets in ~{timeUntilReset()}
            </span>
          </div>
        )}

        {/* Info about automatic data */}
        {canUseSpotlight && !spotlightActive && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-md">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Your spotlight will automatically use your profile information. Make sure your profile is up to date!
            </span>
          </div>
        )}

        {/* Activate Button */}
        <Button
          onClick={handleActivateSpotlight}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          disabled={!canUseSpotlight || spotlightActive || activating}
        >
          {activating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Megaphone className="w-4 h-4 mr-2" />
          )}
          {spotlightActive ? 'Spotlight Active' : canUseSpotlight ? 'Activate Spotlight' : 'Spotlight Used'}
        </Button>
      </CardContent>
    </Card>
  );
};
