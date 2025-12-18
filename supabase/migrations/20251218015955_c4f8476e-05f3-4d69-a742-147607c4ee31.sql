-- Create a view for public profile data (excludes email and Stripe fields)
-- This view will be used when fetching other users' profile information
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id, 
  name, 
  avatar_url, 
  user_type, 
  created_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Now restrict the base profiles table to only own profile
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can only view their own full profile (with email and Stripe data)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);