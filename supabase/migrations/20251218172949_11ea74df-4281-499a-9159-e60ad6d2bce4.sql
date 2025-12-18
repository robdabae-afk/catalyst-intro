-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all founder profiles
CREATE POLICY "Admins can view all founder profiles" 
ON public.founder_profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all investor profiles (already has public read, but adding explicit admin)
-- No need since investor_profiles already has "Anyone can view investor profiles"