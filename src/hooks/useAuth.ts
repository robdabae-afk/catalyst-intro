import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useSubscription } from "@/hooks/useSubscription";

type ProfileRow = Tables<"profiles">;

interface UseAuthResult {
  user: ProfileRow | null;
  isPro: boolean;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const subscription = useSubscription(user?.id ?? null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authUser) {
          if (isMounted) setUser(null);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (isMounted) setUser((profile as ProfileRow) ?? null);
      } catch (e) {
        console.error("useAuth: failed to load user/profile", e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(() => {
      // Refresh profile whenever auth state changes
      load();
    });

    return () => {
      isMounted = false;
      authSub.unsubscribe();
    };
  }, []);

  return {
    user,
    isPro: subscription.isPro,
    loading: loading || subscription.loading,
  };
}
