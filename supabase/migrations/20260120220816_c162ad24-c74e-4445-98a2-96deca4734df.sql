-- Add tokens column to profiles table for tracking user token balance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tokens integer DEFAULT 0 NOT NULL;