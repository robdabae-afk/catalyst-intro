-- Fix the view to use security invoker
DROP VIEW IF EXISTS public.public_founder_profiles;

CREATE VIEW public.public_founder_profiles 
WITH (security_invoker = true) AS
SELECT 
  id, 
  profile_id, 
  startup_name, 
  one_liner, 
  stage, 
  industry, 
  traction, 
  preferred_city, 
  pitch_deck_url, 
  pitch_deck_visibility, 
  banner_url, 
  company_name,
  created_at
FROM public.founder_profiles;

-- Re-grant access
GRANT SELECT ON public.public_founder_profiles TO authenticated;