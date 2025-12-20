import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Mail } from "lucide-react";

interface LegalAcceptanceNoticeProps {
  open: boolean;
  onAcknowledge: () => void;
}

const LegalAcceptanceNotice = ({ open, onAcknowledge }: LegalAcceptanceNoticeProps) => {
  const [countdown, setCountdown] = useState(5);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setCanDismiss(false);
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanDismiss(true);
    }
  }, [countdown, open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <DialogTitle>Terms & Conditions Notice</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Important notice about terms and conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
            <Mail className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="font-medium">Check Your Email</p>
              <p className="text-sm text-muted-foreground">
                A copy of our Terms and Conditions has been sent to your email upon approval.
              </p>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              By continuing to use Catalyst Intro, you acknowledge that you have received 
              and agree to our Terms and Conditions sent to your registered email address.
            </p>
            <p>
              Your continued use of the application constitutes acceptance of these terms.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={onAcknowledge} 
            disabled={!canDismiss}
            className="w-full"
          >
            {canDismiss ? "I Understand" : `Please read (${countdown}s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalAcceptanceNotice;
