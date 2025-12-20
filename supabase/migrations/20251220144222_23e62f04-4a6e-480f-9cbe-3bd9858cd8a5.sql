-- Add has_seen_welcome column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_welcome boolean NOT NULL DEFAULT false;