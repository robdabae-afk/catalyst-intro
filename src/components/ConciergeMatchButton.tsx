import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getConciergePrice } from '@/lib/stripe-constants';
import { Crown, Clock, Sparkles, Loader2, CheckCircle, Check, UserCheck, Zap, Star, ChevronDown, Tag } from 'lucide-react';

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
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [loadingDismissState, setLoadingDismissState] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const loadPendingMatch = useCallback(async () => {
    // Load both the match and the dismiss state from the profile
    const [matchResult, profileResult] = await Promise.all([
      supabase
        .from('manual_matches')
        .select('*')
        .eq('requester_id', userId)
        .in('payment_status', ['paid', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('match_banner_dismissed')
        .eq('id', userId)
        .single()
    ]);

    if (profileResult.data) {
      setDismissed(profileResult.data.match_banner_dismissed || false);
    }
    setLoadingDismissState(false);

    if (matchResult.data) {
      setPendingMatch(matchResult.data);
      
      // If there's a pending match with stripe session, verify payment
      if (matchResult.data.payment_status === 'pending' && matchResult.data.stripe_session_id) {
        verifyPayment(matchResult.data.id);
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

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'CTLYST') {
      setDiscountApplied(true);
      toast({
        title: "Discount Applied!",
        description: "$10 off your premium match",
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'The discount code is not valid',
      });
    }
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    setShowExplanationModal(false);
    try {
      const { data, error } = await supabase.functions.invoke('create-concierge-payment', {
        body: { discountCode: discountApplied ? 'CTLYST' : undefined }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
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

  const handleButtonClick = () => {
    setShowExplanationModal(true);
  };

  const conciergePrice = getConciergePrice(userType);
  const originalPrice = conciergePrice.displayPrice;
  const discountedAmount = (conciergePrice.amount - 1000) / 100;
  const displayPrice = discountApplied ? `$${discountedAmount}` : originalPrice;

  // Explanation modal - rendered as JSX, not a component
  const explanationModal = (
    <Dialog open={showExplanationModal} onOpenChange={setShowExplanationModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Premium Match Service
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Skip the swiping and let our expert team find your perfect match.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What you get:</h4>
            {CONCIERGE_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-amber-500" />
                </div>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Complete your purchase ({displayPrice})</li>
              <li>Our team reviews your profile and preferences</li>
              <li>Within 8-12 hours, you'll receive a curated match</li>
              <li>Connect with your hand-picked {userType === 'founder' ? 'investor' : 'startup'}</li>
            </ol>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={discountApplied}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleApplyDiscount}
                disabled={discountApplied || !discountCode}
              >
                {discountApplied ? <CheckCircle className="w-4 h-4 text-green-500" /> : 'Apply'}
              </Button>
            </div>
            {discountApplied && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                $10 discount applied! New price: {displayPrice}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowExplanationModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Purchase ({displayPrice})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleDismissBanner = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ match_banner_dismissed: true })
        .eq('id', userId);
      setDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
      setDismissed(true); // Still dismiss locally on error
    }
  };

  // If user has a paid pending match, show the waiting state (dismissable)
  if (pendingMatch?.payment_status === 'paid') {
    if (dismissed || loadingDismissState) return null;
    
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
              onCheckedChange={handleDismissBanner}
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
      <>
        {explanationModal}
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
              onClick={handleButtonClick}
              disabled={loading || verifying}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              {loading || verifying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {verifying ? 'Verifying...' : `Request Premium Match (${originalPrice})`}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Default variant with optional collapsible benefits
  return (
    <>
      {explanationModal}
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
          onClick={handleButtonClick}
          disabled={loading || verifying}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
        >
          {loading || verifying ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Crown className="w-4 h-4 mr-2" />
          )}
          {verifying ? 'Verifying...' : `Request Premium Match (${originalPrice})`}
          {!benefitsVisible && showBenefitsProp && (
            <ChevronDown className="w-4 h-4 ml-1" onClick={(e) => { e.stopPropagation(); setBenefitsVisible(true); }} />
          )}
        </Button>
      </div>
    </>
  );
};