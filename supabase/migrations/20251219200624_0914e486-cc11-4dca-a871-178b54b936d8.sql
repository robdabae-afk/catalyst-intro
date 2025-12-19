-- Create payment_status enum for manual matches
CREATE TYPE manual_match_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled');

-- Create manual_matches table for concierge match feature
CREATE TABLE public.manual_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_status manual_match_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER, -- in cents
  user_type TEXT NOT NULL, -- 'founder' or 'investor' for pricing
  payment_timestamp TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own manual match requests"
ON public.manual_matches FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create their own manual match requests"
ON public.manual_matches FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admins can view all manual matches"
ON public.manual_matches FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update manual matches"
ON public.manual_matches FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_manual_matches_requester ON public.manual_matches(requester_id);
CREATE INDEX idx_manual_matches_status ON public.manual_matches(payment_status);

-- Add trigger for updated_at
CREATE TRIGGER update_manual_matches_updated_at
BEFORE UPDATE ON public.manual_matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();