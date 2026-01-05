-- Seed Test Profiles
-- This migration inserts hardcoded test profiles directly into the database.
-- These will be available for "Test Mode" on the dashboard.

-- 1. Insert Profiles
INSERT INTO public.profiles (id, name, email, user_type, avatar_url, is_test_account, spotlight_credits, referral_code)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Sarah Jenkins', 'sarah@example.com', 'founder', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop', true, 20, 'TEST0'),
    ('00000000-0000-0000-0000-000000000002', 'Alex Rivera', 'alex@example.com', 'investor', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop', true, 100, 'TEST1'),
    ('00000000-0000-0000-0000-000000000003', 'Marcus Chen', 'marcus@solaris.io', 'founder', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop', true, 15, 'TEST2'),
    ('00000000-0000-0000-0000-000000000004', 'Elena Rodriguez', 'elena@pioneer.vc', 'investor', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop', true, 50, 'TEST3')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    avatar_url = EXCLUDED.avatar_url,
    is_test_account = EXCLUDED.is_test_account,
    spotlight_credits = EXCLUDED.spotlight_credits,
    referral_code = EXCLUDED.referral_code;

-- 2. Insert Founder Profiles
INSERT INTO public.founder_profiles (id, profile_id, company_name, startup_name, one_liner, stage, industry, traction)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'FinLeap', 'FinLeap', 'Revolutionizing embedded finance for platforms.', 'seed', ARRAY['FinTech', 'SaaS'], '250k ARR, 15 partners'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Solaris Energy', 'Solaris Energy', 'Decentralized solar grid management.', 'series-a', ARRAY['CleanTech', 'Energy'], 'Reached 10k homes, $2M Revenue')
ON CONFLICT (id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    company_name = EXCLUDED.company_name,
    startup_name = EXCLUDED.startup_name,
    one_liner = EXCLUDED.one_liner,
    stage = EXCLUDED.stage,
    industry = EXCLUDED.industry,
    traction = EXCLUDED.traction;

-- 3. Insert Investor Profiles
INSERT INTO public.investor_profiles (id, profile_id, firm_name, location, typical_check_size, preferred_stage, sectors_of_interest)
VALUES 
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Apex Ventures', 'New York, NY', '500k-2M', 'seed', ARRAY['FinTech', 'AI', 'Enterprise']),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Pioneer Catalyst', 'San Francisco, CA', '100k-500k', 'pre-seed', ARRAY['Consumer', 'Marketplace', 'HealthTech'])
ON CONFLICT (id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    firm_name = EXCLUDED.firm_name,
    location = EXCLUDED.location,
    typical_check_size = EXCLUDED.typical_check_size,
    preferred_stage = EXCLUDED.preferred_stage,
    sectors_of_interest = EXCLUDED.sectors_of_interest;
