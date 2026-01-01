-- Add video_url and funding_amount columns to founder_profiles table
ALTER TABLE public.founder_profiles 
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS funding_amount TEXT;

