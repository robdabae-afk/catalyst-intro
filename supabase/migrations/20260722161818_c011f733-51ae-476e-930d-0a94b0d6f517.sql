
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_user_type text := meta->>'user_type';
  v_name text := COALESCE(meta->>'name', split_part(NEW.email, '@', 1));
  v_referrer_id uuid;
  v_referral_code text := UPPER(COALESCE(meta->>'referral_code', ''));
  v_industries text[];
  v_sectors text[];
BEGIN
  IF v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, email, name, user_type,
    linkedin_url, referred_by,
    legal_accepted_at, legal_accepted_ip,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    COALESCE(v_user_type, 'founder')::user_type,
    NULLIF(meta->>'linkedin_url', ''),
    v_referrer_id,
    CASE WHEN (meta->>'legal_accepted_at') IS NOT NULL
         THEN (meta->>'legal_accepted_at')::timestamptz ELSE now() END,
    NULLIF(meta->>'legal_accepted_ip', ''),
    NULLIF(meta->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_user_type = 'founder' THEN
    IF jsonb_typeof(meta->'industry') = 'array' THEN
      SELECT array_agg(value::text) INTO v_industries
      FROM jsonb_array_elements_text(meta->'industry');
    END IF;

    INSERT INTO public.founder_profiles (
      profile_id, startup_name, company_name, one_liner,
      industry, stage, traction,
      pitch_deck_url, pitch_deck_visibility,
      preferred_city, company_state, company_address,
      banner_url, video_url,
      funding_amount, mrr, backed_by, ein_number
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(meta->>'startup_name', ''), 'Untitled'),
      COALESCE(NULLIF(meta->>'startup_name', ''), 'Untitled'),
      COALESCE(NULLIF(meta->>'one_liner', ''), ''),
      v_industries,
      NULLIF(meta->>'stage', '')::funding_stage,
      NULLIF(meta->>'traction', ''),
      NULLIF(meta->>'pitch_deck_url', ''),
      COALESCE(NULLIF(meta->>'pitch_deck_visibility', ''), 'public'),
      NULLIF(meta->>'preferred_city', ''),
      NULLIF(meta->>'company_state', ''),
      NULLIF(meta->>'company_address', ''),
      NULLIF(meta->>'banner_url', ''),
      NULLIF(meta->>'video_url', ''),
      NULLIF(meta->>'funding_amount', ''),
      NULLIF(meta->>'mrr', ''),
      NULLIF(meta->>'backed_by', ''),
      NULLIF(meta->>'ein_number', '')
    )
    ON CONFLICT DO NOTHING;

  ELSIF v_user_type = 'investor' THEN
    IF jsonb_typeof(meta->'sectors_of_interest') = 'array' THEN
      SELECT array_agg(value::text) INTO v_sectors
      FROM jsonb_array_elements_text(meta->'sectors_of_interest');
    END IF;

    INSERT INTO public.investor_profiles (
      profile_id, firm_name, position, investment_thesis,
      typical_check_size, preferred_stage, sectors_of_interest,
      location, portfolio_link, banner_url, investor_type,
      investment_count, notable_portfolio, accreditation_status
    )
    VALUES (
      NEW.id,
      NULLIF(meta->>'firm_name', ''),
      NULLIF(meta->>'position', ''),
      NULLIF(meta->>'investment_thesis', ''),
      NULLIF(meta->>'typical_check_size', ''),
      NULLIF(meta->>'preferred_stage', '')::funding_stage,
      v_sectors,
      NULLIF(meta->>'location', ''),
      NULLIF(meta->>'portfolio_link', ''),
      NULLIF(meta->>'banner_url', ''),
      NULLIF(meta->>'investor_type', ''),
      NULLIF(meta->>'investment_count', '')::int,
      NULLIF(meta->>'notable_portfolio', ''),
      NULLIF(meta->>'accreditation_status', '')
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id, referred_user_id, referral_code, status, referred_user_type
    )
    VALUES (
      v_referrer_id, NEW.id, v_referral_code, 'pending', COALESCE(v_user_type, 'founder')
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for % : % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;

-- Backfill profiles for existing auth users who are missing one
INSERT INTO public.profiles (id, email, name, user_type, legal_accepted_at, legal_accepted_ip, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'user_type', 'founder')::user_type,
  COALESCE((u.raw_user_meta_data->>'legal_accepted_at')::timestamptz, now()),
  NULLIF(u.raw_user_meta_data->>'legal_accepted_ip', ''),
  NULLIF(u.raw_user_meta_data->>'avatar_url', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Backfill founder_profiles
INSERT INTO public.founder_profiles (
  profile_id, startup_name, company_name, one_liner, industry, stage, preferred_city, pitch_deck_visibility
)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'startup_name', ''), 'Untitled'),
  COALESCE(NULLIF(u.raw_user_meta_data->>'startup_name', ''), 'Untitled'),
  COALESCE(NULLIF(u.raw_user_meta_data->>'one_liner', ''), ''),
  CASE WHEN jsonb_typeof(u.raw_user_meta_data->'industry') = 'array'
       THEN ARRAY(SELECT jsonb_array_elements_text(u.raw_user_meta_data->'industry'))
       ELSE NULL END,
  NULLIF(u.raw_user_meta_data->>'stage', '')::funding_stage,
  NULLIF(u.raw_user_meta_data->>'preferred_city', ''),
  'public'
FROM auth.users u
LEFT JOIN public.founder_profiles fp ON fp.profile_id = u.id
WHERE fp.profile_id IS NULL
  AND COALESCE(u.raw_user_meta_data->>'user_type', 'founder') = 'founder'
ON CONFLICT DO NOTHING;

-- Backfill investor_profiles
INSERT INTO public.investor_profiles (
  profile_id, firm_name, sectors_of_interest, typical_check_size, investor_type, accreditation_status, location
)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data->>'firm_name', ''),
  CASE WHEN jsonb_typeof(u.raw_user_meta_data->'sectors_of_interest') = 'array'
       THEN ARRAY(SELECT jsonb_array_elements_text(u.raw_user_meta_data->'sectors_of_interest'))
       ELSE NULL END,
  NULLIF(u.raw_user_meta_data->>'typical_check_size', ''),
  NULLIF(u.raw_user_meta_data->>'investor_type', ''),
  NULLIF(u.raw_user_meta_data->>'accreditation_status', ''),
  NULLIF(u.raw_user_meta_data->>'location', '')
FROM auth.users u
LEFT JOIN public.investor_profiles ip ON ip.profile_id = u.id
WHERE ip.profile_id IS NULL
  AND u.raw_user_meta_data->>'user_type' = 'investor'
ON CONFLICT DO NOTHING;
