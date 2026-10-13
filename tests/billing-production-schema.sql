-- Local subset generated from readonly production schema export. No invented ledger/inbox tables.
create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),current_user)$$;
grant usage on schema auth,public to authenticated,service_role;
create type public.referral_status as enum ('pending','approved','rejected');
create type public.match_role as enum ('founder','investor');
create type public.match_doc_type as enum ('pitch_deck','cap_table','incorporation','financials','other');
create type public.payment_status as enum ('pending','processing','completed');
create type public.ad_profile_type as enum ('startup','investment_fund','external');
create type public.match_doc_status as enum ('pending','fulfilled','declined');
create type public.match_status as enum ('active','unmatched','successful_collaboration');
create type public.spotlight_duration as enum ('1_day','1_week','1_month');
create type public.manual_match_status as enum ('pending','paid','fulfilled','cancelled');
create type public.ticket_status as enum ('open','closed');
create type public.user_type as enum ('founder','investor');
create type public.match_accreditation as enum ('accredited','institutional','none');
create type public.app_role as enum ('admin','user');
create type public.funding_stage as enum ('pre-seed','seed','series-a','series-b');
create table public.profiles ("id" uuid not null,"user_type" user_type not null,"name" text not null,"email" text not null,"created_at" timestamptz default now(),"updated_at" timestamptz default now(),"avatar_url" text,"stripe_account_id" text,"stripe_onboarding_completed" bool default false,"subscription_plan" text,"subscription_status" text,"subscription_expires_at" timestamptz,"stripe_customer_id" text,"stripe_subscription_id" text,"weekly_spotlight_used_at" timestamptz,"filter_stages" text[],"filter_industries" text[],"filter_locations" text[],"admin_edit_suggestion" text,"admin_edit_message" text,"has_pending_update" bool default false,"last_profile_update_at" timestamptz,"referral_code" text not null,"referred_by" uuid,"bonus_swipes" int4 default 0 not null,"spotlight_credits" int4 default 0 not null,"spotlight_active_until" timestamptz,"weekly_initiations_count" int4 default 0 not null,"weekly_initiations_reset_at" timestamptz,"has_seen_welcome" bool default false not null,"legal_accepted_at" timestamptz,"legal_accepted_ip" text,"legal_acknowledged" bool default false,"match_banner_dismissed" bool default false,"is_hidden" bool default false not null,"hidden_at" timestamptz,"hidden_by" uuid,"is_test_mode" bool default false,"is_test_account" bool default false,"is_featured" bool default false,"tokens" int4 default 0 not null,"approved" bool default false not null,"early_access" bool default false not null,"early_access_paid_at" timestamptz,"profile_grace_until" timestamptz,"linkedin_url" text,"is_flagged" bool default false not null,"rejection_reason" text,"onboarding_dismissed_at" timestamptz,"phone" text,"last_seen_at" timestamptz,"ccpa_do_not_sell" bool default false not null,"ccpa_updated_at" timestamptz,"aggregated_data_consent" bool default true not null);
create table public.user_roles ("id" uuid default gen_random_uuid() not null,"user_id" uuid not null,"role" app_role not null,"created_at" timestamptz default now());
create table public.swipes ("id" uuid default gen_random_uuid() not null,"swiper_id" uuid not null,"swiped_id" uuid not null,"action" text not null,"created_at" timestamptz default now() not null,"pass_reason" text);
create table public.matches ("id" uuid default gen_random_uuid() not null,"user_1_id" uuid not null,"user_2_id" uuid not null,"status" match_status default 'active'::match_status not null,"first_message_sender_id" uuid,"first_message_at" timestamptz,"marked_successful_by" uuid,"marked_successful_at" timestamptz,"unmatched_by" uuid,"unmatched_at" timestamptz,"created_at" timestamptz default now() not null,"updated_at" timestamptz default now() not null,"investor_stage" text);
create table public.messages ("id" uuid default gen_random_uuid() not null,"sender_id" uuid not null,"receiver_id" uuid not null,"content" text not null,"created_at" timestamptz default now() not null,"read" bool default false not null);
create table public.app_companies ("id" text not null,"owner_id" uuid,"status" text default 'draft'::text not null,"data" jsonb default '{}'::jsonb not null,"sort" int4 default 0 not null,"created_at" timestamptz default now() not null,"updated_at" timestamptz default now() not null,"published_at" timestamptz);
create table public.app_item_state ("user_id" uuid not null,"kind" text not null,"item_id" text not null,"created_at" timestamptz default now() not null);
alter table app_companies add constraint "app_companies_id_check" CHECK (id ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'::text);
alter table app_companies add constraint "app_companies_pkey" PRIMARY KEY (id);
alter table app_companies add constraint "app_companies_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'published'::text, 'archived'::text]));
alter table app_item_state add constraint "app_item_state_item_id_check" CHECK (length(item_id) >= 1 AND length(item_id) <= 120);
alter table app_item_state add constraint "app_item_state_kind_check" CHECK (kind = ANY (ARRAY['save'::text, 'pass'::text, 'watch'::text, 'follow'::text, 'notify'::text, 'read'::text, 'learn'::text, 'checklist'::text]));
alter table app_item_state add constraint "app_item_state_pkey" PRIMARY KEY (user_id, kind, item_id);
alter table matches add constraint "different_users" CHECK (user_1_id <> user_2_id);
alter table matches add constraint "matches_pkey" PRIMARY KEY (id);
alter table matches add constraint "unique_match" UNIQUE (user_1_id, user_2_id);
alter table messages add constraint "messages_pkey" PRIMARY KEY (id);
alter table profiles add constraint "profiles_pkey" PRIMARY KEY (id);
alter table profiles add constraint "profiles_referral_code_key" UNIQUE (referral_code);
alter table swipes add constraint "swipes_action_check" CHECK (action = ANY (ARRAY['like'::text, 'pass'::text, 'priority'::text]));
alter table swipes add constraint "swipes_pkey" PRIMARY KEY (id);
alter table swipes add constraint "swipes_swiper_id_swiped_id_key" UNIQUE (swiper_id, swiped_id);
alter table user_roles add constraint "user_roles_pkey" PRIMARY KEY (id);
alter table user_roles add constraint "user_roles_user_id_role_key" UNIQUE (user_id, role);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 SELECT public.has_role(_user_id, 'admin') OR EXISTS (
   SELECT 1 FROM public.profiles WHERE id = _user_id AND approved AND NOT is_flagged
 );
$function$
;
CREATE OR REPLACE FUNCTION public.approval_exception(_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 SELECT EXISTS (
   SELECT 1 FROM public.profiles p WHERE p.id = _profile_id AND (
     coalesce(p.is_test_account, false)
     OR EXISTS (
       -- Never trust editable profiles.email or raw_user_meta_data for Kat/access.
       SELECT 1 FROM auth.users u WHERE u.id = p.id
         AND u.email_confirmed_at IS NOT NULL
         AND lower(btrim(u.email)) IN (
           'kat@propel.earth',
           'sarah@example.com', 'alex@example.com',
           'marcus@solaris.io', 'elena@pioneer.vc',
           'test.founder@catalyst.test', 'test.investor@catalyst.test',
           'test.founder@catalystintro.com', 'test.investor@catalystintro.com'
         )
     )
     OR (
       -- January dummy profiles can lack auth rows; require BOTH seed ID and email.
       NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
       AND (p.id, lower(btrim(p.email))) IN (
         ('00000000-0000-0000-0000-000000000001'::uuid, 'sarah@example.com'),
         ('00000000-0000-0000-0000-000000000002'::uuid, 'alex@example.com'),
         ('00000000-0000-0000-0000-000000000003'::uuid, 'marcus@solaris.io'),
         ('00000000-0000-0000-0000-000000000004'::uuid, 'elena@pioneer.vc')
       )
     )
   )
 );
$function$
;
CREATE OR REPLACE FUNCTION public.guard_profile_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
 IF auth.role() IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin') THEN
   IF TG_OP = 'INSERT' THEN
     IF new.approved OR coalesce(new.is_verified,false) OR coalesce(new.is_flagged,false)
        OR coalesce(new.is_test_account,false) THEN
       RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
     END IF;
   ELSIF new.approved IS DISTINCT FROM old.approved
      OR new.is_verified IS DISTINCT FROM old.is_verified
      OR new.is_flagged IS DISTINCT FROM old.is_flagged
      OR new.rejection_reason IS DISTINCT FROM old.rejection_reason
      OR new.is_test_account IS DISTINCT FROM old.is_test_account THEN
     RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN new;
END $function$
;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sync_profile_approval_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE uid uuid;
BEGIN
 IF TG_OP <> 'INSERT' AND old.role::text = 'admin' THEN
   uid := old.user_id;
   UPDATE public.profiles SET approved =
     (public.has_role(uid, 'admin') OR public.approval_exception(uid)) WHERE id = uid;
 END IF;
 IF TG_OP <> 'DELETE' AND new.role::text = 'admin' THEN
   uid := new.user_id;
   UPDATE public.profiles SET approved = true WHERE id = uid;
 END IF;
 RETURN NULL;
END $function$
;
CREATE TRIGGER guard_profile_approval BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_approval();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
grant select,insert,update on profiles,user_roles to authenticated;
insert into auth.users values('00000000-0000-0000-0000-000000000001','fixture@example.com',now());insert into profiles(id,name,email,user_type,referral_code) values('00000000-0000-0000-0000-000000000001','Fixture','fixture@example.com','founder','fixture-code');