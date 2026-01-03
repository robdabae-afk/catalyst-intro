-- Allow anonymous users to view basic profile info for non-hidden profiles
-- This is needed for the landing page to display featured profiles
CREATE POLICY "Anonymous users can view non-hidden profiles for landing"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NULL
  AND is_hidden = false
);

-- Allow anonymous users to view founder profiles for non-hidden profiles
-- This is needed for the landing page to display featured profiles
CREATE POLICY "Anonymous users can view founder profiles for non-hidden profiles"
ON public.founder_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = founder_profiles.profile_id
    AND p.is_hidden = false
  )
);

