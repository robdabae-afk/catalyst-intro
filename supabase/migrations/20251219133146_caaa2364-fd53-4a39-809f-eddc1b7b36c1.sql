-- Add columns for admin edit suggestions and update tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_edit_suggestion text,
ADD COLUMN IF NOT EXISTS admin_edit_message text,
ADD COLUMN IF NOT EXISTS has_pending_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_profile_update_at timestamp with time zone;