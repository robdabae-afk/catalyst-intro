-- 1. Trigger function: create profile + role-specific profile from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_user_type text := meta->>'user_type';
  v_name text := COALESCE(meta->>'name', split_part(NEW.email, '@', 1));
  v_referrer_id uuid;
  v_referral_code text := UPPER(COALESCE(meta->>'referral_code', ''));
  v_industries text[];
  v_sectors text[];
BEGIN
  -- Resolve referrer (if any)
  IF v_referral_code <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  -- Create base profile (idempotent)
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

  -- Founder-specific profile
  IF v_user_type = 'founder' THEN
    -- parse industries (jsonb array -> text[])
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
      NULLIF(meta->>'stage', '')::startup_stage,
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
      NULLIF(meta->>'preferred_stage', '')::startup_stage,
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

  -- Referral record
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
  -- Never block auth signup if profile creation fails; just log
  RAISE LOG 'handle_new_user failed for % : % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 2. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill the two orphan auth users so they show up as Pending in admin
INSERT INTO public.profiles (id, email, name, user_type, legal_accepted_at)
SELECT
  u.id,
  u.email,
  split_part(u.email, '@', 1),
  'founder'::user_type,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
