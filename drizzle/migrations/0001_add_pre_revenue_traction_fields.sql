ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS waitlist_signups integer,
  ADD COLUMN IF NOT EXISTS active_users text,
  ADD COLUMN IF NOT EXISTS pilots_lois integer,
  ADD COLUMN IF NOT EXISTS product_status text,
  ADD COLUMN IF NOT EXISTS user_growth_mom text,
  ADD COLUMN IF NOT EXISTS traction_tiles text[] NOT NULL DEFAULT '{}'::text[];