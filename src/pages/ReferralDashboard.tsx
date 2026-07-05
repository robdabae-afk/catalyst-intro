import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { 
  ArrowLeft, 
  Copy, 
  Gift, 
  Users, 
  Sparkles, 
  Check, 
  Clock, 
  XCircle,
  Zap,
  Share2
} from "lucide-react";

const ReferralDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { 
    referralCode, 
    referrals, 
    stats, 
    loading, 
    getReferralLink 
  } = useReferrals(userId);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUserId(user.id);
    };
    loadUser();
  }, [navigate]);

  const copyReferralLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    const link = getReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Catalyst',
          text: 'Connect with top investors and founders on Catalyst!',
          url: link,
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const investorMilestoneProgress = Math.min((stats.approvedInvestorReferrals / 3) * 100, 100);
  const hasEarnedSpotlight = stats.approvedInvestorReferrals >= 3;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Refer & Earn
            </h1>
            <p className="text-sm text-muted-foreground">Invite friends and unlock rewards</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Referral Link Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share your unique link to invite friends to Catalyst
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-sm truncate border border-border">
                {getReferralLink()}
              </div>
              <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button onClick={shareReferralLink} className="shrink-0">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your referral code: <span className="font-mono font-semibold text-foreground">{referralCode}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-3xl font-bold">{stats.approvedReferrals}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-3xl font-bold">+{stats.bonusSwipes}</p>
                <p className="text-sm text-muted-foreground">Bonus Swipes/Day</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-3xl font-bold">{stats.spotlightCredits}</p>
                <p className="text-sm text-muted-foreground">Spotlight Credits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investor Milestone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Investor Milestone
            </CardTitle>
            <CardDescription>
              Refer 3 investors who get approved to earn a Spotlight credit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{stats.approvedInvestorReferrals}/3 Investors</span>
              </div>
              <Progress value={investorMilestoneProgress} className="h-3" />
            </div>
            {hasEarnedSpotlight && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">
                  Congratulations! You've earned a Spotlight credit!
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rewards Info */}
        <Card>
          <CardHeader>
            <CardTitle>How Rewards Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
              <Zap className="w-10 h-10 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-semibold">+1 Daily Swipe Per Referral</h4>
                <p className="text-sm text-muted-foreground">
                  For each approved referral, you get +1 extra daily swipe (max +3). 
                  This bonus resets with your daily swipe limit.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
              <Sparkles className="w-10 h-10 text-purple-500 shrink-0" />
              <div>
                <h4 className="font-semibold">Spotlight Credit</h4>
                <p className="text-sm text-muted-foreground">
                  Refer 3 approved investors to earn a Spotlight credit. 
                  Activate it to boost your profile to the top of the stack for 1 hour!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Share your link to start earning rewards!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div>
                      <p className="font-medium">
                        {referral.referred_user?.name || 'Pending signup'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {referral.referred_user_type ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {referral.referred_user_type}
                          </Badge>
                        ) : (
                          'Invited'
                        )}
                        <span className="mx-2">•</span>
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(referral.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReferralDashboard;
