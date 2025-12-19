import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Crown, Clock, Sparkles, Loader2, CheckCircle, Check, UserCheck, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';

interface ConciergeMatchButtonProps {
  userId: string;
  userType: 'founder' | 'investor';
  variant?: 'default' | 'compact' | 'limit-reached';
  showBenefits?: boolean;
}

const CONCIERGE_BENEFITS = [
  { icon: UserCheck, text: 'Hand-picked match by our expert team' },
  { icon: Zap, text: 'Delivered within 8-12 hours' },
  { icon: Star, text: 'Quality over quantity - curated for you' },
];

export const ConciergeMatchButton = ({ 
  userId, 
  userType, 
  variant = 'default',
  showBenefits: showBenefitsProp = true 
}: ConciergeMatchButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(showBenefitsProp);

  const loadPendingMatch = useCallback(async () => {
    const { data } = await supabase
      .from('manual_matches')
      .select('*')
      .eq('requester_id', userId)
      .in('payment_status', ['paid', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPendingMatch(data);
      
      // If there's a pending match with stripe session, verify payment
      if (data.payment_status === 'pending' && data.stripe_session_id) {
        verifyPayment(data.id);
      }
    }
  }, [userId]);

  const verifyPayment = async (matchId: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-concierge-payment', {
        body: { matchId }
      });
      
      if (!error && data?.success && data?.status === 'paid') {
        // Payment was verified - show success notification
        toast({
          title: "Purchase Successful!",
          description: "In 8-12 hours maximum you will receive your personally curated match.",
          duration: 8000,
        });
        
        // Reload to get updated status
        loadPendingMatch();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadPendingMatch();
  }, [loadPendingMatch]);

  // Check for payment completion on focus (user returns from Stripe)
  useEffect(() => {
    const handleFocus = () => {
      if (pendingMatch?.payment_status === 'pending' && pendingMatch?.stripe_session_id) {
        verifyPayment(pendingMatch.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pendingMatch]);

  // Countdown timer for 12 hours from payment
  useEffect(() => {
    if (!pendingMatch?.payment_timestamp) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const paymentTime = new Date(pendingMatch.payment_timestamp).getTime();
      const deadline = paymentTime + 12 * 60 * 60 * 1000; // 12 hours
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('Processing...');
        return;
      }

      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / 60000);
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [pendingMatch]);

  const handleRequestMatch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-concierge-payment');
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        // Set a timeout to reload after user might return from payment
        setTimeout(() => loadPendingMatch(), 3000);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create payment session',
      });
    } finally {
      setLoading(false);
    }
  };

  const price = userType === 'founder' ? '$50' : '$25';

  // If user has a paid pending match, show the waiting state (dismissable)
  if (pendingMatch?.payment_status === 'paid') {
    if (dismissed) return null;
    
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent relative">
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2">
            <label htmlFor="dismiss-match" className="text-xs text-muted-foreground cursor-pointer">
              Dismiss
            </label>
            <Checkbox 
              id="dismiss-match"
              checked={dismissed}
              onCheckedChange={() => setDismissed(true)}
            />
          </div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Match in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Purchase successful!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            In 8-12 hours maximum you will receive your personally curated match. Our team is carefully reviewing profiles to find the perfect fit for you.
          </p>
          {timeRemaining && (
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{timeRemaining} remaining</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Limit reached variant - card style with benefits
  if (variant === 'limit-reached') {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Get a Custom Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {CONCIERGE_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <benefit.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
          <Button
            onClick={handleRequestMatch}
            disabled={loading || verifying}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            {loading || verifying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            {verifying ? 'Verifying...' : `Request Premium Match (${price})`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default variant with optional collapsible benefits
  return (
    <div className="space-y-2">
      {benefitsVisible && showBenefitsProp && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-600">Premium Match Benefits</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setBenefitsVisible(false)}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {CONCIERGE_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <benefit.icon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Button
        onClick={handleRequestMatch}
        disabled={loading || verifying}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
      >
        {loading || verifying ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Crown className="w-4 h-4 mr-2" />
        )}
        {verifying ? 'Verifying...' : `Request Premium Match (${price})`}
        {!benefitsVisible && showBenefitsProp && (
          <ChevronDown className="w-4 h-4 ml-1" onClick={(e) => { e.stopPropagation(); setBenefitsVisible(true); }} />
        )}
      </Button>
    </div>
  );
};
