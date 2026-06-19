import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Poll for profile (handle_new_user trigger race on fresh signups)
      let profile: { onboarding_dismissed_at: string | null } | null = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_dismissed_at")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          profile = data;
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      const isAdmin = !!roleData;

      // No profile row at all → send to onboarding to create/recover
      if (!isAdmin && !profile) {
        navigate("/onboarding");
        return;
      }

      // First-login gamified onboarding gate
      if (!isAdmin && profile && !profile.onboarding_dismissed_at) {
        navigate("/onboarding");
        return;
      }


      setChecking(false);
    };

    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return <>{children}</>;
};
