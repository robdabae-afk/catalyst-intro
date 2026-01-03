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
import { getConciergeTokenCost } from '@/lib/stripe-constants';
import { useTokens } from '@/hooks/useTokens';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';
import { Crown, Clock, Sparkles, Loader2, CheckCircle, Check, UserCheck, Zap, Star, ChevronDown, Tag, Coins } from 'lucide-react';

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
  const { balance, loading: balanceLoading } = useTokens(userId);
  const tokenCost = getConciergeTokenCost(userType);
  const [loading, setLoading] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(showBenefitsProp);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [loadingDismissState, setLoadingDismissState] = useState(true);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);

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

  const handleProceedToPayment = async () => {
    setLoading(true);
    setShowExplanationModal(false);
    
    // Check token balance
    if (balance < tokenCost) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Tokens',
        description: `You need ${tokenCost} tokens but only have ${balance}. Purchase more tokens to continue.`,
      });
      setShowTokenPurchase(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-concierge-payment', {});
      
      if (error) {
        if (error.message?.includes('Insufficient tokens')) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Tokens',
            description: error.message,
          });
          setShowTokenPurchase(true);
        } else {
          throw error;
        }
        return;
      }
      
      if (data?.success) {
        toast({
          title: "Purchase Successful!",
          description: `In 8-12 hours maximum you will receive your personally curated match. ${tokenCost} tokens deducted.`,
          duration: 8000,
        });
        loadPendingMatch();
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to complete purchase',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    setShowExplanationModal(true);
  };

  // Explanation modal - rendered as JSX, not a component
  const explanationModal = (
    <>
      {showTokenPurchase && (
        <TokenPurchaseDialog
          userId={userId}
          onPurchaseComplete={() => {
            setShowTokenPurchase(false);
            // Reload balance will happen automatically via useTokens hook
          }}
        />
      )}
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
              <li>Spend {tokenCost} tokens to request a match</li>
              <li>Our team reviews your profile and preferences</li>
              <li>Within 8-12 hours, you'll receive a curated match</li>
              <li>Connect with your hand-picked {userType === 'founder' ? 'investor' : 'startup'}</li>
            </ol>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Cost:</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-lg font-bold">{tokenCost} tokens</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Balance:</span>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className={`text-lg font-bold ${balance < tokenCost ? 'text-red-600' : 'text-green-600'}`}>
                    {balance} tokens
                  </span>
                </div>
              )}
            </div>
            {balance < tokenCost && (
              <p className="text-xs text-red-600 mt-2">
                Insufficient tokens. Purchase more to continue.
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
              disabled={loading || balanceLoading || balance < tokenCost}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Coins className="w-4 h-4 mr-2" />
              )}
              Purchase ({tokenCost} tokens)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
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
              {verifying ? 'Verifying...' : `Request Premium Match (${tokenCost} tokens)`}
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
          {verifying ? 'Verifying...' : `Request Premium Match (${tokenCost} tokens)`}
          {!benefitsVisible && showBenefitsProp && (
            <ChevronDown className="w-4 h-4 ml-1" onClick={(e) => { e.stopPropagation(); setBenefitsVisible(true); }} />
          )}
        </Button>
      </div>
    </>
  );
};