-- FIX 1: Secure Profiles Data
-- Problem: 'profiles' table exposes email/payment info to other users.
-- Solution: Create a secure View that only exposes public fields, and revoke access to raw table for discovery.

-- 1. Create a view for public profile discovery
create or replace view public_profiles as
select 
  id,
  user_type,
  name,
  avatar_url,
  headline,
  bio,
  linkedin_url,
  website_url,
  location,
  preferred_city,
  industry,
  stage,
  filter_stages,
  filter_industries,
  filter_locations,
  created_at
from profiles
where is_hidden = false;

-- 2. (Optional but recommended) Revoke generic authenticated access if you want to force use of the view
-- Note: This might break other parts of the app if they rely on select * from profiles. 
-- For now, switching the frontend to use the VIEW is the primary protection against accidental leakage.


-- FIX 2: Secure Deck Leads
-- Problem: 'deck_leads' might be readable by the public.
-- Solution: Enable RLS and strictly limit SELECT to Admins.

-- 1. Enable RLS (if not already enabled)
alter table deck_leads enable row level security;

-- 2. Drop insecure policies if they exist (cleanup)
drop policy if exists "Anyone can read deck leads" on deck_leads;
drop policy if exists "Public read access" on deck_leads;

-- 3. Ensure strictly Admin-only read access
create policy "Admin read access"
on deck_leads
for select
to authenticated
using (
  auth.uid() in (
    select user_id from user_roles where role = 'admin'
  )
);

-- 4. Ensure Public INSERT is still allowed (for the forms to work)
drop policy if exists "Allow public inserts" on deck_leads; -- recreate to be safe
create policy "Allow public inserts"
on deck_leads
for insert
to public
with check (true);
