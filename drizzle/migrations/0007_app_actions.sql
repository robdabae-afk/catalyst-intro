create table if not exists public.app_item_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('save','pass','watch','follow','notify','read','learn','checklist')),
  item_id    text not null check (length(item_id) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
create index if not exists app_item_state_user_kind on public.app_item_state (user_id, kind);

create table if not exists public.app_rsvps (
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_id   text not null check (length(event_id) between 1 and 120),
  status     text not null default 'going' check (status in ('going','cancelled')),
  pass_code  text not null default substr(replace(gen_random_uuid()::text,'-',''),1,16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.app_questions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  company_id text not null check (length(company_id) between 1 and 120),
  body       text not null check (length(body) between 1 and 2000),
  answer     text,
  created_at timestamptz not null default now()
);
create index if not exists app_questions_user on public.app_questions (user_id);

create table if not exists public.app_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  thread_id  text not null check (length(thread_id) between 1 and 120),
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists app_messages_user_thread on public.app_messages (user_id, thread_id);

create table if not exists public.app_prefs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  prefs      jsonb not null default '{}'::jsonb,
  interests  text[] not null default '{}',
  role       text check (role in ('investor','founder','both','curious')),
  onboarded_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_invest_profile (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  annual_income  numeric(14,2) not null check (annual_income >= 0),
  net_worth      numeric(14,2) not null check (net_worth >= 0),
  accredited     boolean not null default false,
  limit_12mo     numeric(14,2),
  updated_at     timestamptz not null default now()
);

create or replace function public.app_calc_regcf_limit()
returns trigger language plpgsql set search_path = public as $$
declare g numeric; l numeric;
begin
  if new.accredited then
    new.limit_12mo := null;
  else
    g := greatest(new.annual_income, new.net_worth);
    if new.annual_income < 124000 or new.net_worth < 124000 then
      l := greatest(2500, 0.05 * g);
    else
      l := least(124000, 0.10 * g);
    end if;
    new.limit_12mo := round(l, 2);
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists app_invest_profile_calc on public.app_invest_profile;
create trigger app_invest_profile_calc before insert or update on public.app_invest_profile
  for each row execute function public.app_calc_regcf_limit();

create table if not exists public.app_reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  text not null check (length(company_id) between 1 and 120),
  amount      numeric(14,2) not null check (amount > 0 and amount <= 124000),
  status      text not null default 'interest' check (status in ('interest','cancelled','handed_off')),
  ack_risk    boolean not null default false check (ack_risk),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, company_id)
);

create table if not exists public.app_invites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  channel     text not null default 'link' check (channel in ('link','copy','share','sms','email')),
  created_at  timestamptz not null default now()
);
create index if not exists app_invites_user on public.app_invites (user_id);

create table if not exists public.app_admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references auth.users(id) on delete cascade,
  action      text not null check (action in ('announce','approve','reject')),
  target_id   text not null check (length(target_id) between 1 and 120),
  note        text,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.app_item_state, public.app_rsvps, public.app_questions, public.app_messages, public.app_prefs, public.app_invest_profile, public.app_reservations, public.app_invites, public.app_admin_actions to authenticated;
grant all on public.app_item_state, public.app_rsvps, public.app_questions, public.app_messages, public.app_prefs, public.app_invest_profile, public.app_reservations, public.app_invites, public.app_admin_actions to service_role;

do $$
declare t text;
begin
  foreach t in array array['app_item_state','app_rsvps','app_questions','app_messages','app_prefs',
                           'app_invest_profile','app_reservations','app_invites']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_own', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t||'_own', t);
  end loop;
end $$;

alter table public.app_admin_actions enable row level security;
drop policy if exists app_admin_actions_admin on public.app_admin_actions;
create policy app_admin_actions_admin on public.app_admin_actions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (admin_id = auth.uid() and public.has_role(auth.uid(), 'admin'));

create or replace function public.app_questions_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    new.answer := case when tg_op = 'UPDATE' then old.answer else null end;
  end if;
  return new;
end $$;
drop trigger if exists app_questions_guard on public.app_questions;
create trigger app_questions_guard before insert or update on public.app_questions
  for each row execute function public.app_questions_guard();