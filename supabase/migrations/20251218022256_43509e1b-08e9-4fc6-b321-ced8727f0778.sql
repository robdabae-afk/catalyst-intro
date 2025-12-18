-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weekly_spotlight_used_at timestamp with time zone DEFAULT NULL;

-- Create index for quick subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_plan IS 'investor_pro or startup_pro';
COMMENT ON COLUMN public.profiles.subscription_status IS 'active, canceled, past_due, or null';
COMMENT ON COLUMN public.profiles.weekly_spotlight_used_at IS 'Timestamp of last spotlight use, resets weekly';