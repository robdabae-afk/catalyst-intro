import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Zap, CheckCircle2, Shield, Clock, Users, Loader2 } from "lucide-react";

const EARLY_ACCESS_PRICE = 29;

const EarlyAccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("name, early_access, approved")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  // Already paid
  if (!loading && profile?.early_access) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">You're In!</h1>
          <p className="text-zinc-400">You already have early access. Your account is under review.</p>
          <Button onClick={() => navigate("/pending-approval")} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12">
            View Status
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Account required",
        description: "Please create your founder or investor profile first.",
        variant: "destructive",
      });
      navigate("/onboarding/founder");
      return;
    }

    setPaying(true);
    try {
      // Mark early_access on profile — Stripe webhook integration to be wired separately
      // For now, record intent and show confirmation (Stripe to be added in next phase)
      const { error } = await supabase
        .from("profiles")
        .update({
          early_access: true,
          early_access_paid_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Early access activated!",
        description: "Your profile is now in our priority review queue.",
      });

      navigate("/pending-approval");
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Early Access</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Get in before<br />the doors open.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Catalyst is in private development. Early access members get priority review and founding member status.
          </p>
        </div>

        {/* Price Card */}
        <div className="border border-amber-500/30 rounded-2xl bg-amber-500/5 p-6 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">${EARLY_ACCESS_PRICE}</span>
            <span className="text-zinc-500">one-time</span>
          </div>
          <p className="text-zinc-400 text-sm">Founding member fee — never charged again</p>
        </div>

        {/* What you get */}
        <div className="space-y-3">
          {[
            { icon: Shield, text: "Priority admin review — 24 to 48 hours" },
            { icon: Users, text: "Founding member status on your profile" },
            { icon: Clock, text: "Access during private development period" },
            { icon: Zap, text: "First in line when platform publicly launches" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-zinc-300 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handlePayment}
          disabled={paying}
          className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl"
        >
          {paying ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
          ) : (
            <>Get Early Access — ${EARLY_ACCESS_PRICE}</>
          )}
        </Button>

        <p className="text-center text-zinc-600 text-xs leading-relaxed">
          All accounts are subject to admin review regardless of payment.
          Refunds available if your account is not approved within 7 days.
        </p>

      </div>
    </div>
  );
};

export default EarlyAccess;
