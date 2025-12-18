import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X, Ban } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';

interface UpgradePromptProps {
  userType: 'founder' | 'investor';
  remainingSwipes: number;
  onClose: () => void;
}

export const UpgradePrompt = ({ userType, remainingSwipes, onClose }: UpgradePromptProps) => {
  const navigate = useNavigate();
  const plan = userType === 'founder' ? SUBSCRIPTION_PLANS.startup_pro : SUBSCRIPTION_PLANS.investor_pro;

  const isLimitReached = remainingSwipes <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border-amber-500/50 bg-gradient-to-br from-background to-amber-500/5 relative">
        {!isLimitReached && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
            {isLimitReached ? (
              <Ban className="w-8 h-8 text-white" />
            ) : (
              <Crown className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isLimitReached 
              ? "Daily Swipe Limit Reached" 
              : "You're Running Low on Swipes!"}
          </CardTitle>
          <CardDescription>
            {isLimitReached 
              ? "Upgrade to Pro for unlimited swipes and more benefits"
              : `Only ${remainingSwipes} swipe${remainingSwipes === 1 ? '' : 's'} left today. Upgrade for unlimited access!`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Benefits */}
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Unlimited swipes every day</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>No ads in your feed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Weekly spotlight promotion</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <span className="text-3xl font-bold">{plan.priceDisplay.split('/')[0]}</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/settings')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            {!isLimitReached && (
              <Button variant="ghost" onClick={onClose} className="w-full">
                Continue with free swipes
              </Button>
            )}
            {isLimitReached && (
              <p className="text-xs text-center text-muted-foreground">
                Your swipes reset at midnight. Come back tomorrow or upgrade now!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
