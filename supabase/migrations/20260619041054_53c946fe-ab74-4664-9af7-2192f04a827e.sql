
DO $$
DECLARE
  v_founder uuid;
  v_investor uuid;
BEGIN
  SELECT id INTO v_founder FROM auth.users WHERE email = 'test.founder@catalyst.test' LIMIT 1;
  SELECT id INTO v_investor FROM auth.users WHERE email = 'test.investor@catalyst.test' LIMIT 1;

  IF v_founder IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, user_type, legal_accepted_at, is_test_account)
    VALUES (v_founder, 'test.founder@catalyst.test', 'Test Founder', 'founder'::public.user_type, now(), true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.founder_profiles (
      profile_id, startup_name, company_name, one_liner,
      industry, stage, traction, preferred_city, pitch_deck_visibility
    )
    VALUES (
      v_founder, 'Acme Labs', 'Acme Labs',
      'AI-powered automation for SMBs',
      ARRAY['AI','Fintech'], 'seed'::public.funding_stage,
      'Early traction with 5 pilot customers',
      'New York', 'public'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  IF v_investor IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, user_type, legal_accepted_at, is_test_account)
    VALUES (v_investor, 'test.investor@catalyst.test', 'Test Investor', 'investor'::public.user_type, now(), true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.investor_profiles (
      profile_id, firm_name, position, investment_thesis,
      typical_check_size, preferred_stage, sectors_of_interest,
      location, investor_type
    )
    VALUES (
      v_investor, 'Catalyst Capital', 'Partner',
      'Backing early-stage AI and Fintech founders',
      '$50k-$250k', 'seed'::public.funding_stage,
      ARRAY['AI','Fintech'],
      'New York', 'angel'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END $$;
