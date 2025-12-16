-- Add Stripe Connect columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_onboarding_completed boolean DEFAULT false;

-- Create payment_status enum type
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed');

-- Add payment_status column to safes table
ALTER TABLE public.safes 
ADD COLUMN payment_status public.payment_status DEFAULT 'pending';