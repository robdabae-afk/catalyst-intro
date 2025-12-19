import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useReferrals } from '@/hooks/useReferrals';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Clock } from 'lucide-react';

interface SpotlightTriggerProps {
  userId: string;
}

export const SpotlightTrigger = ({ userId }: SpotlightTriggerProps) => {
  const { toast } = useToast();
  const { stats, activateSpotlight, refresh } = useReferrals(userId);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Calculate time remaining for active spotlight
  useEffect(() => {
    if (!stats.spotlightActiveUntil) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(stats.spotlightActiveUntil!);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        refresh();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [stats.spotlightActiveUntil, refresh]);

  const handleActivate = async () => {
    setIsActivating(true);
    const success = await activateSpotlight();
    setIsActivating(false);

    if (success) {
      toast({
        title: "Spotlight Activated!",
        description: "Your profile will be boosted for the next hour.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Activation failed",
        description: "Could not activate spotlight. Please try again.",
      });
    }
  };

  const isSpotlightActive = timeRemaining !== null;
  const canActivate = stats.spotlightCredits > 0 && !isSpotlightActive;

  return (
    <div className="space-y-3">
      {isSpotlightActive ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-purple-500/50" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-purple-300">Spotlight Active!</p>
            <p className="text-sm text-muted-foreground">Your profile is boosted to the top</p>
          </div>
          <div className="flex items-center gap-2 bg-purple-500/30 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 text-purple-300" />
            <span className="font-mono font-bold text-purple-200">{timeRemaining}</span>
          </div>
        </div>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              disabled={!canActivate}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Use Spotlight ({stats.spotlightCredits} available)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Activate Your Spotlight?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your profile will be boosted to the top of the discovery stack for the next hour. 
                This will use 1 of your {stats.spotlightCredits} spotlight credits.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleActivate}
                disabled={isActivating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isActivating ? 'Activating...' : 'Activate Now'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!canActivate && !isSpotlightActive && (
        <p className="text-sm text-muted-foreground text-center">
          Refer 3 approved investors to earn a Spotlight credit
        </p>
      )}
    </div>
  );
};
