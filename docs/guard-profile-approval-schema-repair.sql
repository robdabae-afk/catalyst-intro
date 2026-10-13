-- Proposed code only. Reviewed separate prerequisite, do not replay historical migrations.
CREATE OR REPLACE FUNCTION public.guard_profile_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
 IF auth.role() IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin') THEN
   IF TG_OP = 'INSERT' THEN
     IF new.approved OR coalesce((to_jsonb(new)->>'is_verified')::boolean,false) OR coalesce(new.is_flagged,false)
        OR coalesce(new.is_test_account,false) THEN
       RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
     END IF;
   ELSIF new.approved IS DISTINCT FROM old.approved
      OR (to_jsonb(new)->>'is_verified')::boolean IS DISTINCT FROM (to_jsonb(old)->>'is_verified')::boolean
      OR new.is_flagged IS DISTINCT FROM old.is_flagged
      OR new.rejection_reason IS DISTINCT FROM old.rejection_reason
      OR new.is_test_account IS DISTINCT FROM old.is_test_account THEN
     RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN new;
END $function$
;
