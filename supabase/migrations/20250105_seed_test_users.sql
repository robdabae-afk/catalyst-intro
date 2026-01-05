-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert SARAH JENKINS (Founder)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    confirmation_token,
    aud,
    is_super_admin
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'sarah@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sarah Jenkins","user_type":"founder"}',
    now(),
    now(),
    'authenticated',
    '',
    'authenticated',
    false
  );

  -- 2. Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    user_type,
    name,
    avatar_url,
    linkedin_url,
    spotlight_credits,
    created_at,
    updated_at,
    onboarding_complete
  ) VALUES (
    new_user_id,
    'sarah@example.com',
    'founder',
    'Sarah Jenkins',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop',
    'https://linkedin.com/in/sarahjenkins',
    20,
    now(),
    now(),
    true
  );

  -- 3. Insert into public.founder_profiles (or just founders, checking schema assumptions)
  -- Assuming table is named 'founder_profiles' based on usage. If it's 'founders', update accordingly.
  -- PREVIOUS CONTEXT INDICATES: profiles might just have user_type, but detailed data might be in another table or JSON.
  -- Wait, FeaturedCard uses `profile.founder_profiles?.[0]`. This implies a join or relationship.
  -- Let's assume table `founder_profiles` exists.
  INSERT INTO public.founder_profiles (
    id,
    user_id,
    company_name,
    title,
    location,
    stage,
    description,
    revenue,
    team_size,
    created_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'FinLeap',
    'Founder',
    'San Francisco, CA',
    'Seed',
    'Revolutionizing embedded finance for platforms.',
    '250k',
    8,
    now()
  );
  
  -- 4. Insert Safe (Deal History)
  INSERT INTO public.safes (
    id,
    founder_id,
    investor_id, -- Self-ref or random for now, or null if constraint allows. 
                -- Ideally we need an investor ID. I will verify if I can insert without it or use a placeholder.
                -- Use new_user_id as placeholder if self-investment allowed, or generate another ID.
                -- Safes table def showed investor_id is not nullable.
                -- I'll create a dummy investor first? No, I'll use Alex's ID.
    amount,
    valuation_cap,
    created_at
  ) 
  -- We'll do this AFTER inserting Alex so we have his ID.
  -- Placeholder for now.
  VALUES (gen_random_uuid(), new_user_id, new_user_id, 250000, 5000000, now() - interval '6 months');

END $$;

-- Insert ALEX RIVERA (Investor)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'alex@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Alex Rivera","user_type":"investor"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  INSERT INTO public.profiles (
    id,
    email,
    user_type,
    name,
    avatar_url,
    spotlight_credits,
    onboarding_complete
  ) VALUES (
    new_user_id,
    'alex@example.com',
    'investor',
    'Alex Rivera',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
    100,
    true
  );

  -- Investor Profile
  INSERT INTO public.investor_profiles (
     id,
     user_id,
     firm_name,
     title,
     location,
     check_size,
     assets_under_management,
     created_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'Apex Ventures',
    'Lead Partner',
    'New York, NY',
    '500k-2M',
    '150M',
    now()
  );

END $$;
