-- Drop existing restrictive SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new PERMISSIVE SELECT policies (default behavior, combines with OR logic)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Approved users can view non-hidden profiles for discovery"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_approved(auth.uid()) 
  AND is_hidden = false
);