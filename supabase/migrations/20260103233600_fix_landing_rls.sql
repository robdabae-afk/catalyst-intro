-- Allow all users (anonymous and authenticated) to view non-hidden profiles
-- This fixes the issue where the featured profile disappears after sign-in

DROP POLICY IF EXISTS "Anonymous users can view non-hidden profiles for landing" ON public.profiles;

CREATE POLICY "Anyone can view non-hidden profiles"
ON public.profiles
FOR SELECT
USING (
  is_hidden = false
);

DROP POLICY IF EXISTS "Anonymous users can view founder profiles for non-hidden profiles" ON public.founder_profiles;

CREATE POLICY "Anyone can view founder profiles for non-hidden profiles"
ON public.founder_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = founder_profiles.profile_id
    AND p.is_hidden = false
  )
);
