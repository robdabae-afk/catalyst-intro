-- Fix the view to use security invoker instead of security definer
-- This ensures the view respects the querying user's permissions
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id, 
  name, 
  avatar_url, 
  user_type, 
  created_at
FROM public.profiles;

-- Re-grant access
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;