-- Create referral_status enum
CREATE TYPE referral_status AS ENUM ('pending', 'approved', 'rejected');

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status referral_status NOT NULL DEFAULT 'pending',
  referred_user_type TEXT, -- 'founder' or 'investor'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referral_code),
  UNIQUE(referred_user_id)
);

-- Add referral fields to profiles
ALTER TABLE public.profiles
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES auth.users(id),
ADD COLUMN bonus_swipes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN spotlight_credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN spotlight_active_until TIMESTAMP WITH TIME ZONE;

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTRING(MD5(id::text || NOW()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after populating existing
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referrals"
ON public.referrals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Function to count approved investor referrals
CREATE OR REPLACE FUNCTION public.get_approved_investor_referral_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.referrals
  WHERE referrer_id = user_id
    AND status = 'approved'
    AND referred_user_type = 'investor';
$$;

-- Function to get active referral bonus swipes (capped at 3)
CREATE OR REPLACE FUNCTION public.get_referral_bonus_swipes(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LEAST(
    (SELECT COUNT(*)::INTEGER FROM public.referrals 
     WHERE referrer_id = user_id AND status = 'approved'),
    3
  );
$$;

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);