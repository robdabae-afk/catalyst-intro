-- Real catalog for the Catalyst app: companies + events managed by admins and founders.
-- Replaces the in-code sample data. No money movement: reservations stay "interest" only.

create table if not exists public.app_companies (
  id           text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
  owner_id     uuid references auth.users(id) on delete set null,
  status       text not null default 'draft' check (status in ('draft','pending','published','archived')),
  data         jsonb not null default '{}'::jsonb,
  sort         integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists app_companies_status on public.app_companies (status, sort);
create index if not exists app_companies_owner on public.app_companies (owner_id);

create table if not exists public.app_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(title) between 1 and 160),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  venue       text not null default '',
  city        text not null default 'New York',
  image_url   text,
  url         text,
  capacity    integer check (capacity is null or capacity > 0),
  company_ids text[] not null default '{}',
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists app_events_status on public.app_events (status, starts_at);

-- helpers (security definer so policies can call them without RLS recursion)
create or replace function public.app_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.has_role(auth.uid(), 'admin'), false)
$$;
create or replace function public.app_owns_company(cid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_companies where id = cid and owner_id = auth.uid())
$$;
grant execute on function public.app_is_admin() to anon, authenticated;
grant execute on function public.app_owns_company(text) to authenticated;

alter table public.app_companies enable row level security;
alter table public.app_events enable row level security;
grant select on public.app_companies, public.app_events to anon;
grant select, insert, update, delete on public.app_companies, public.app_events to authenticated;
grant all on public.app_companies, public.app_events to service_role;

drop policy if exists app_companies_read on public.app_companies;
create policy app_companies_read on public.app_companies for select to anon, authenticated
  using (status = 'published' or owner_id = auth.uid() or public.app_is_admin());
drop policy if exists app_companies_founder_insert on public.app_companies;
create policy app_companies_founder_insert on public.app_companies for insert to authenticated
  with check (public.app_is_admin() or (owner_id = auth.uid() and status in ('draft','pending')));
drop policy if exists app_companies_founder_update on public.app_companies;
create policy app_companies_founder_update on public.app_companies for update to authenticated
  using (public.app_is_admin() or owner_id = auth.uid())
  with check (public.app_is_admin() or (owner_id = auth.uid() and status in ('draft','pending','archived')));
drop policy if exists app_companies_admin_delete on public.app_companies;
create policy app_companies_admin_delete on public.app_companies for delete to authenticated
  using (public.app_is_admin() or (owner_id = auth.uid() and status <> 'published'));

drop policy if exists app_events_read on public.app_events;
create policy app_events_read on public.app_events for select to anon, authenticated
  using (status = 'published' or public.app_is_admin());
drop policy if exists app_events_admin on public.app_events;
create policy app_events_admin on public.app_events for all to authenticated
  using (public.app_is_admin()) with check (public.app_is_admin());

-- founder edits to a live listing send it back to review; stamp timestamps
create or replace function public.app_companies_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if auth.role() = 'authenticated' and not public.app_is_admin() and new.status = 'published' then
    new.status := 'pending';  -- founder edits to a live listing go back to review
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists app_companies_stamp on public.app_companies;
create trigger app_companies_stamp before insert or update on public.app_companies
  for each row execute function public.app_companies_stamp();

-- Q&A: public on published companies; founders (owners) and admins can answer
alter table public.app_questions add column if not exists asker_name text check (asker_name is null or length(asker_name) <= 80);
alter table public.app_questions add column if not exists answered_at timestamptz;
drop policy if exists app_questions_public_read on public.app_questions;
create policy app_questions_public_read on public.app_questions for select to anon, authenticated
  using (exists (select 1 from public.app_companies c where c.id = company_id and c.status = 'published'));
drop policy if exists app_questions_founder_answer on public.app_questions;
create policy app_questions_founder_answer on public.app_questions for update to authenticated
  using (public.app_owns_company(company_id) or public.app_is_admin())
  with check (public.app_owns_company(company_id) or public.app_is_admin());
create or replace function public.app_questions_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if public.app_owns_company(new.company_id) or public.app_is_admin() then
      if tg_op = 'UPDATE' then
        new.body := old.body; new.user_id := old.user_id; new.company_id := old.company_id;
        if new.answer is distinct from old.answer then new.answered_at := now(); end if;
      end if;
    else
      new.answer := case when tg_op = 'UPDATE' then old.answer else null end;
      new.answered_at := case when tg_op = 'UPDATE' then old.answered_at else null end;
    end if;
  end if;
  return new;
end $$;

-- Messages: thread_id = company id. Investor owns the thread (user_id); the company owner can read and reply.
alter table public.app_messages add column if not exists sender_id uuid references auth.users(id) on delete set null;
alter table public.app_messages alter column sender_id set default auth.uid();
drop policy if exists app_messages_founder_read on public.app_messages;
create policy app_messages_founder_read on public.app_messages for select to authenticated
  using (public.app_owns_company(thread_id) or public.app_is_admin());
drop policy if exists app_messages_founder_reply on public.app_messages;
create policy app_messages_founder_reply on public.app_messages for insert to authenticated
  with check (sender_id = auth.uid() and (public.app_owns_company(thread_id) or public.app_is_admin()));

-- Founders/admins see interest reservations for their company (still no money; portal handoff only)
drop policy if exists app_reservations_founder_read on public.app_reservations;
create policy app_reservations_founder_read on public.app_reservations for select to authenticated
  using (public.app_owns_company(company_id) or public.app_is_admin());
drop policy if exists app_rsvps_admin_read on public.app_rsvps;
create policy app_rsvps_admin_read on public.app_rsvps for select to authenticated using (public.app_is_admin());

alter table public.app_admin_actions drop constraint if exists app_admin_actions_action_check;
alter table public.app_admin_actions add constraint app_admin_actions_action_check
  check (action in ('announce','approve','reject','publish','unpublish','archive','event_publish','event_archive'));

-- media bucket: public read, users upload into their own folder, admins anywhere
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('app-media', 'app-media', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists app_media_read on storage.objects;
create policy app_media_read on storage.objects for select to anon, authenticated using (bucket_id = 'app-media');
drop policy if exists app_media_write on storage.objects;
create policy app_media_write on storage.objects for insert to authenticated
  with check (bucket_id = 'app-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.app_is_admin()));
drop policy if exists app_media_delete on storage.objects;
create policy app_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'app-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.app_is_admin()));
