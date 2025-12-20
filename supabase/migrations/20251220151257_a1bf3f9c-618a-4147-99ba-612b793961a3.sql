-- Add columns for persistent legal acknowledgment and match banner dismissal
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS legal_acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS match_banner_dismissed BOOLEAN DEFAULT false;