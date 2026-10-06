-- Catalyst app features: notifications, watchlist, follows, founder updates,
-- referrals, saved searches, event passes, learn progress, onboarding checklist.
-- FILE ONLY. Not applied to any live project. Review before running.

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('new_pitch','founder_update','event_reminder','qa_answered','new_follower','raise_milestone','investing_opens')),
  title text not null,
  body text,
  link text,
  actor_id uuid references auth.users(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notif read own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif mark own read" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notif delete own" on public.notifications for delete using (auth.uid() = user_id);
-- inserts happen from server (service role) only: no insert policy.
-- users may only change read_at
create or replace function public.notifications_only_read_at() returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' and (new.user_id <> old.user_id or new.kind <> old.kind or new.title <> old.title
     or new.body is distinct from old.body or new.link is distinct from old.link or new.created_at <> old.created_at) then
    raise exception 'only read_at can change';
  end if;
  return new;
end $$;
create trigger notifications_only_read_at before update on public.notifications for each row execute function public.notifications_only_read_at();

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  new_pitch boolean not null default true,
  founder_update boolean not null default true,
  event_reminder boolean not null default true,
  qa_answered boolean not null default true,
  new_follower boolean not null default true,
  raise_milestone boolean not null default true,
  investing_opens boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy "prefs own all" on public.notification_prefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- follows (companies + people) ----------
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('company','user')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, target_type, target_id)
);
alter table public.follows enable row level security;
create policy "follows read signed in" on public.follows for select using (auth.uid() is not null);
create policy "follows insert own" on public.follows for insert with check (auth.uid() = follower_id and not (target_type = 'user' and target_id = auth.uid()));
create policy "follows delete own" on public.follows for delete using (auth.uid() = follower_id);

-- ---------- watchlist ----------
create table if not exists public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  alert_raise_progress boolean not null default true,
  alert_closing_soon boolean not null default true,
  alert_new_update boolean not null default true,
  raise_threshold_pct int check (raise_threshold_pct between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);
alter table public.watchlist enable row level security;
create policy "watchlist own all" on public.watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- founder updates ----------
create table if not exists public.company_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) <= 5000),
  tag text check (tag in ('product','hiring','raise','press','milestone')),
  visibility text not null default 'public' check (visibility in ('public','followers')),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists company_updates_company on public.company_updates(company_id, created_at desc);
alter table public.company_updates enable row level security;
-- assumes public.company_members(company_id, user_id, role) exists from founder tables
create policy "updates read" on public.company_updates for select using (
  status = 'published' and (visibility = 'public' or exists (
    select 1 from public.follows f where f.follower_id = auth.uid() and f.target_type = 'company' and f.target_id = company_id))
  or author_id = auth.uid());
create policy "updates write member" on public.company_updates for insert with check (
  author_id = auth.uid() and exists (select 1 from public.company_members m where m.company_id = company_updates.company_id and m.user_id = auth.uid()));
create policy "updates edit own" on public.company_updates for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "updates delete own" on public.company_updates for delete using (author_id = auth.uid());

-- ---------- referrals (perks only; no cash or securities) ----------
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9-]{4,24}$'),
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
create policy "refcode own read" on public.referral_codes for select using (auth.uid() = user_id);
create policy "refcode own insert" on public.referral_codes for insert with check (auth.uid() = user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid unique references auth.users(id) on delete set null,
  status text not null default 'joined' check (status in ('joined','verified')),
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
create policy "referrals referrer read" on public.referrals for select using (auth.uid() = referrer_id);
-- rows created server-side at signup (service role).

-- ---------- recent searches ----------
create table if not exists public.recent_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null check (char_length(query) <= 120),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.recent_searches enable row level security;
create policy "searches own all" on public.recent_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- event passes ----------
create table if not exists public.event_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.event_passes enable row level security;
create policy "pass own read" on public.event_passes for select using (auth.uid() = user_id);
-- issuing + check-in via server/admin (service role) only.

-- ---------- learn progress ----------
create table if not exists public.learn_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  correct boolean not null,
  answered_on date not null default current_date,
  primary key (user_id, card_id)
);
alter table public.learn_progress enable row level security;
create policy "learn own all" on public.learn_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- onboarding checklist ----------
create table if not exists public.onboarding_steps (
  user_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('photo','bio','interests','follow3','learn','notifications','invite','event')),
  done_at timestamptz not null default now(),
  primary key (user_id, step)
);
alter table public.onboarding_steps enable row level security;
create policy "steps own all" on public.onboarding_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
