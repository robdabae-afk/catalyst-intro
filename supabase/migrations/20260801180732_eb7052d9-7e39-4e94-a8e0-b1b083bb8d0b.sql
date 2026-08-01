ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS team_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS headcount integer;