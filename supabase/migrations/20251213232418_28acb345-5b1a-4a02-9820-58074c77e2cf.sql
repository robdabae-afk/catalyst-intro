-- Add banner_url to founder_profiles
ALTER TABLE public.founder_profiles
ADD COLUMN banner_url text;

-- Add banner_url to investor_profiles
ALTER TABLE public.investor_profiles
ADD COLUMN banner_url text;