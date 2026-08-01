-- Team members + headcount for the founder full profile view
ALTER TABLE public.founder_profiles
  ADD COLUMN team_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN headcount integer;
