-- identity_verifications had RLS policies but no table-level grants, so every
-- insert/select from the app returned a permission error.
GRANT SELECT, INSERT ON public.identity_verifications TO authenticated;
GRANT UPDATE (status, rejection_reason, reviewed_by, reviewed_at) ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;