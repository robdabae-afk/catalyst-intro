CREATE OR REPLACE FUNCTION public.safe_int(v text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN regexp_replace(COALESCE(v,''), '[^0-9]', '', 'g') ~ '^[0-9]{1,9}$'
              THEN regexp_replace(v, '[^0-9]', '', 'g')::int END
$$;
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
  v_tiles text[];
BEGIN
  IF v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referral_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, name, user_type, linkedin_url, referred_by, legal_accepted_at, legal_accepted_ip, avatar_url)
  VALUES (NEW.id, NEW.email, v_name, COALESCE(v_user_type, 'founder')::user_type, NULLIF(meta->>'linkedin_url', ''), v_referrer_id,
    CASE WHEN (meta->>'legal_accepted_at') IS NOT NULL THEN (meta->>'legal_accepted_at')::timestamptz ELSE now() END,
    NULLIF(meta->>'legal_accepted_ip', ''), NULLIF(meta->>'avatar_url', ''))
  ON CONFLICT (id) DO NOTHING;

  IF v_user_type = 'founder' THEN
    IF jsonb_typeof(meta->'industry') = 'array' THEN
      SELECT array_agg(value::text) INTO v_industries FROM jsonb_array_elements_text(meta->'industry');
    END IF;
    IF jsonb_typeof(meta->'traction_tiles') = 'array' THEN
      SELECT array_agg(value::text) INTO v_tiles FROM jsonb_array_elements_text(meta->'traction_tiles');
    END IF;

    INSERT INTO public.founder_profiles (
      profile_id, startup_name, company_name, one_liner, industry, stage, traction,
      pitch_deck_url, pitch_deck_visibility, preferred_city, company_state, company_address,
      banner_url, video_url, funding_amount, mrr, backed_by, ein_number,
      growth_mom, paying_customers, operations_start_date, team_full_time,
      waitlist_signups, active_users, pilots_lois, product_status, user_growth_mom, traction_tiles)
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
      NULLIF(meta->>'ein_number', ''),
      NULLIF(meta->>'growth_mom', ''),
      public.safe_int(meta->>'paying_customers'),
      CASE WHEN meta->>'operations_start_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN (meta->>'operations_start_date')::date END,
      COALESCE(lower(meta->>'team_full_time') IN ('true','t','1','yes'), false),
      public.safe_int(meta->>'waitlist_signups'),
      NULLIF(meta->>'active_users', ''),
      public.safe_int(meta->>'pilots_lois'),
      NULLIF(meta->>'product_status', ''),
      NULLIF(meta->>'user_growth_mom', ''),
      COALESCE(v_tiles, '{}'::text[]))
    ON CONFLICT DO NOTHING;

  ELSIF v_user_type = 'investor' THEN
    IF jsonb_typeof(meta->'sectors_of_interest') = 'array' THEN
      SELECT array_agg(value::text) INTO v_sectors FROM jsonb_array_elements_text(meta->'sectors_of_interest');
    END IF;

    INSERT INTO public.investor_profiles (
      profile_id, firm_name, position, investment_thesis, typical_check_size, preferred_stage, sectors_of_interest,
      location, portfolio_link, banner_url, investor_type, investment_count, notable_portfolio, accreditation_status)
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
      public.safe_int(meta->>'investment_count'),
      NULLIF(meta->>'notable_portfolio', ''),
      NULLIF(meta->>'accreditation_status', ''))
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status, referred_user_type)
    VALUES (v_referrer_id, NEW.id, v_referral_code, 'pending', COALESCE(v_user_type, 'founder'))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for % : % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;

INSERT INTO public.profiles (id,email,name,user_type,legal_accepted_at)
SELECT u.id,u.email,COALESCE(u.raw_user_meta_data->>'name',split_part(u.email,'@',1)),
       COALESCE(u.raw_user_meta_data->>'user_type','founder')::user_type,
       COALESCE((u.raw_user_meta_data->>'legal_accepted_at')::timestamptz, now())
FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.founder_profiles (profile_id,startup_name,company_name,one_liner,industry,stage,preferred_city,operations_start_date,team_full_time,pilots_lois,product_status,user_growth_mom,traction_tiles)
SELECT u.id, COALESCE(NULLIF(m->>'startup_name',''),'Untitled'), COALESCE(NULLIF(m->>'startup_name',''),'Untitled'), COALESCE(m->>'one_liner',''),
  ARRAY(SELECT jsonb_array_elements_text(COALESCE(m->'industry','[]'::jsonb))), NULLIF(m->>'stage','')::funding_stage, NULLIF(m->>'preferred_city',''),
  CASE WHEN m->>'operations_start_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN (m->>'operations_start_date')::date END,
  COALESCE(lower(m->>'team_full_time') IN ('true','t','1','yes'),false), public.safe_int(m->>'pilots_lois'),
  NULLIF(m->>'product_status',''), NULLIF(m->>'user_growth_mom',''), '{}'
FROM auth.users u CROSS JOIN LATERAL (SELECT u.raw_user_meta_data AS m) x
WHERE m->>'user_type'='founder' AND NOT EXISTS (SELECT 1 FROM public.founder_profiles f WHERE f.profile_id=u.id);

UPDATE public.profiles SET is_test_account=true WHERE email LIKE 'qa.signup.%@example.com';