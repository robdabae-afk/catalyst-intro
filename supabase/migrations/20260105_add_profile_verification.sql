-- Add is_verified column to profiles table
-- This allows admins to mark profiles as verified

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
