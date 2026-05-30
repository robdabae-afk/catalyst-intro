import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Settings, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminEditSuggestionBanner } from '@/components/AdminEditSuggestionBanner';

export default function PendingApproval() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ early_access: boolean; approved: boolean; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('early_access, approved, name')
        .eq('id', user.id)
        .single();

      setProfile(data as any);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const isPaid = profile?.early_access;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <AdminEditSuggestionBanner />

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center space-y-6">

          {/* Icon */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${isPaid ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-800'}`}>
              <Clock className={`h-12 w-12 ${isPaid ? 'text-amber-500' : 'text-zinc-400'}`} />
            </div>
          </div>

          {/* State-aware messaging */}
          {isPaid ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                <span className="text-amber-500 text-sm font-semibold uppercase tracking-wider">Early Access Received</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Under Review</h1>
              <p className="text-zinc-400 leading-relaxed">
                Your payment was received and your profile is in our priority review queue.
                Expect to hear from us within <strong className="text-white">24–48 hours</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-500 text-sm font-semibold uppercase tracking-wider">Waitlist</span>
              </div>
              <h1 className="text-2xl font-bold text-white">You're on the List</h1>
              <p className="text-zinc-400 leading-relaxed">
                Your profile has been submitted. We'll reach out when your spot opens during our private beta.
              </p>
            </div>
          )}

          {/* Early access upsell for waitlist users */}
          {!isPaid && (
            <div className="border border-amber-500/20 rounded-xl p-4 bg-amber-500/5 space-y-3 text-left">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-amber-500 text-sm font-bold">Skip the line</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Get priority review for a one-time $29 early access fee.
              </p>
              <Button
                onClick={() => navigate('/early-access')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-10"
              >
                Get Early Access — $29
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
