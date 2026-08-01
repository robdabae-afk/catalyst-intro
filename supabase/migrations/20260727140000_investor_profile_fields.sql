-- Portfolio companies, responsiveness, and portfolio stats for the investor full profile view
ALTER TABLE public.investor_profiles
  ADD COLUMN portfolio_companies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN response_rate integer,
  ADD COLUMN avg_reply_time text,
  ADD COLUMN responsiveness_status text,
  ADD COLUMN deals_last_12mo integer,
  ADD COLUMN total_invested text,
  ADD COLUMN notable_exits integer;
