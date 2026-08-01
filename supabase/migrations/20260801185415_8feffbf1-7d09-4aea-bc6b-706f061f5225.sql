ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS team_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS headcount integer;

ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS portfolio_companies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS response_rate integer,
  ADD COLUMN IF NOT EXISTS avg_reply_time text,
  ADD COLUMN IF NOT EXISTS responsiveness_status text,
  ADD COLUMN IF NOT EXISTS deals_last_12mo integer,
  ADD COLUMN IF NOT EXISTS total_invested text,
  ADD COLUMN IF NOT EXISTS notable_exits integer;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS public.startup_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.startup_updates TO authenticated;
GRANT ALL ON public.startup_updates TO service_role;

ALTER TABLE public.startup_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read startup updates"
  ON public.startup_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Founders can post their own updates"
  ON public.startup_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can delete their own updates"
  ON public.startup_updates FOR DELETE
  TO authenticated
  USING (auth.uid() = founder_id);

CREATE INDEX IF NOT EXISTS startup_updates_founder_id_idx ON public.startup_updates (founder_id, created_at DESC);