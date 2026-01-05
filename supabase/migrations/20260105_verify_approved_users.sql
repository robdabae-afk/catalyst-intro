-- Set all existing approved users to verified
-- This migration auto-verifies users who have the 'user' or 'admin' role

UPDATE public.profiles
SET is_verified = true
WHERE id IN (
  SELECT DISTINCT p.id 
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('user', 'admin')
);
