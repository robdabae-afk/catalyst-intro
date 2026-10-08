-- Correct PR14 even if its migration already ran. Apply after 20261008090000.
-- Intentional one-time reset: past manual approvals and ordinary 'user' roles
-- do NOT survive unless the account is an admin, an identified test, or Kat.
-- is_test_mode is a viewing preference, NOT proof that an account is a test.
CREATE OR REPLACE FUNCTION public.approval_exception(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
 SELECT EXISTS (
   SELECT 1 FROM public.profiles p WHERE p.id = _profile_id AND (
     coalesce(p.is_test_account, false)
     OR EXISTS (
       -- Never trust editable profiles.email or raw_user_meta_data for Kat/access.
       SELECT 1 FROM auth.users u WHERE u.id = p.id
         AND u.email_confirmed_at IS NOT NULL
         AND lower(btrim(u.email)) IN (
           'kat@propel.earth',
           'sarah@example.com', 'alex@example.com',
           'marcus@solaris.io', 'elena@pioneer.vc',
           'test.founder@catalyst.test', 'test.investor@catalyst.test',
           'test.founder@catalystintro.com', 'test.investor@catalystintro.com'
         )
     )
     OR (
       -- January dummy profiles can lack auth rows; require BOTH seed ID and email.
       NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
       AND (p.id, lower(btrim(p.email))) IN (
         ('00000000-0000-0000-0000-000000000001'::uuid, 'sarah@example.com'),
         ('00000000-0000-0000-0000-000000000002'::uuid, 'alex@example.com'),
         ('00000000-0000-0000-0000-000000000003'::uuid, 'marcus@solaris.io'),
         ('00000000-0000-0000-0000-000000000004'::uuid, 'elena@pioneer.vc')
       )
     )
   )
 );
$$;
REVOKE ALL ON FUNCTION public.approval_exception(uuid) FROM PUBLIC, anon, authenticated;

-- Freeze reset eligibility before changing any profile rows.
WITH eligibility AS MATERIALIZED (
 SELECT id, public.has_role(id, 'admin') OR public.approval_exception(id) AS allowed
 FROM public.profiles
)
UPDATE public.profiles p
SET approved = e.allowed,
    rejection_reason = CASE WHEN e.allowed THEN p.rejection_reason ELSE NULL END
FROM eligibility e WHERE e.id = p.id;

-- Role assignment is not an admin review. Only admin role transitions sync.
-- Admin.approveUser/denyUser/revokeAccess explicitly write profiles.approved.
CREATE OR REPLACE FUNCTION public.sync_profile_approval_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE uid uuid;
BEGIN
 IF TG_OP <> 'INSERT' AND old.role::text = 'admin' THEN
   uid := old.user_id;
   UPDATE public.profiles SET approved =
     (public.has_role(uid, 'admin') OR public.approval_exception(uid)) WHERE id = uid;
 END IF;
 IF TG_OP <> 'DELETE' AND new.role::text = 'admin' THEN
   uid := new.user_id;
   UPDATE public.profiles SET approved = true WHERE id = uid;
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.sync_profile_approval_role() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_profile_approval_role ON public.user_roles;
CREATE TRIGGER sync_profile_approval_role AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
 FOR EACH ROW EXECUTE FUNCTION public.sync_profile_approval_role();

-- Test status must not become a self-approval backdoor. Test-mode preference
-- remains editable and is deliberately absent from the exception predicate.
CREATE OR REPLACE FUNCTION public.guard_profile_approval() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
 IF auth.role() IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin') THEN
   IF TG_OP = 'INSERT' THEN
     IF new.approved OR coalesce(new.is_verified,false) OR coalesce(new.is_flagged,false)
        OR coalesce(new.is_test_account,false) THEN
       RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
     END IF;
   ELSIF new.approved IS DISTINCT FROM old.approved
      OR new.is_verified IS DISTINCT FROM old.is_verified
      OR new.is_flagged IS DISTINCT FROM old.is_flagged
      OR new.rejection_reason IS DISTINCT FROM old.rejection_reason
      OR new.is_test_account IS DISTINCT FROM old.is_test_account THEN
     RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN new;
END $$;
