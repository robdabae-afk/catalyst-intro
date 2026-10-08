-- Read-only admin visibility. Does not approve accounts or change ordinary-member gates.
-- Auth identity, not editable email/profile metadata, determines admin access.
CREATE OR REPLACE FUNCTION public.browse_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
 SELECT coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false);
$$;
REVOKE ALL ON FUNCTION public.browse_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.browse_is_admin() TO authenticated;

-- Existing restrictive approval boundaries already allow has_role(auth.uid(),'admin').
-- These permissive policies ensure that admin reads are also allowed on each detail table.
CREATE POLICY admin_browse_all ON public.profiles FOR SELECT TO authenticated
 USING (public.browse_is_admin());
CREATE POLICY admin_browse_all ON public.founder_profiles FOR SELECT TO authenticated
 USING (public.browse_is_admin());
CREATE POLICY admin_browse_all ON public.investor_profiles FOR SELECT TO authenticated
 USING (public.browse_is_admin());
CREATE POLICY admin_browse_all ON public.app_companies FOR SELECT TO authenticated
 USING (public.browse_is_admin());
