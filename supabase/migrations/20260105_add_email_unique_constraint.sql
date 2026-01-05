-- Add UNIQUE constraint to email column in profiles table
-- This allows future ON CONFLICT (email) DO UPDATE operations

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);
