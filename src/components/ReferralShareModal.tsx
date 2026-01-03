import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useReferrals } from '@/hooks/useReferrals';
import { Gift, Share2, Copy, Check, Zap, Sparkles, X } from 'lucide-react';

interface ReferralShareModalProps {
  userId: string;
  userType: 'founder' | 'investor';
  onClose: () => void;
}

export const ReferralShareModal = ({ userId, userType, onClose }: ReferralShareModalProps) => {
  const { toast } = useToast();
  const { referralCode, getReferralLink, stats } = useReferrals(userId);
  const [copied, setCopied] = useState(false);

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (!link) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Referral link not available'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ 
        title: "Referral link copied!",
        description: "Share it with your friends to earn bonus swipes."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error copying link',
        description: 'Please try again'
      });
    }
  };

  const shareReferralLink = async () => {
    const link = getReferralLink();
    if (!link) {
      copyReferralLink();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Catalyst',
          text: 'Connect with top investors and founders on Catalyst!',
          url: link,
        });
      } catch (error: any) {
        // User cancelled or error occurred, fallback to copy
        if (error.name !== 'AbortError') {
          copyReferralLink();
        }
      }
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md space-y-4 my-8">
        <Card className="border-primary/50 bg-gradient-to-br from-background to-primary/5 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Get More Swipes!</CardTitle>
            <CardDescription>
              Share your referral link and earn bonus swipes for each friend who joins
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Referral Link Section */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Referral Link</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm truncate border border-border">
                  {getReferralLink() || 'Loading...'}
                </div>
                <Button 
                  onClick={copyReferralLink} 
                  variant="outline" 
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {referralCode && (
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-mono font-semibold text-foreground">{referralCode}</span>
                </p>
              )}
            </div>

            {/* Benefits Section */}
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">How It Works</p>
              <div className="space-y-2">
                {userType === 'investor' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">+1 Daily Swipe Per Referral</p>
                      <p className="text-xs text-muted-foreground">
                        Get +1 extra daily swipe for each approved referral (max +3). 
                        Currently earning: <span className="font-semibold text-foreground">+{stats.bonusSwipes} swipes/day</span>
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Spotlight Credit</p>
                    <p className="text-xs text-muted-foreground">
                      Refer 3 approved investors to earn a Spotlight credit. 
                      Boost your profile to the top for 1 hour!
                      {stats.approvedInvestorReferrals > 0 && (
                        <span className="block mt-1 font-semibold text-foreground">
                          Progress: {stats.approvedInvestorReferrals}/3 investors
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={shareReferralLink}
                className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Referral Link
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

