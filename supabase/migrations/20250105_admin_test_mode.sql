-- Add test mode columns to profiles table

-- 1. is_test_mode: Does the user want to see only test accounts?
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test_mode boolean DEFAULT false;

-- 2. is_test_account: Is this profile a dummy/test account?
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false;

-- 3. Mark Sarah and Alex as test accounts
-- We identify them by email since we set that in previous seeds
UPDATE public.profiles
SET is_test_account = true
WHERE email IN ('sarah@example.com', 'alex@example.com');
