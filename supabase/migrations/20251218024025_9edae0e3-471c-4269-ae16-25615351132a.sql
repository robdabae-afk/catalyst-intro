-- Allow Pro users to create their own spotlight ad profiles
CREATE POLICY "Pro users can create their own spotlight ads"
ON public.ad_profiles
FOR INSERT
WITH CHECK (
  linked_profile_id = auth.uid()
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND subscription_status = 'active'
  )
);

-- Allow users to view their own ad profiles
CREATE POLICY "Users can view their own ad profiles"
ON public.ad_profiles
FOR SELECT
USING (linked_profile_id = auth.uid() OR created_by = auth.uid());

-- Allow users to update their own ad profiles
CREATE POLICY "Users can update their own ad profiles"
ON public.ad_profiles
FOR UPDATE
USING (linked_profile_id = auth.uid() OR created_by = auth.uid());

-- Allow users to delete their own ad profiles
CREATE POLICY "Users can delete their own ad profiles"
ON public.ad_profiles
FOR DELETE
USING (linked_profile_id = auth.uid() OR created_by = auth.uid());