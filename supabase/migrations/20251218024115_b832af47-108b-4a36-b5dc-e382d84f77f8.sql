-- Add discovery filter preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS filter_stages text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS filter_industries text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS filter_locations text[] DEFAULT NULL;