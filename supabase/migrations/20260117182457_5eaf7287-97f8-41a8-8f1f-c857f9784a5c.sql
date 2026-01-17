-- Add missing columns for founder profile display
ALTER TABLE public.founder_profiles 
ADD COLUMN IF NOT EXISTS mrr text,
ADD COLUMN IF NOT EXISTS backed_by text;

-- Add is_featured column to profiles table for admin-controlled featured badge
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;