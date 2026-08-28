import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Allow non-admin authenticated users. Defaults to false during pre-launch. */
  allowNonAdmin?: boolean;
}

export const AuthGuard = ({ children, allowNonAdmin = false }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // TEMPORARY QA BYPASS — remove after the simulated user test sweep
      const qaBypass =
        typeof window !== "undefined" &&
        window.localStorage.getItem("qa_bypass_admin_gate") === "1";

      if (!allowNonAdmin && !qaBypass) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");

        const isAdmin = !!roles && roles.length > 0;
        if (!isAdmin) {
          // Pre-launch: non-admins can only access their settings page.
          if (!location.pathname.endsWith("/settings")) {
            navigate("/settings", { replace: true });
            return;
          }
        }
      }

      setChecking(false);
    };

    check();
  }, [navigate, location.pathname, allowNonAdmin]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return <>{children}</>;
};
