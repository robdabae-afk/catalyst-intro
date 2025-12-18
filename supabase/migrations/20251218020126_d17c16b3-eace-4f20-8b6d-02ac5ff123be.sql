-- Create a table to track location access grants
CREATE TABLE public.location_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id UUID NOT NULL,
  granted_to UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(founder_id, granted_to)
);

-- Enable RLS
ALTER TABLE public.location_access ENABLE ROW LEVEL SECURITY;

-- Founders can manage their own location access grants
CREATE POLICY "Founders can view their location grants"
ON public.location_access FOR SELECT
USING (auth.uid() = founder_id OR auth.uid() = granted_to);

CREATE POLICY "Founders can grant location access"
ON public.location_access FOR INSERT
WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can revoke location access"
ON public.location_access FOR UPDATE
USING (auth.uid() = founder_id);

CREATE POLICY "Founders can delete location access"
ON public.location_access FOR DELETE
USING (auth.uid() = founder_id);

-- Create a security definer function to check location access
CREATE OR REPLACE FUNCTION public.has_location_access(founder_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is the founder themselves
    SELECT 1 FROM founder_profiles fp
    WHERE fp.id = founder_profile_id AND fp.profile_id = auth.uid()
    
    UNION ALL
    
    -- User has been granted location access
    SELECT 1 FROM location_access la
    JOIN founder_profiles fp ON fp.profile_id = la.founder_id
    WHERE fp.id = founder_profile_id 
      AND la.granted_to = auth.uid()
      AND la.revoked_at IS NULL
  );
$$;

-- Create a function to get founder profile with conditional address visibility
CREATE OR REPLACE FUNCTION public.get_founder_profile_with_access(founder_profile_id uuid)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  startup_name text,
  one_liner text,
  stage text,
  industry text[],
  traction text,
  preferred_city text,
  pitch_deck_url text,
  pitch_deck_visibility text,
  banner_url text,
  company_name text,
  company_state text,
  company_address text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has access to location data
  IF has_location_access(founder_profile_id) THEN
    -- Return full data including address
    RETURN QUERY
    SELECT 
      fp.id, fp.profile_id, fp.startup_name, fp.one_liner, 
      fp.stage::text, fp.industry, fp.traction, fp.preferred_city,
      fp.pitch_deck_url, fp.pitch_deck_visibility, fp.banner_url,
      fp.company_name, fp.company_state, fp.company_address,
      fp.created_at
    FROM founder_profiles fp
    WHERE fp.id = founder_profile_id;
  ELSE
    -- Return data with address fields hidden
    RETURN QUERY
    SELECT 
      fp.id, fp.profile_id, fp.startup_name, fp.one_liner, 
      fp.stage::text, fp.industry, fp.traction, fp.preferred_city,
      fp.pitch_deck_url, fp.pitch_deck_visibility, fp.banner_url,
      fp.company_name, 
      NULL::text AS company_state, 
      NULL::text AS company_address,
      fp.created_at
    FROM founder_profiles fp
    WHERE fp.id = founder_profile_id;
  END IF;
END;
$$;

-- Update the founder_profiles SELECT policy to hide addresses from non-authorized users
-- First, drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can view founder profiles" ON public.founder_profiles;

-- Create a new policy that excludes address fields for unauthorized viewers
-- Since RLS can't filter columns, we'll use a view approach instead
-- For now, let users see founder profiles but use the function for sensitive data

-- Create a view for public founder profile data (without addresses)
CREATE OR REPLACE VIEW public.public_founder_profiles AS
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

-- Grant access to the view
GRANT SELECT ON public.public_founder_profiles TO authenticated;

-- Restrict the base table to only founders viewing their own profile
CREATE POLICY "Founders can view their own profile"
ON public.founder_profiles FOR SELECT
USING (auth.uid() = profile_id);