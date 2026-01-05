-- Seed Test Profiles
-- This migration inserts hardcoded test profiles directly into the database.
-- These will be available for "Test Mode" on the dashboard.

-- 1. Insert Profiles (only if email doesn't exist)
INSERT INTO public.profiles (id, name, email, user_type, avatar_url, is_test_account, spotlight_credits, referral_code)
SELECT '00000000-0000-0000-0000-000000000001', 'Sarah Jenkins', 'sarah@example.com', 'founder', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop', true, 20, 'TEST0'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'sarah@example.com')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000002', 'Alex Rivera', 'alex@example.com', 'investor', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop', true, 100, 'TEST1'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'alex@example.com')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000003', 'Marcus Chen', 'marcus@solaris.io', 'founder', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop', true, 15, 'TEST2'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'marcus@solaris.io')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000004', 'Elena Rodriguez', 'elena@pioneer.vc', 'investor', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop', true, 50, 'TEST3'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'elena@pioneer.vc');

-- 2. Insert Founder Profiles (only if profile_id doesn't exist)
INSERT INTO public.founder_profiles (id, profile_id, company_name, startup_name, one_liner, stage, industry, traction)
SELECT '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'FinLeap', 'FinLeap', 'Revolutionizing embedded finance for platforms.', 'seed', ARRAY['FinTech', 'SaaS'], '250k ARR, 15 partners'
WHERE NOT EXISTS (SELECT 1 FROM public.founder_profiles WHERE profile_id = '00000000-0000-0000-0000-000000000001')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Solaris Energy', 'Solaris Energy', 'Decentralized solar grid management.', 'series-a', ARRAY['CleanTech', 'Energy'], 'Reached 10k homes, $2M Revenue'
WHERE NOT EXISTS (SELECT 1 FROM public.founder_profiles WHERE profile_id = '00000000-0000-0000-0000-000000000003');

-- 3. Insert Investor Profiles (only if profile_id doesn't exist)
INSERT INTO public.investor_profiles (id, profile_id, firm_name, location, typical_check_size, preferred_stage, sectors_of_interest)
SELECT '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Apex Ventures', 'New York, NY', '500k-2M', 'seed', ARRAY['FinTech', 'AI', 'Enterprise']
WHERE NOT EXISTS (SELECT 1 FROM public.investor_profiles WHERE profile_id = '00000000-0000-0000-0000-000000000002')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Pioneer Catalyst', 'San Francisco, CA', '100k-500k', 'pre-seed', ARRAY['Consumer', 'Marketplace', 'HealthTech']
WHERE NOT EXISTS (SELECT 1 FROM public.investor_profiles WHERE profile_id = '00000000-0000-0000-0000-000000000004');
