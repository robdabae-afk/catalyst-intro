import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Send, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ExecuteTransferProps {
  safeId: string;
  amount: number;
  investorName: string;
  founderName: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | null;
  isFounder: boolean;
  onPaymentInitiated?: () => void;
}

export const ExecuteTransfer = ({ 
  safeId, 
  amount, 
  investorName,
  founderName,
  paymentStatus,
  isFounder,
  onPaymentInitiated 
}: ExecuteTransferProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSendFunds = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'process_payment',
          safeId 
        }
      });

      if (error) throw error;

      toast({
        title: "Transfer Initiated",
        description: "The fund transfer has been initiated and is being processed."
      });

      onPaymentInitiated?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message || "Failed to process the transfer"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Funds Transferred
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5" />
              Fund Disbursement
            </CardTitle>
            <CardDescription>
              Transfer investment funds for this SAFE agreement
            </CardDescription>
          </div>
          {getStatusDisplay()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Investment Amount</span>
            <span className="text-2xl font-bold">${amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">From (Investor)</span>
            <span className="font-medium">{investorName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">To (Founder)</span>
            <span className="font-medium">{founderName}</span>
          </div>
        </div>

        {paymentStatus === 'pending' && isFounder && (
          <>
            <p className="text-sm text-muted-foreground">
              Both parties have signed the SAFE agreement. You can now initiate the fund transfer 
              from the investor to your connected bank account.
            </p>
            <Button 
              onClick={handleSendFunds} 
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Funds
                </>
              )}
            </Button>
          </>
        )}

        {paymentStatus === 'processing' && (
          <p className="text-sm text-muted-foreground text-center">
            The transfer is being processed. This typically takes 1-3 business days.
          </p>
        )}

        {paymentStatus === 'completed' && (
          <p className="text-sm text-green-600 text-center">
            Funds have been successfully transferred to the founder's account.
          </p>
        )}

        {!isFounder && paymentStatus === 'pending' && (
          <p className="text-sm text-muted-foreground text-center">
            Waiting for the founder to initiate the fund transfer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecuteTransfer;
