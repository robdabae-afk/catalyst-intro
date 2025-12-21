-- Fix PUBLIC_DATA_EXPOSURE: investor_profiles table is publicly accessible
-- Drop the overly permissive policy that allows anyone to view all investor profiles
DROP POLICY IF EXISTS "Anyone can view investor profiles" ON public.investor_profiles;

-- Create a new policy that requires authentication and proper relationship
-- This allows authenticated founders to see investor profiles for the discovery/matching flow
CREATE POLICY "Authenticated approved users can view investor profiles for discovery"
ON public.investor_profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User viewing their own investor profile
    auth.uid() = profile_id OR
    -- Approved users can see investor profiles for discovery (founders need to see investors to swipe)
    is_approved(auth.uid())
  )
);

-- Ensure admins can still view all investor profiles (policy already exists, but add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'investor_profiles' 
    AND policyname = 'Admins can view all investor profiles'
  ) THEN
    CREATE POLICY "Admins can view all investor profiles"
    ON public.investor_profiles FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;