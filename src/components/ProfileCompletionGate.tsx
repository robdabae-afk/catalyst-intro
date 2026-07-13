import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

interface ProfileCompletionGateProps {
  children: React.ReactNode;
}

export const ProfileCompletionGate = ({ children }: ProfileCompletionGateProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [graceUntil, setGraceUntil] = useState<Date | null>(null);

  useEffect(() => {
    // Don't block the settings page itself
    if (location.pathname === "/settings") {
      setChecking(false);
      return;
    }

    const checkCompletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      // Admins bypass the profile completion gate entirely
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (adminRole) {
        setChecking(false);
        return;
      }

      // Load profile and grace period
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, profile_grace_until, linkedin_url")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setChecking(false);
        return;
      }

      // Check if grace period is active
      const now = new Date();
      const graceEnd = profile.profile_grace_until ? new Date(profile.profile_grace_until) : null;
      setGraceUntil(graceEnd);

      const isGraceExpired = graceEnd ? now > graceEnd : true;

      // Check required fields based on user type
      let isComplete = false;

      if (profile.user_type === "founder") {
        const { data: founder } = await supabase
          .from("founder_profiles")
          .select("ein_number, incorporation_doc_url, financial_statement_urls, location")
          .eq("profile_id", user.id)
          .maybeSingle();

        // Check if required new fields are filled
        if (founder && profile.linkedin_url && founder.location) {
          isComplete = true; // We can make ein/docs optional, or require them based on future logic
        }
      } else {
        const { data: investor } = await supabase
          .from("investor_profiles")
          .select("investor_type, accreditation_status")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (investor && profile.linkedin_url && investor.investor_type && investor.accreditation_status) {
          isComplete = true;
        }
      }

      // Lock if grace expired and profile incomplete
      if (isGraceExpired && !isComplete) {
        setIsLocked(true);
      }

      setChecking(false);
    };

    checkCompletion();
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-6 bg-zinc-950 p-8 rounded-2xl border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Profile Incomplete</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your 7-day grace period has expired. To maintain the quality and security of our platform, we require all users to complete their profiles.
            </p>
          </div>
          
          <div className="bg-zinc-900 rounded-xl p-4 text-left space-y-3">
            <p className="text-sm font-semibold text-zinc-300">Missing Information:</p>
            <ul className="text-sm text-zinc-500 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                LinkedIn URL
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Location / Investor Type
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Due Diligence Docs (Founders)
              </li>
            </ul>
          </div>

          <Button
            onClick={() => navigate("/settings")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12"
          >
            Update Profile Now
          </Button>
        </div>
      </div>
    );
  }

  // Optional: Banner warning if in grace period
  const showBanner = graceUntil && graceUntil > new Date() && location.pathname !== "/settings";

  return (
    <>
      {showBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-3 text-sm z-50 relative">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-medium">Action Required:</span>
          <span className="text-zinc-300">
            Please complete your profile. Your access will be restricted on {graceUntil.toLocaleDateString()}.
          </span>
          <button 
            onClick={() => navigate("/settings")}
            className="underline text-amber-500 hover:text-amber-400 font-semibold ml-2"
          >
            Update now
          </button>
        </div>
      )}
      {children}
    </>
  );
};
