-- Phase C: Investor pipeline stage tagging + founder self-analytics RLS

-- 1. Pipeline stage on matches (investor-side CRM signal)
ALTER TABLE public.matches
  ADD COLUMN investor_stage text;
-- Allowed values enforced at app layer: screening | diligence | partner_meeting | term_sheet | passed

-- 2. Allow founders to read analytics_events targeting their own profile
--    (profile views, deck opens — aggregate for self-analytics, not individual viewer identities)
CREATE POLICY "Founders can read events targeting their profile"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (target_id = auth.uid());

-- 3. Allow users to read swipes on their own profile
--    (counts only — UI never surfaces who specifically swiped)
CREATE POLICY "Users can read swipes on their profile"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (swiped_id = auth.uid());

-- 4. SECURITY DEFINER RPC for cohort comparison
--    Bypasses per-user RLS to compute anonymized aggregate stats across a founder's cohort.
CREATE OR REPLACE FUNCTION public.get_founder_cohort_stats(
  p_stage    text,
  p_industries text[],
  p_exclude_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH cohort AS (
    SELECT fp.profile_id
    FROM   founder_profiles fp
    JOIN   profiles p ON p.id = fp.profile_id
    WHERE  fp.stage::text = p_stage
      AND  fp.industry && p_industries
      AND  fp.profile_id <> p_exclude_id
      AND  p.is_hidden  = false
      AND  COALESCE(p.is_test_mode, false) = false
  ),
  like_rates AS (
    SELECT
      s.swiped_id,
      ROUND(
        COUNT(*) FILTER (WHERE s.action IN ('like','superlike'))::numeric
        / NULLIF(COUNT(*), 0) * 100, 1
      ) AS like_rate
    FROM   swipes s
    WHERE  s.swiped_id IN (SELECT profile_id FROM cohort)
    GROUP  BY s.swiped_id
    HAVING COUNT(*) >= 5
  ),
  view_counts AS (
    SELECT target_id,
           COUNT(*) FILTER (WHERE event_type = 'profile_view') AS views,
           COUNT(*) FILTER (WHERE event_type = 'deck_open')    AS deck_opens
    FROM   analytics_events
    WHERE  target_id IN (SELECT profile_id FROM cohort)
      AND  event_type IN ('profile_view','deck_open')
    GROUP  BY target_id
  ),
  deck_rates AS (
    SELECT
      target_id,
      ROUND(
        deck_opens::numeric / NULLIF(views, 0) * 100, 1
      ) AS deck_rate
    FROM view_counts
    WHERE views >= 3
  )
  SELECT jsonb_build_object(
    'cohort_size',       (SELECT COUNT(*) FROM cohort),
    'median_like_rate',  (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY like_rate) FROM like_rates),
    'median_views',      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY views)::integer FROM view_counts),
    'median_deck_rate',  (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deck_rate) FROM deck_rates)
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_founder_cohort_stats TO authenticated;
