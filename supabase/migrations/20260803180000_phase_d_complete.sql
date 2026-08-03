-- Phase D: complete data harvest + integration foundations
-- Meeting outcomes, structured funding ask, MRR snapshots, fundraising status,
-- CCPA opt-out, Google OAuth tokens, computed investor responsiveness

-- ============================================================================
-- 1. Meeting outcomes (coffee_chats)
-- ============================================================================
ALTER TABLE public.coffee_chats
  ADD COLUMN IF NOT EXISTS outcome text,          -- occurred | no_show | cancelled | rescheduled
  ADD COLUMN IF NOT EXISTS next_step text,        -- follow_up | term_sheet | passed | invested | none
  ADD COLUMN IF NOT EXISTS outcome_notes text,
  ADD COLUMN IF NOT EXISTS outcome_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS outcome_recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS coffee_chats_outcome_idx ON public.coffee_chats (outcome) WHERE outcome IS NOT NULL;

-- ============================================================================
-- 2. Structured funding ask (founder_profiles)
-- ============================================================================
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS raise_amount numeric,            -- USD numeric (nullable while legacy string exists)
  ADD COLUMN IF NOT EXISTS raise_type text,                 -- SAFE | equity | convertible_note | revenue_based
  ADD COLUMN IF NOT EXISTS target_close_date date,
  ADD COLUMN IF NOT EXISTS valuation_cap_target numeric;

-- ============================================================================
-- 3. Fundraising status (churn/failure signals)
-- ============================================================================
ALTER TABLE public.founder_profiles
  ADD COLUMN IF NOT EXISTS fundraising_status text NOT NULL DEFAULT 'actively_raising',
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_note text;
-- Values: actively_raising | paused | closed_round | shutdown | pivoted | stealth

CREATE INDEX IF NOT EXISTS founder_profiles_status_idx ON public.founder_profiles (fundraising_status);

-- ============================================================================
-- 4. MRR / vitals snapshots (time-series)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mrr_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mrr_value text,               -- snapshot of the mrr bucket ('$10k-$50k' etc)
  mrr_numeric numeric,          -- optional numeric override if founder types exact figure
  headcount integer,
  runway_months integer,
  snapshot_month date NOT NULL, -- first-of-month for the period this represents
  source text NOT NULL DEFAULT 'profile_save',  -- profile_save | manual_update | prompt_response
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (founder_id, snapshot_month, source)
);

ALTER TABLE public.mrr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders can insert own snapshots"
  ON public.mrr_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can read own snapshots"
  ON public.mrr_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = founder_id);

CREATE POLICY "Admins read all snapshots"
  ON public.mrr_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS mrr_snapshots_founder_month_idx ON public.mrr_snapshots (founder_id, snapshot_month DESC);

-- Optional metric fields on startup_updates (so founder can attach vitals to an update post)
ALTER TABLE public.startup_updates
  ADD COLUMN IF NOT EXISTS mrr_snapshot text,
  ADD COLUMN IF NOT EXISTS headcount_snapshot integer;

-- ============================================================================
-- 5. CCPA opt-out + email prefs (profiles)
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ccpa_do_not_sell boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ccpa_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS aggregated_data_consent boolean NOT NULL DEFAULT true;  -- default true since ToS covers this once updated

-- ============================================================================
-- 6. Google Calendar OAuth tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,     -- encrypted at rest by supabase vault (or plain until vault is wired)
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  google_email text,               -- the connected google account
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own tokens; edge functions use service role
CREATE POLICY "Users read own oauth tokens"
  ON public.google_oauth_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own oauth tokens"
  ON public.google_oauth_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. Computed investor responsiveness (from messages table, not self-reported)
-- ============================================================================
CREATE OR REPLACE VIEW public.v_investor_responsiveness AS
WITH first_incoming AS (
  -- For each thread (pair of user ids), find each incoming message TO an investor
  -- from a founder, and the investor's first reply timestamp after that.
  SELECT
    m.receiver_id AS investor_id,
    m.sender_id   AS founder_id,
    m.created_at  AS incoming_at,
    (
      SELECT MIN(m2.created_at)
      FROM public.messages m2
      WHERE m2.sender_id = m.receiver_id
        AND m2.receiver_id = m.sender_id
        AND m2.created_at > m.created_at
    ) AS reply_at
  FROM public.messages m
  JOIN public.profiles rp ON rp.id = m.receiver_id
  JOIN public.profiles sp ON sp.id = m.sender_id
  WHERE rp.user_type = 'investor'
    AND sp.user_type = 'founder'
    AND m.created_at > now() - interval '90 days'
),
per_thread AS (
  -- Aggregate to one row per (investor, founder) thread
  SELECT
    investor_id,
    founder_id,
    MIN(incoming_at) AS first_incoming_at,
    MIN(reply_at)    AS first_reply_at
  FROM first_incoming
  GROUP BY investor_id, founder_id
)
SELECT
  investor_id,
  COUNT(*)                                              AS total_threads,
  COUNT(*) FILTER (WHERE first_reply_at IS NOT NULL
      AND first_reply_at - first_incoming_at < interval '7 days')::numeric
    / NULLIF(COUNT(*), 0) * 100                         AS response_rate_pct,
  EXTRACT(EPOCH FROM PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY first_reply_at - first_incoming_at
  )) / 3600                                             AS median_reply_hours
FROM per_thread
GROUP BY investor_id
HAVING COUNT(*) >= 3;   -- min-sample threshold before we show computed values

GRANT SELECT ON public.v_investor_responsiveness TO authenticated;

-- Human-readable label helper
CREATE OR REPLACE FUNCTION public.responsiveness_label(hours numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN hours IS NULL     THEN NULL
    WHEN hours < 4         THEN 'Usually within hours'
    WHEN hours < 24        THEN 'Usually within a day'
    WHEN hours < 72        THEN 'Within a few days'
    WHEN hours < 168       THEN 'Within a week'
    ELSE 'Sometimes takes over a week'
  END
$$;

-- ============================================================================
-- 8. Analytics events RLS relaxation (admin can read for pulse dashboards)
-- Existing policies already cover this from Phase A/C; noop here.
-- ============================================================================

-- ============================================================================
-- 9. Fundraising status change trigger — log to analytics_events
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_fundraising_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.fundraising_status IS DISTINCT FROM OLD.fundraising_status THEN
    INSERT INTO public.analytics_events (user_id, event_type, target_id, metadata)
    VALUES (
      NEW.profile_id,
      'fundraising_status_change',
      NEW.profile_id,
      jsonb_build_object(
        'from', OLD.fundraising_status,
        'to',   NEW.fundraising_status,
        'note', NEW.status_note
      )
    );
    NEW.status_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fundraising_status_change_trg ON public.founder_profiles;
CREATE TRIGGER fundraising_status_change_trg
  BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_fundraising_status_change();
