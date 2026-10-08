-- Canonical approval is profiles.approved, not payment, verification, or any arbitrary role.
UPDATE public.profiles p SET approved = true
WHERE public.has_role(p.id, 'user') OR public.has_role(p.id, 'admin');

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
 SELECT public.has_role(_user_id, 'admin') OR EXISTS (
   SELECT 1 FROM public.profiles WHERE id = _user_id AND approved AND NOT is_flagged
 );
$$;

-- Definer helper avoids recursive policies on profiles; the caller cannot choose a viewer.
CREATE OR REPLACE FUNCTION public.can_view_member(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
 SELECT auth.uid() = _profile_id OR public.has_role(auth.uid(), 'admin') OR (
   auth.uid() IS NOT NULL AND public.is_approved(auth.uid()) AND EXISTS (
     SELECT 1 FROM public.profiles WHERE id = _profile_id AND approved
       AND NOT coalesce(is_hidden,false) AND NOT coalesce(is_flagged,false)
       AND NOT coalesce(is_test_account,false) AND NOT coalesce(is_test_mode,false)
   )
 );
$$;
REVOKE ALL ON FUNCTION public.can_view_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_member(uuid) TO anon, authenticated;

-- Restrictive policies intersect ALL old permissive SELECT/ALL policies.
CREATE POLICY approval_boundary ON public.profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (public.can_view_member(id));
CREATE POLICY approval_boundary ON public.founder_profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (public.can_view_member(profile_id));
CREATE POLICY approval_boundary ON public.investor_profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (public.can_view_member(profile_id));
CREATE POLICY approval_boundary ON public.app_companies AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (public.app_is_admin() OR owner_id = auth.uid() OR (
   public.is_approved(auth.uid()) AND (owner_id IS NULL OR public.can_view_member(owner_id))
 ));

-- A public teaser is an allowlist projection, never full company JSON or member contact/details.
CREATE OR REPLACE FUNCTION public.app_company_teasers()
RETURNS TABLE(id text, data jsonb, sort integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
 SELECT c.id, jsonb_build_object('name',c.data->>'name','line',c.data->>'line',
   'sector',c.data->>'sector','stage',c.data->>'stage','city',c.data->>'city'), c.sort, c.created_at
 FROM public.app_companies c WHERE c.status = 'published'
   AND (c.owner_id IS NULL OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=c.owner_id
     AND p.approved AND NOT coalesce(p.is_hidden,false) AND NOT coalesce(p.is_flagged,false)))
 ORDER BY c.sort, c.id LIMIT 12;
$$;
REVOKE ALL ON FUNCTION public.app_company_teasers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_company_teasers() TO anon, authenticated;

-- Users must not self-approve via their otherwise valid profile UPDATE/INSERT policy.
CREATE OR REPLACE FUNCTION public.guard_profile_approval() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
 IF auth.role() IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin') THEN
   IF TG_OP = 'INSERT' THEN
     IF new.approved OR coalesce(new.is_verified,false) OR coalesce(new.is_flagged,false) THEN
       RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
     END IF;
   ELSIF new.approved IS DISTINCT FROM old.approved
      OR new.is_verified IS DISTINCT FROM old.is_verified
      OR new.is_flagged IS DISTINCT FROM old.is_flagged
      OR new.rejection_reason IS DISTINCT FROM old.rejection_reason THEN
     RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER guard_profile_approval BEFORE INSERT OR UPDATE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION public.guard_profile_approval();

-- Existing admin role-grant/revoke flows remain consistent with the canonical field.
CREATE OR REPLACE FUNCTION public.sync_profile_approval_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE uid uuid;
BEGIN
 uid := CASE WHEN TG_OP='DELETE' THEN old.user_id ELSE new.user_id END;
 IF (CASE WHEN TG_OP='DELETE' THEN old.role ELSE new.role END)::text IN ('user','admin') THEN
   UPDATE public.profiles SET approved = (public.has_role(uid,'user') OR public.has_role(uid,'admin')) WHERE id=uid;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER sync_profile_approval_role AFTER INSERT OR DELETE ON public.user_roles
 FOR EACH ROW EXECUTE FUNCTION public.sync_profile_approval_role();

-- Submitting a verification is not approval. Reject forged insert status/reviewer fields.
CREATE POLICY pending_submission_only ON public.identity_verifications AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (public.has_role(auth.uid(),'admin') OR (
   status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND rejection_reason IS NULL
 ));
