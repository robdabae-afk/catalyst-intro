import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/demo/mode";

export async function canBrowseProfiles(userId?: string) {
  if (!userId) return false;
  const { data, error } = await supabase.rpc("is_approved", { _user_id: userId });
  return !error && data === true;
}

export function useProfileReview() {
  const [identity, setIdentity] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (active) setIdentity(s?.user.id ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => { if (active) setIdentity(data.session?.user.id ?? null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const query = useQuery({
    queryKey: ["profile-review", identity],
    enabled: !!identity && !isDemoMode(),
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const db = supabase as any;
      const [p, access, v] = await Promise.all([
        db.from("profiles").select("*").eq("id", identity).maybeSingle(),
        canBrowseProfiles(identity!),
        db.from("identity_verifications").select("status").eq("profile_id", identity).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (p.error || v.error) throw p.error || v.error;
      const table = p.data?.user_type === "investor" ? "investor_profiles" : "founder_profiles";
      const role = await db.from(table).select("*").eq("profile_id", identity).maybeSingle();
      if (role.error) throw role.error;
      return { profile: p.data, role: role.data, approved: access, verification: v.data?.status ?? "unverified" };
    },
  });
  return { ...query, identity, loading: !isDemoMode() && (identity === undefined || (!!identity && query.isPending)), approved: isDemoMode() || (!!identity && query.data?.approved === true) };
}
