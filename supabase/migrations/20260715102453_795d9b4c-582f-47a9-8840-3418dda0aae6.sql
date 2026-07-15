DROP POLICY IF EXISTS "Approved users can view non-hidden profiles for discovery" ON public.profiles;
DROP POLICY IF EXISTS "Discovery profiles must be visible" ON public.profiles;

CREATE POLICY "Approved users can view profiles for discovery"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
);

CREATE POLICY "Discovery profiles must be visible"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR is_hidden = false
);