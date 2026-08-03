-- Phase B: Market Intelligence aggregation views
-- These views return anonymized aggregate stats only — no individual PII rows.
-- Access is enforced at the application layer (admin-gated React component).
-- Future: wrap in SECURITY DEFINER RPCs once volume clears anonymization thresholds.

-- 1. Sector demand: investor like/pass rates by founder industry
CREATE OR REPLACE VIEW public.v_sector_demand AS
SELECT
  sector,
  COUNT(*) FILTER (WHERE s.action IN ('like', 'superlike')) AS likes,
  COUNT(*) FILTER (WHERE s.action = 'pass')               AS passes,
  COUNT(*)                                                  AS total_swipes,
  ROUND(
    COUNT(*) FILTER (WHERE s.action IN ('like', 'superlike'))::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS like_rate_pct
FROM public.swipes s
JOIN public.profiles p ON p.id = s.swiped_id
JOIN public.founder_profiles fp ON fp.profile_id = s.swiped_id
CROSS JOIN LATERAL unnest(fp.industry) AS sector
WHERE p.user_type = 'founder'
  AND NOT EXISTS (SELECT 1 FROM public.profiles tp WHERE tp.id = s.swiper_id AND tp.is_test_mode = true)
GROUP BY sector
HAVING COUNT(*) >= 5
ORDER BY like_rate_pct DESC NULLS LAST;

-- 2. Pass reason breakdown (only rows with a recorded reason)
CREATE OR REPLACE VIEW public.v_pass_reasons AS
SELECT
  pass_reason,
  COUNT(*)                                                    AS count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) AS pct
FROM public.swipes
WHERE action = 'pass'
  AND pass_reason IS NOT NULL
GROUP BY pass_reason
ORDER BY count DESC;

-- 3. SAFE/deal-terms benchmark
CREATE OR REPLACE VIEW public.v_deal_terms AS
SELECT
  COUNT(*)                                               AS total_safes,
  COUNT(*) FILTER (WHERE valuation_cap IS NOT NULL)     AS with_cap,
  COUNT(*) FILTER (WHERE discount_rate  IS NOT NULL)    AS with_discount,
  ROUND(AVG(amount))                                    AS avg_check_size,
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY valuation_cap)) AS cap_p25,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY valuation_cap)) AS cap_median,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY valuation_cap)) AS cap_p75,
  ROUND(AVG(valuation_cap))                             AS cap_avg,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY discount_rate), 1) AS discount_median,
  ROUND(AVG(discount_rate), 1)                          AS discount_avg
FROM public.safes
WHERE status IS DISTINCT FROM 'voided';

-- 4. Platform funnel snapshot
CREATE OR REPLACE VIEW public.v_platform_funnel AS
SELECT
  (SELECT COUNT(*)                                               FROM public.swipes)                                         AS total_swipes,
  (SELECT COUNT(*) FILTER (WHERE action IN ('like','superlike')) FROM public.swipes)                                         AS total_likes,
  (SELECT COUNT(*) FILTER (WHERE action = 'pass')               FROM public.swipes)                                         AS total_passes,
  (SELECT COUNT(*)                                               FROM public.matches)                                        AS total_matches,
  (SELECT COUNT(*) FILTER (WHERE first_message_at IS NOT NULL)  FROM public.matches)                                        AS matches_messaged,
  (SELECT COUNT(*)                                               FROM public.coffee_chats)                                   AS total_meetings,
  (SELECT COUNT(*) FILTER (WHERE status = 'accepted')           FROM public.coffee_chats)                                   AS accepted_meetings,
  (SELECT COUNT(*)                                               FROM public.safes WHERE status IS DISTINCT FROM 'voided')   AS total_safes,
  (SELECT COUNT(*)                                               FROM public.analytics_events WHERE event_type = 'profile_view') AS profile_views,
  (SELECT COUNT(*)                                               FROM public.analytics_events WHERE event_type = 'deck_open')    AS deck_opens;

-- Grant read to authenticated; underlying table RLS gates what each caller sees.
GRANT SELECT ON public.v_sector_demand   TO authenticated;
GRANT SELECT ON public.v_pass_reasons    TO authenticated;
GRANT SELECT ON public.v_deal_terms      TO authenticated;
GRANT SELECT ON public.v_platform_funnel TO authenticated;
