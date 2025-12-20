import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  ArrowLeftRight, 
  Bell, 
  Handshake, 
  Crown, 
  MessageSquare, 
  Eye, 
  Zap, 
  Archive, 
  Users, 
  Gift,
  Clock
} from 'lucide-react';

interface WelcomeBillboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'founder' | 'investor';
}

export const WelcomeBillboard = ({ isOpen, onClose, userId, userType }: WelcomeBillboardProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (countdown === 0 || hasScrolledToBottom) {
      setCanDismiss(true);
    }
  }, [countdown, hasScrolledToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleDismiss = async () => {
    if (!canDismiss) return;
    
    await supabase
      .from('profiles')
      .update({ has_seen_welcome: true })
      .eq('id', userId);
    
    onClose();
  };

  const handleViewProPlans = async () => {
    await supabase
      .from('profiles')
      .update({ has_seen_welcome: true })
      .eq('id', userId);
    
    onClose();
    navigate('/settings');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Welcome to Catalyst</h2>
          </div>
          <p className="text-primary-foreground/90 text-lg">You're Approved! 🎉</p>
        </div>

        {/* Scrollable Content */}
        <ScrollArea 
          className="max-h-[50vh] px-6 py-4"
          onScrollCapture={handleScroll}
          ref={scrollRef}
        >
          <div className="space-y-6">
            {/* Section 1: How to Use */}
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="bg-primary/10 p-2 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </span>
                How to Use Catalyst
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <ArrowLeftRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Swipe</p>
                    <p className="text-sm text-muted-foreground">
                      Swipe right to express interest, left to pass. It's that simple!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Matches</p>
                    <p className="text-sm text-muted-foreground">
                      You'll be notified when a match is made—check the Matches tab regularly!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20">
                  <Handshake className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-700">
                      {userType === 'founder' 
                        ? 'Concierge Match - Guaranteed Investor Connection'
                        : 'Concierge Match - Guaranteed Founder Connection'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userType === 'founder' 
                        ? 'For $25, our team will hand-select and personally introduce you to the perfect investor within 12 hours.'
                        : 'For $50, our team will hand-select and personally introduce you to the perfect founder within 12 hours.'}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-amber-500/20 text-amber-700">
                      Premium Service
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 2: Pro Perks */}
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </span>
                Unlock Pro Perks
              </h3>
              
              {userType === 'founder' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Initiate 10 Chats Per Week</p>
                      <p className="text-sm text-muted-foreground">
                        Don't wait for investors—reach out first to up to 10 matches every week.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Privacy Protection</p>
                      <p className="text-sm text-muted-foreground">
                        Your last name and website stay hidden until the investor replies—stay in control.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Unlimited Active Chats</p>
                      <p className="text-sm text-muted-foreground">
                        Keep as many conversations going as you need—no limits.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">10 Daily Swipes</p>
                      <p className="text-sm text-muted-foreground">
                        Double your daily discovery—see more high-quality founders every day.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">10 Active Conversations</p>
                      <p className="text-sm text-muted-foreground">
                        Engage with more founders simultaneously—build your pipeline faster.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <Archive className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Successful Collaboration Archive</p>
                      <p className="text-sm text-muted-foreground">
                        Mark deals as successful to free up chat slots without losing the connection.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Section 3: Referral Program */}
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="bg-green-500/10 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </span>
                Referral Rewards
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <Gift className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-green-700">Earn +1 Swipe Per Day</p>
                    <p className="text-sm text-muted-foreground">
                      For every friend you refer who gets approved, earn +1 daily swipe (up to 3 extra per day).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-purple-700">1-Hour Spotlight Boost</p>
                    <p className="text-sm text-muted-foreground">
                      Refer 3 investors who get approved and unlock a free 1-hour Spotlight—get featured at the top of the stack!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="text-center text-xs text-muted-foreground py-2">
              ↓ Scroll to read all instructions ↓
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {!canDismiss && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Please read the instructions ({countdown}s)
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={!canDismiss}
                className="min-w-[120px]"
              >
                {canDismiss ? 'Start Swiping' : `Wait ${countdown}s`}
              </Button>
              
              <Button
                onClick={handleViewProPlans}
                className="min-w-[120px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                See Pro Plans
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
