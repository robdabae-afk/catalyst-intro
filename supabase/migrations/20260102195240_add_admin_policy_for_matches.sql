-- Add admin policy to view all matches
CREATE POLICY "Admins can view all matches"
ON public.matches FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update all matches
CREATE POLICY "Admins can update all matches"
ON public.matches FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

