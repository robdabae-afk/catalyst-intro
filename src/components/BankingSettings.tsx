import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle, Loader2, ExternalLink } from "lucide-react";

interface BankingSettingsProps {
  userId: string;
}

export const BankingSettings = ({ userId }: BankingSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    checkStripeStatus();
  }, [userId]);

  const checkStripeStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setStripeAccountId(data?.stripe_account_id || null);
      setOnboardingCompleted(data?.stripe_onboarding_completed || false);
    } catch (error: any) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnectBankAccount = async () => {
    setLoading(true);
    try {
      // Call the stripe-connect edge function to get onboarding URL
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'create_account',
          userId 
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to initiate bank account connection"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'create_login_link',
          userId 
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to open account dashboard"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Banking & Payments
            </CardTitle>
            <CardDescription>
              Connect your bank account to receive and send funds
            </CardDescription>
          </div>
          {onboardingCompleted && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stripeAccountId ? (
          <>
            <p className="text-sm text-muted-foreground">
              To send or receive investment funds through SAFE agreements, you need to connect a bank account. 
              This is securely handled through Stripe.
            </p>
            <Button 
              onClick={handleConnectBankAccount} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Connect Bank Account
                </>
              )}
            </Button>
          </>
        ) : onboardingCompleted ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your bank account is connected and verified. You can now send and receive funds.
            </p>
            <Button 
              variant="outline" 
              onClick={handleManageAccount}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Account
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Your account setup is incomplete. Please complete the onboarding process to enable payments.
            </p>
            <Button 
              onClick={handleConnectBankAccount} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BankingSettings;
