import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Handshake, Megaphone, ExternalLink, Clock, Zap, UserCheck, Ban, Eye, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConciergeMatchButton } from '@/components/ConciergeMatchButton';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';
import type { AdProfile } from '@/hooks/useSwipeQueue';

interface SwipeLimitReachedFlowProps {
  adProfile: AdProfile | null;
  userId: string;
  userType: 'founder' | 'investor';
  onClose: () => void;
}

const FOUNDER_PRO_BENEFITS = [
  { icon: Zap, text: 'Initiate up to 10 chats per week' },
  { icon: UserCheck, text: 'Unlimited active conversations' },
  { icon: Ban, text: 'No ads in your feed' },
  { icon: Eye, text: 'Weekly spotlight promotion' },
];

const INVESTOR_PRO_BENEFITS = [
  { icon: Zap, text: '10 daily swipes (vs 5 for Basic)' },
  { icon: UserCheck, text: '10 active chats (vs 2 for Basic)' },
  { icon: Star, text: '"Successful Collaboration" archiving' },
  { icon: Ban, text: 'No ads in your feed' },
  { icon: Eye, text: 'Weekly spotlight promotion' },
];

type FlowPhase = 'ad' | 'upgrade';

export const SwipeLimitReachedFlow = ({ adProfile, userId, userType, onClose }: SwipeLimitReachedFlowProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<FlowPhase>(adProfile ? 'ad' : 'upgrade');
  const [adCountdown, setAdCountdown] = useState(10);
  const plan = userType === 'founder' ? SUBSCRIPTION_PLANS.startup_pro : SUBSCRIPTION_PLANS.investor_pro;

  // Ad countdown timer - 10 seconds then switch to upgrade phase
  useEffect(() => {
    if (phase !== 'ad' || !adProfile) return;

    const timer = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('upgrade');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, adProfile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md space-y-4 my-8">
        {/* Ad Phase - Show for 10 seconds */}
        {phase === 'ad' && adProfile && (
          <Card className="border-amber-500/50 bg-gradient-to-br from-background to-amber-500/5 relative overflow-hidden">
            {/* Ad Badge */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80">
                <Clock className="w-3 h-3 mr-1" />
                {adCountdown}s
              </Badge>
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                <Megaphone className="w-3 h-3 mr-1" />
                Ad
              </Badge>
            </div>

            {/* Ad Banner */}
            {(adProfile.banner_url || adProfile.image_url) && (
              <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20">
                <img 
                  src={adProfile.banner_url || adProfile.image_url || ''} 
                  alt={adProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">
                {adProfile.company_name || adProfile.firm_name || adProfile.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {adProfile.one_liner || adProfile.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Industries/Sectors */}
              {(adProfile.industry || adProfile.sectors_of_interest) && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {adProfile.industry?.map((ind: string) => (
                    <Badge key={ind} variant="secondary" className="text-xs">
                      {ind}
                    </Badge>
                  ))}
                  {adProfile.sectors_of_interest?.map((sector: string) => (
                    <Badge key={sector} variant="secondary" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              {adProfile.cta_url && (
                <a
                  href={adProfile.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {adProfile.cta_text || 'Learn More'}
                  </Button>
                </a>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Pro options will appear in {adCountdown} second{adCountdown !== 1 ? 's' : ''}...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Phase - Show after ad or immediately if no ad */}
        {phase === 'upgrade' && (
          <>
            {/* Pro Upgrade Card */}
            <Card className="border-amber-500/50 bg-gradient-to-br from-background to-amber-500/5 relative">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Daily Swipe Limit Reached</CardTitle>
                <CardDescription>
                  Upgrade to Pro for unlimited swipes and more benefits
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Benefits */}
                <div className="space-y-2 py-2">
                  {(userType === 'founder' ? FOUNDER_PRO_BENEFITS : INVESTOR_PRO_BENEFITS).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <benefit.icon className="w-4 h-4 text-amber-500" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="text-center py-2">
                  <span className="text-3xl font-bold">{plan.priceDisplay.split('/')[0]}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Actions */}
                <Button 
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            {/* Concierge Match Card */}
            <ConciergeMatchButton 
              userId={userId} 
              userType={userType} 
              variant="limit-reached"
            />

            <p className="text-xs text-center text-muted-foreground">
              Your swipes reset at midnight. Come back tomorrow or upgrade now!
            </p>

            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="w-full text-muted-foreground"
            >
              Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
