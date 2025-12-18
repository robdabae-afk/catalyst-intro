import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Sparkles, Loader2, CalendarDays, RotateCcw } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: 'founder' | 'investor';
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  weekly_spotlight_used_at: string | null;
}

interface AdminUserSubscriptionsProps {
  user: UserProfile;
  onUpdate: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DurationOption = '1_week' | '1_month' | '3_months' | '6_months' | '1_year' | 'custom';

const DURATION_OPTIONS: { value: DurationOption; label: string; days: number }[] = [
  { value: '1_week', label: '1 Week', days: 7 },
  { value: '1_month', label: '1 Month', days: 30 },
  { value: '3_months', label: '3 Months', days: 90 },
  { value: '6_months', label: '6 Months', days: 180 },
  { value: '1_year', label: '1 Year', days: 365 },
  { value: 'custom', label: 'Custom Days', days: 0 },
];

export const AdminUserSubscriptions = ({
  user,
  onUpdate,
  open,
  onOpenChange,
}: AdminUserSubscriptionsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [proDuration, setProDuration] = useState<DurationOption>('1_month');
  const [customDays, setCustomDays] = useState('30');

  const isPro = user.subscription_status === 'active';
  const plan = user.user_type === 'founder' ? 'startup_pro' : 'investor_pro';

  const getDays = () => {
    if (proDuration === 'custom') {
      return parseInt(customDays) || 30;
    }
    return DURATION_OPTIONS.find(d => d.value === proDuration)?.days || 30;
  };

  const grantPro = async () => {
    setLoading(true);
    try {
      const days = getDays();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Pro granted',
        description: `${user.name} now has Pro access for ${days} days.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error granting Pro',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const extendPro = async () => {
    setLoading(true);
    try {
      const days = getDays();
      const currentExpiry = user.subscription_expires_at
        ? new Date(user.subscription_expires_at)
        : new Date();
      
      // If already expired, start from now
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + days);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: plan,
          subscription_expires_at: baseDate.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Pro extended',
        description: `${user.name}'s Pro access extended by ${days} days.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error extending Pro',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const revokePro = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: null,
          subscription_plan: null,
          subscription_expires_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Pro revoked',
        description: `${user.name} no longer has Pro access.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error revoking Pro',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const grantSpotlight = async () => {
    setLoading(true);
    try {
      // Reset spotlight usage so they can use it immediately
      const { error } = await supabase
        .from('profiles')
        .update({
          weekly_spotlight_used_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Spotlight granted',
        description: `${user.name} can now use their spotlight.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error granting spotlight',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const spotlightUsedRecently = user.weekly_spotlight_used_at 
    ? new Date(user.weekly_spotlight_used_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            Manage Pro status and spotlights for {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status</span>
              {isPro ? (
                <Badge className="bg-amber-500 hover:bg-amber-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              ) : (
                <Badge variant="secondary">Free</Badge>
              )}
            </div>
            {isPro && user.subscription_expires_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span>{new Date(user.subscription_expires_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Spotlight</span>
              {spotlightUsedRecently ? (
                <Badge variant="outline">Used this week</Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-600">Available</Badge>
              )}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <Label>Duration</Label>
            <Select value={proDuration} onValueChange={(v: DurationOption) => setProDuration(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {proDuration === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Number of days"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </div>

          {/* Pro Actions */}
          <div className="space-y-2">
            <Label>Pro Subscription</Label>
            <div className="flex gap-2">
              {!isPro ? (
                <Button onClick={grantPro} disabled={loading} className="flex-1">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  Grant Pro
                </Button>
              ) : (
                <>
                  <Button onClick={extendPro} disabled={loading} variant="outline" className="flex-1">
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CalendarDays className="w-4 h-4 mr-2" />
                    )}
                    Extend
                  </Button>
                  <Button onClick={revokePro} disabled={loading} variant="destructive" className="flex-1">
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    Revoke
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Spotlight Actions */}
          <div className="space-y-2">
            <Label>Spotlight</Label>
            <Button
              onClick={grantSpotlight}
              disabled={loading || !spotlightUsedRecently}
              variant="secondary"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reset Weekly Spotlight
            </Button>
            <p className="text-xs text-muted-foreground">
              {spotlightUsedRecently
                ? 'User has used their spotlight this week. Reset to allow another use.'
                : 'User already has their spotlight available.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};