-- Add legal acceptance tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN legal_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN legal_accepted_ip TEXT;