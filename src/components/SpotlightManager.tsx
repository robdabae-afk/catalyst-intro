import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Clock, Megaphone, CheckCircle, AlertCircle } from 'lucide-react';
import { INDUSTRIES } from '@/lib/constants';

interface SpotlightManagerProps {
  userId: string;
  userType: 'founder' | 'investor';
}

export const SpotlightManager = ({ userId, userType }: SpotlightManagerProps) => {
  const { toast } = useToast();
  const { isPro, canUseSpotlight, loading } = useSubscription(userId);
  const [activating, setActivating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [spotlightExpiresAt, setSpotlightExpiresAt] = useState<Date | null>(null);

  // Form state for spotlight ad
  const [spotlightName, setSpotlightName] = useState('');
  const [spotlightDescription, setSpotlightDescription] = useState('');
  const [spotlightIndustry, setSpotlightIndustry] = useState<string[]>([]);
  const [spotlightCtaUrl, setSpotlightCtaUrl] = useState('');
  const [spotlightCtaText, setSpotlightCtaText] = useState('Learn More');

  const handleActivateSpotlight = async () => {
    if (!canUseSpotlight) {
      toast({
        variant: 'destructive',
        title: 'Spotlight unavailable',
        description: 'You have already used your weekly spotlight.',
      });
      return;
    }

    if (!spotlightName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a name for your spotlight.',
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

      // Create the ad profile
      const adType = userType === 'founder' ? 'startup' : 'investment_fund';
      
      const { error: adError } = await supabase.from('ad_profiles').insert({
        ad_type: adType,
        name: spotlightName,
        description: spotlightDescription || null,
        one_liner: spotlightDescription || null,
        industry: spotlightIndustry.length > 0 ? spotlightIndustry : null,
        sectors_of_interest: spotlightIndustry.length > 0 ? spotlightIndustry : null,
        cta_url: spotlightCtaUrl || null,
        cta_text: spotlightCtaText || 'Learn More',
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
      setDialogOpen(false);

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
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              You have 1 spotlight available this week
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Spotlight used. Resets in ~{timeUntilReset()}
            </span>
          </div>
        )}

        {/* Activate Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={!canUseSpotlight || spotlightActive}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {spotlightActive ? 'Spotlight Active' : canUseSpotlight ? 'Activate Spotlight' : 'Spotlight Used'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-500" />
                Create Your Spotlight
              </DialogTitle>
              <DialogDescription>
                Your profile will appear in the discover feed for 8 hours
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="spotlight-name">Display Name *</Label>
                <Input
                  id="spotlight-name"
                  value={spotlightName}
                  onChange={(e) => setSpotlightName(e.target.value)}
                  placeholder={userType === 'founder' ? 'Your startup name' : 'Your name or firm'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotlight-description">Description</Label>
                <Textarea
                  id="spotlight-description"
                  value={spotlightDescription}
                  onChange={(e) => setSpotlightDescription(e.target.value)}
                  placeholder="A brief description of what you're looking for"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Industry/Sector</Label>
                <Select
                  value={spotlightIndustry[0] || ''}
                  onValueChange={(val) => setSpotlightIndustry([val])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="spotlight-cta">CTA Button Text</Label>
                  <Input
                    id="spotlight-cta"
                    value={spotlightCtaText}
                    onChange={(e) => setSpotlightCtaText(e.target.value)}
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spotlight-url">Link URL</Label>
                  <Input
                    id="spotlight-url"
                    value={spotlightCtaUrl}
                    onChange={(e) => setSpotlightCtaUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-md">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Once activated, your spotlight will run for 8 hours and cannot be paused.
                </span>
              </div>
            </div>

            <Button
              onClick={handleActivateSpotlight}
              disabled={activating || !spotlightName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {activating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Activate 8-Hour Spotlight
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
