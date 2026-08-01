ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS portfolio_companies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS response_rate integer,
  ADD COLUMN IF NOT EXISTS avg_reply_time text,
  ADD COLUMN IF NOT EXISTS responsiveness_status text,
  ADD COLUMN IF NOT EXISTS deals_last_12mo integer,
  ADD COLUMN IF NOT EXISTS total_invested text,
  ADD COLUMN IF NOT EXISTS notable_exits integer;