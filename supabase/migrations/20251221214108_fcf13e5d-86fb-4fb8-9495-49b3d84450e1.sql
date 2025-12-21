-- Drop existing restrictive SELECT policies on founder_profiles
DROP POLICY IF EXISTS "Founders can view their own profile" ON public.founder_profiles;
DROP POLICY IF EXISTS "Admins can view all founder profiles" ON public.founder_profiles;

-- Create new PERMISSIVE SELECT policies (default behavior, combines with OR logic)
CREATE POLICY "Founders can view their own profile"
ON public.founder_profiles
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all founder profiles"
ON public.founder_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved users can view founder profiles for discovery"
ON public.founder_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_approved(auth.uid())
);