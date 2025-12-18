-- Drop the security_invoker view (won't work with restrictive RLS)
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function to safely get public profile data
-- This is the proper way to expose limited profile data to other users
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  user_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, p.user_type::text
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Function to get multiple public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles(profile_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  user_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, p.user_type::text
  FROM public.profiles p
  WHERE p.id = ANY(profile_ids);
$$;