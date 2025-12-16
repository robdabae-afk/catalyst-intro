-- Add investment thesis one-liner column to investor_profiles
ALTER TABLE public.investor_profiles 
ADD COLUMN investment_thesis text;