ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS update_image_source text NOT NULL DEFAULT 'avatar';

ALTER TABLE public.startup_updates
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS runway_snapshot integer,
  ADD COLUMN IF NOT EXISTS growth_snapshot text;