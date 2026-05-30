-- Phase 1C: Add new profile fields for enforcement

-- Shared profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Founder-specific fields
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS ein_number text,
  ADD COLUMN IF NOT EXISTS incorporation_doc_url text,
  ADD COLUMN IF NOT EXISTS financial_statement_urls text[],
  ADD COLUMN IF NOT EXISTS pitch_deck_url text,
  ADD COLUMN IF NOT EXISTS seeking text,
  ADD COLUMN IF NOT EXISTS location text;

-- Investor-specific fields
ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS investor_type text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS investment_count integer,
  ADD COLUMN IF NOT EXISTS notable_portfolio text,
  ADD COLUMN IF NOT EXISTS accreditation_status text;
