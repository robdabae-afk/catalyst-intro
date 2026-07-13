-- Phase 1A: Add early access flags to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS early_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_access_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_grace_until timestamptz;

-- Set 7-day grace period for all currently approved users
UPDATE public.profiles
  SET profile_grace_until = now() + interval '7 days'
  WHERE approved = true;

-- Waitlist table (pre-auth signups — no Supabase account yet)
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  user_type text, -- 'founder' | 'investor'
  linkedin_url text,
  status text DEFAULT 'waiting', -- 'waiting' | 'invited' | 'converted'
  notes text
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist
CREATE POLICY "Public can insert waitlist"
  ON public.waitlist_signups FOR INSERT WITH CHECK (true);

-- Only admins can view/manage waitlist
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist_signups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update waitlist"
  ON public.waitlist_signups FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
