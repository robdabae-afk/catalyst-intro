import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Crown, Sparkles, Ban, Zap, Eye } from 'lucide-react';
import { getProPrice } from '@/lib/stripe-constants';

interface GetProButtonProps {
  userType: 'founder' | 'investor';
  variant?: 'menu' | 'button';
  className?: string;
}

const PRO_BENEFITS = [
  { icon: Zap, text: 'Unlimited swipes every day' },
  { icon: Ban, text: 'No ads in your feed' },
  { icon: Eye, text: 'Weekly spotlight promotion' },
  { icon: Sparkles, text: 'Priority in discovery queue' },
];

export const GetProButton = ({ userType, variant = 'button', className }: GetProButtonProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const plan = getProPrice(userType);

  const handleUpgrade = () => {
    setDialogOpen(false);
    navigate('/settings');
  };

  if (variant === 'menu') {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${className}`}>
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-medium">
              Get Pro
            </span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription>
              Unlock the full potential of your matching experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {PRO_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <benefit.icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
            <div className="text-center py-2 border-t border-b border-border">
              <span className="text-3xl font-bold">{plan.displayPrice.split('/')[0]}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className={`bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 ${className}`}>
          <Crown className="w-4 h-4 mr-2" />
          Get Pro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Unlock the full potential of your matching experience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {PRO_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <benefit.icon className="w-4 h-4 text-amber-500" />
                </div>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
          <div className="text-center py-2 border-t border-b border-border">
            <span className="text-3xl font-bold">{plan.displayPrice.split('/')[0]}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
