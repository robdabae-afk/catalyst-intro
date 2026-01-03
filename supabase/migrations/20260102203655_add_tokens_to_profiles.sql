-- Add token balance columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tokens INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_last_granted_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing spotlight_credits to tokens (1:1 conversion)
UPDATE public.profiles
SET tokens = COALESCE(spotlight_credits, 0)
WHERE tokens = 0;

-- Create index for faster token balance queries
CREATE INDEX IF NOT EXISTS idx_profiles_tokens ON public.profiles(tokens);

