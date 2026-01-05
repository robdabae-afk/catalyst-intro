-- Add test mode columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false;