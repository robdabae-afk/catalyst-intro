-- Add is_verified column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing profiles to have is_verified = false if null (handled by default, but ensuring consistency)
UPDATE profiles SET is_verified = false WHERE is_verified IS NULL;
