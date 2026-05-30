
-- Add missing profile columns referenced by code
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_access_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Backfill approved from user_roles (anyone with a role is considered approved)
UPDATE public.profiles p
SET approved = true
WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

-- Add missing founder_profiles columns
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS ein_number text,
  ADD COLUMN IF NOT EXISTS incorporation_doc_url text,
  ADD COLUMN IF NOT EXISTS financial_statement_urls text[],
  ADD COLUMN IF NOT EXISTS location text;

-- Add missing investor_profiles columns
ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS investor_type text,
  ADD COLUMN IF NOT EXISTS accreditation_status text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS investment_count integer,
  ADD COLUMN IF NOT EXISTS notable_portfolio text;

-- Create waitlist_signups table
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  user_type text NOT NULL,
  linkedin_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.waitlist_signups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
