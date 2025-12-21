-- Add is_hidden column to profiles table for admin to hide profiles from discovery
ALTER TABLE public.profiles ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Add hidden_at timestamp to track when profile was hidden
ALTER TABLE public.profiles ADD COLUMN hidden_at timestamp with time zone;

-- Add hidden_by to track which admin hid the profile
ALTER TABLE public.profiles ADD COLUMN hidden_by uuid;

-- Allow admins to update is_hidden field
CREATE POLICY "Admins can update profile visibility"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));