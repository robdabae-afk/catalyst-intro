import { supabase } from "@/integrations/supabase/client";

/** Session-bound server role check. Never trust email, profile fields or local storage. */
export async function isBrowseAdmin() {
  const { data, error } = await (supabase as any).rpc("browse_is_admin");
  return !error && data === true;
}
