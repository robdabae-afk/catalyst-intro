-- 1. Investors must be able to create intro requests; grants were missing entirely.
GRANT SELECT, INSERT, UPDATE ON public.intro_requests TO authenticated;
GRANT ALL ON public.intro_requests TO service_role;

DROP POLICY IF EXISTS "Founders create their own intro requests" ON public.intro_requests;
CREATE POLICY "Participants create intro requests"
ON public.intro_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = investor_id OR auth.uid() = founder_id);

-- 2. Cap table page queries public.funding_rounds, which never existed.
CREATE TABLE IF NOT EXISTS public.funding_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  round_type text NOT NULL,
  amount numeric,
  valuation numeric,
  date date,
  investors text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_rounds TO authenticated;
GRANT ALL ON public.funding_rounds TO service_role;

ALTER TABLE public.funding_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders manage their own funding rounds"
ON public.funding_rounds
FOR ALL
TO authenticated
USING (auth.uid() = founder_id)
WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Admins read all funding rounds"
ON public.funding_rounds
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS funding_rounds_founder_idx ON public.funding_rounds (founder_id, date DESC);