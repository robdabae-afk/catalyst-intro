import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Crown, Clock, Sparkles, Loader2 } from 'lucide-react';

interface ConciergeMatchButtonProps {
  userId: string;
  userType: 'founder' | 'investor';
}

export const ConciergeMatchButton = ({ userId, userType }: ConciergeMatchButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    loadPendingMatch();
  }, [userId]);

  const loadPendingMatch = async () => {
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
    }
  };

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

  // If user has a paid pending match, show the waiting state
  if (pendingMatch?.payment_status === 'paid') {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Match in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Our team is personally reviewing your profile. Your hand-picked match will appear here within 12 hours.
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

  return (
    <Button
      onClick={handleRequestMatch}
      disabled={loading}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Crown className="w-4 h-4 mr-2" />
      )}
      Request Premium Match ({price})
    </Button>
  );
};
