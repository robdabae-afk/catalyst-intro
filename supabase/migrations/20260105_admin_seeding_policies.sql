-- Allow Admins to manage profiles for seeding/testing purposes
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow Admins to manage founder profiles
CREATE POLICY "Admins can manage all founder profiles"
ON public.founder_profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow Admins to manage investor profiles
CREATE POLICY "Admins can manage all investor profiles"
ON public.investor_profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
