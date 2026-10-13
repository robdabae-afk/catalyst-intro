begin;
-- Default off until both edge adapters and the new client are deployed.
create table public.billing_rollout_flags(id boolean primary key default true check(id), enforce_v2 boolean not null default false);
insert into public.billing_rollout_flags values(true,false);
revoke all on public.billing_rollout_flags from public,anon,authenticated;
grant select,update on public.billing_rollout_flags to service_role;
create function public.billing_enforced() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select coalesce((select enforce_v2 from billing_rollout_flags where id),false) $$;
create table public.billing_entitlements (
 user_id uuid not null references auth.users(id) on delete cascade, provider text not null check(provider in ('stripe','apple','google','revenuecat')),
 external_id text not null, status text not null, expires_at timestamptz, period_key text,
 billing_interval text not null default 'month' check(billing_interval in ('month','year')), credit_anchor timestamptz, updated_at timestamptz default now(),
 primary key(user_id,provider), unique(provider,external_id)
);
create table public.billing_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade, credits integer not null default 0 check(credits>=0), boost_used_at timestamptz, boost_until timestamptz
);
create table public.billing_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 sku text not null check(sku in ('pro','concierge_one','concierge_two','messages_three','messages_six')), amount integer not null check(amount>0),
 currency text not null default 'usd' check(currency='usd'), stripe_session_id text unique,
 status text not null default 'pending' check(status in ('pending','paid','refunded','expired')), created_at timestamptz not null default now()
);
create unique index billing_one_pending_pro on public.billing_orders(user_id) where sku='pro' and status='pending';
create table public.billing_events (provider text not null,event_id text not null,created_at timestamptz default now(),primary key(provider,event_id));
create table public.billing_credit_grants (user_id uuid references auth.users(id) on delete cascade,grant_key text not null,primary key(user_id,grant_key));
create table public.concierge_jobs (
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.billing_orders(id),user_id uuid not null references auth.users(id) on delete cascade,
 match_count integer not null check(match_count in (1,2)),status text not null default 'queued' check(status in ('queued','fulfilled')),
 fulfilled_profiles uuid[],note text,fulfilled_by uuid references auth.users(id),fulfilled_at timestamptz,created_at timestamptz not null default now()
);
create table public.billing_swipe_usage (
 user_id uuid not null references auth.users(id) on delete cascade,day date not null,kind text not null check(kind in ('person','company')),target text not null,primary key(user_id,day,kind,target)
);
create table public.billing_instant_sends (
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,receiver_id uuid not null references auth.users(id) on delete cascade,message_id uuid not null,primary key(user_id,request_id)
);
create table public.billing_profile_views (
 viewer_id uuid not null references auth.users(id) on delete cascade,profile_id uuid not null references auth.users(id) on delete cascade,day date not null,primary key(viewer_id,profile_id,day)
);
do $$ declare t text; begin foreach t in array array['billing_entitlements','billing_wallets','billing_orders','billing_events','billing_credit_grants','concierge_jobs','billing_swipe_usage','billing_instant_sends','billing_profile_views'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop; end $$;
grant select on public.billing_orders,public.concierge_jobs to authenticated;
create policy own_orders on public.billing_orders for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy concierge_queue on public.concierge_jobs for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create function public.billing_is_pro(p_user uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from billing_entitlements where user_id=p_user and status in ('active','trialing') and expires_at>now()) or exists(select 1 from profiles where id=p_user and subscription_status='active' and subscription_expires_at>now())
$$;
create function public.billing_my_pro() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select billing_is_pro(auth.uid()) $$;
-- Annual payments retain the monthly credit benefit. Accrue earned months lazily,
-- under the same per-member transaction lock; never grant all 12 up front.
create function public.billing_accrue_annual(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare e billing_entitlements; i integer; due timestamptz; k text; begin
 if p_user is null then return; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,871));
 select * into e from billing_entitlements where user_id=p_user and provider='stripe' and billing_interval='year' and status='active' and expires_at>now() and credit_anchor is not null;
 if not found then return; end if;
 for i in 0..11 loop
 due:=((e.credit_anchor at time zone 'UTC')+make_interval(months=>i)) at time zone 'UTC';
 if due>now() or due>=e.expires_at then exit; end if;
 k:='stripe:'||e.external_id||':'||e.period_key||case when i=0 then '' else ':month-'||i::text end;
 insert into billing_credit_grants values(p_user,k) on conflict do nothing;
 if found then insert into billing_wallets(user_id,credits) values(p_user,1) on conflict(user_id) do update set credits=billing_wallets.credits+1; end if;
 end loop;
 end $$;
create function public.billing_snapshot() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 perform billing_accrue_annual(auth.uid());
 return jsonb_build_object('isPro',billing_is_pro(auth.uid()),'role',(select user_type from profiles where id=auth.uid()),'credits',coalesce((select credits from billing_wallets where user_id=auth.uid()),0)+coalesce((select greatest(tokens,0)/30 from profiles where id=auth.uid()),0),
 'tokenRemainder',coalesce((select greatest(tokens,0)%30 from profiles where id=auth.uid()),0),
 'hasStripeSubscription',exists(select 1 from billing_entitlements where user_id=auth.uid() and provider='stripe') or exists(select 1 from profiles where id=auth.uid() and stripe_customer_id is not null),
 'expiresAt',greatest((select max(expires_at) from billing_entitlements where user_id=auth.uid() and status in ('active','trialing')), (select subscription_expires_at from profiles where id=auth.uid() and subscription_status='active')),
 'remaining',greatest(0,5-(select count(*) from billing_swipe_usage where user_id=auth.uid() and day=(now() at time zone 'UTC')::date)),
 'resetsAt',(((now() at time zone 'UTC')::date+1)::timestamp at time zone 'UTC'),
 'canBoost',billing_is_pro(auth.uid()) and not exists(select 1 from billing_wallets where user_id=auth.uid() and boost_used_at>now()-interval '7 days'),
 'views',case when billing_is_pro(auth.uid()) then (select count(*) from billing_profile_views where profile_id=auth.uid() and day>=((now() at time zone 'UTC')::date-30)) else null end);
 end $$;
create function public.billing_charge_swipe(p_user uuid,p_kind text,p_target text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare d date:=(now() at time zone 'UTC')::date; begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,871));
 if exists(select 1 from billing_swipe_usage where user_id=p_user and day=d and kind=p_kind and target=p_target) then return; end if;
 if billing_enforced() and not billing_is_pro(p_user) and (select count(*) from billing_swipe_usage where user_id=p_user and day=d)>=5 then raise exception 'DAILY_SWIPE_LIMIT'; end if;
 insert into billing_swipe_usage values(p_user,d,p_kind,p_target);
 end $$;
create function public.billing_swipe_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 if new.action='like' then
 if auth.uid() is not null and new.swiper_id<>auth.uid() then raise exception 'Not your swipe'; end if;
 if not public.is_approved(new.swiper_id) or not exists(select 1 from profiles where id=new.swiped_id and (public.has_role(new.swiper_id,'admin') or (approved and not coalesce(is_hidden,false) and not coalesce(is_test_account,false) and not coalesce(is_flagged,false)))) then raise exception 'Profile unavailable'; end if;
 perform billing_charge_swipe(new.swiper_id,'person',new.swiped_id::text);
 end if;
 if tg_op='INSERT' then new.created_at:=now(); elsif new.action is distinct from old.action then new.created_at:=now(); end if;
 return new; end $$;
create trigger billing_swipe_guard before insert or update on public.swipes for each row execute function public.billing_swipe_guard();
create function public.billing_company_swipe_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 if new.kind='save' then
 if auth.uid() is not null and new.user_id<>auth.uid() then raise exception 'Not your swipe'; end if;
 if not public.is_approved(new.user_id) or not exists(select 1 from app_companies c join profiles p on p.id=c.owner_id where c.id=new.item_id and (public.has_role(new.user_id,'admin') or (c.status='published' and p.approved and not coalesce(p.is_hidden,false) and not coalesce(p.is_test_account,false) and not coalesce(p.is_flagged,false)))) then raise exception 'Company unavailable'; end if;
 perform billing_charge_swipe(new.user_id,'company',new.item_id);
 end if; return new; end $$;
create trigger billing_company_swipe_guard before insert or update on public.app_item_state for each row execute function public.billing_company_swipe_guard();
create policy billing_incoming_likes on public.swipes as restrictive for select to authenticated using(not public.billing_enforced() or swiper_id=auth.uid() or public.has_role(auth.uid(),'admin') or (swiped_id=auth.uid() and billing_my_pro()));
create function public.billing_like(p_target uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid:=auth.uid(); mutual boolean; begin
 if u is null or u=p_target then raise exception 'Invalid target'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,871));
 perform pg_advisory_xact_lock(hashtextextended(least(u,p_target)::text||greatest(u,p_target)::text,872));
 insert into swipes(swiper_id,swiped_id,action) values(u,p_target,'like') on conflict(swiper_id,swiped_id) do update set action='like';
 select exists(select 1 from swipes where swiper_id=p_target and swiped_id=u and action='like') into mutual;
 if mutual and not exists(select 1 from matches where least(user_1_id,user_2_id)=least(u,p_target) and greatest(user_1_id,user_2_id)=greatest(u,p_target) and status='unmatched') then insert into matches(user_1_id,user_2_id,status) select least(u,p_target),greatest(u,p_target),'active' where not exists(select 1 from matches where least(user_1_id,user_2_id)=least(u,p_target) and greatest(user_1_id,user_2_id)=greatest(u,p_target)) on conflict(user_1_id,user_2_id) do nothing; end if;
 return jsonb_build_object('matched',mutual); end $$;
create function public.billing_use_boost() returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid:=auth.uid(); begin
 if u is null or not billing_is_pro(u) or not public.is_approved(u) then raise exception 'Pro and profile approval required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,871));
 insert into billing_wallets(user_id) values(u) on conflict do nothing;
 if exists(select 1 from billing_wallets where user_id=u and boost_used_at>now()-interval '7 days') then raise exception 'Your next boost is available seven days after your last one'; end if;
 update billing_wallets set boost_used_at=now(),boost_until=now()+interval '24 hours' where user_id=u;
 end $$;
create function public.billing_boosted_profiles() returns setof uuid language sql stable security definer set search_path=public,pg_temp as $$
 select w.user_id from billing_wallets w join profiles p on p.id=w.user_id where public.is_approved(auth.uid()) and w.boost_until>now() and billing_is_pro(w.user_id) and p.approved and not coalesce(p.is_hidden,false) and not coalesce(p.is_flagged,false) and not coalesce(p.is_test_account,false)
$$;
create function public.billing_record_view(p_target uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 if auth.uid() is null or auth.uid()=p_target or not public.is_approved(auth.uid()) or not exists(select 1 from profiles where id=p_target and approved and not coalesce(is_hidden,false) and not coalesce(is_test_account,false) and not coalesce(is_flagged,false)) then return; end if;
 insert into billing_profile_views values(auth.uid(),p_target,(now() at time zone 'UTC')::date) on conflict do nothing;
 end $$;
create function public.billing_spend_message(p_user uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,871));
 -- Lock profiles first across all legacy/new debits. Never migrate/copy the balance.
 perform 1 from profiles where id=p_user for update;
 update billing_wallets set credits=credits-1 where user_id=p_user and credits>0;
 if found then return; end if;
 insert into token_transactions(user_id,transaction_type,amount,product_type,description)
 select p_user,'spend',30,'instant_message','Shared wallet instant message' from profiles where id=p_user and tokens>=30;
 if not found then raise exception 'NO_MESSAGE_CREDITS'; end if;
 end $$;
create function public.billing_send_instant(p_target uuid,p_content text,p_request uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare u uuid:=auth.uid(); m uuid; begin
 if u is null or u=p_target or p_request is null or length(btrim(p_content)) not between 1 and 4000 then raise exception 'Invalid message'; end if;
 if not public.is_approved(u) or not exists(select 1 from profiles where id=p_target and approved and not coalesce(is_hidden,false) and not coalesce(is_test_account,false) and not coalesce(is_flagged,false)) then raise exception 'Profile unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,871));
 perform billing_accrue_annual(u);
 select message_id into m from billing_instant_sends where user_id=u and request_id=p_request;
 if m is not null then return m; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(u,p_target)::text||greatest(u,p_target)::text,872));
 if exists(select 1 from matches where least(user_1_id,user_2_id)=least(u,p_target) and greatest(user_1_id,user_2_id)=greatest(u,p_target) and status='unmatched') then raise exception 'This connection was closed'; end if;
 perform billing_spend_message(u);
 insert into matches(user_1_id,user_2_id,status) select least(u,p_target),greatest(u,p_target),'active' where not exists(select 1 from matches where least(user_1_id,user_2_id)=least(u,p_target) and greatest(user_1_id,user_2_id)=greatest(u,p_target)) on conflict(user_1_id,user_2_id) do nothing;
 insert into messages(sender_id,receiver_id,content) values(u,p_target,btrim(p_content)) returning id into m;
 insert into billing_instant_sends values(u,p_request,p_target,m);
 return m; end $$;
create function public.billing_fulfill_concierge(p_job uuid,p_targets uuid[],p_note text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare j concierge_jobs; t uuid; begin
 if not public.has_role(auth.uid(),'admin') then raise exception 'Admin required'; end if;
 select * into j from concierge_jobs where id=p_job for update;
 if not found or j.status<>'queued' then raise exception 'Job unavailable'; end if;
 if p_targets is null or cardinality(p_targets)<>j.match_count or (select count(distinct x) from unnest(p_targets) x)<>j.match_count then raise exception 'Choose the purchased number of distinct profiles'; end if;
 foreach t in array p_targets loop
 if t=j.user_id or not exists(select 1 from profiles where id=t and approved and not coalesce(is_hidden,false) and not coalesce(is_flagged,false) and not coalesce(is_test_account,false)) then raise exception 'Profile unavailable'; end if;
 if j.match_count=1 and not exists(select 1 from profiles where id=t and user_type='investor') then raise exception 'Single match must be an investor'; end if;
 perform pg_advisory_xact_lock(hashtextextended(least(t,j.user_id)::text||greatest(t,j.user_id)::text,872));
 if exists(select 1 from matches where least(user_1_id,user_2_id)=least(t,j.user_id) and greatest(user_1_id,user_2_id)=greatest(t,j.user_id) and status='unmatched') then raise exception 'Connection previously closed'; end if;
 insert into matches(user_1_id,user_2_id,status) select least(t,j.user_id),greatest(t,j.user_id),'active' where not exists(select 1 from matches where least(user_1_id,user_2_id)=least(t,j.user_id) and greatest(user_1_id,user_2_id)=greatest(t,j.user_id)) on conflict(user_1_id,user_2_id) do nothing;
 end loop;
 update concierge_jobs set status='fulfilled',fulfilled_profiles=p_targets,note=left(p_note,2000),fulfilled_by=auth.uid(),fulfilled_at=now() where id=p_job;
 end $$;
create function public.billing_apply_purchase(p_event text,p_order uuid,p_session text,p_amount integer,p_currency text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare o billing_orders; n integer; begin
 insert into billing_events values('stripe',p_event,now()) on conflict do nothing; if not found then return; end if;
 select * into o from billing_orders where id=p_order for update;
 if not found or o.stripe_session_id is distinct from p_session or o.amount<>p_amount or o.currency<>p_currency or o.sku='pro' then raise exception 'Payment does not match order'; end if;
 if o.status='paid' then return; end if;
 if o.status<>'pending' then raise exception 'Order not payable'; end if;
 update billing_orders set status='paid' where id=p_order;
 if o.sku in ('messages_three','messages_six') then
 n:=case o.sku when 'messages_three' then 3 else 6 end;
 insert into billing_wallets(user_id,credits) values(o.user_id,n) on conflict(user_id) do update set credits=billing_wallets.credits+excluded.credits;
 else
 insert into concierge_jobs(order_id,user_id,match_count) values(o.id,o.user_id,case o.sku when 'concierge_one' then 1 else 2 end);
 end if; end $$;
create function public.billing_sync_subscription(p_event text,p_user uuid,p_subscription text,p_status text,p_expires timestamptz,p_period text,p_interval text default 'month',p_start timestamptz default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,871));
 insert into billing_events values('stripe',p_event,now()) on conflict do nothing; if not found then return; end if;
 if p_interval not in ('month','year') or (p_interval='year' and p_period is not null and p_start is null) then raise exception 'Invalid billing interval or annual anchor'; end if;
 insert into billing_entitlements(user_id,provider,external_id,status,expires_at,period_key,billing_interval,credit_anchor) values(p_user,'stripe',p_subscription,p_status,p_expires,p_period,p_interval,case when p_period is not null then p_start end)
 on conflict(user_id,provider) do update set external_id=excluded.external_id,status=excluded.status,expires_at=excluded.expires_at,period_key=case when excluded.external_id=billing_entitlements.external_id then coalesce(excluded.period_key,billing_entitlements.period_key) else excluded.period_key end,billing_interval=excluded.billing_interval,
 credit_anchor=case when excluded.period_key is not null then excluded.credit_anchor when excluded.external_id=billing_entitlements.external_id then billing_entitlements.credit_anchor else null end,updated_at=now();
 if p_interval='year' then perform billing_accrue_annual(p_user); return; end if;
 if p_status='active' and p_expires>now() and p_period is not null then
 insert into billing_credit_grants values(p_user,'stripe:'||p_subscription||':'||p_period) on conflict do nothing;
 if found then insert into billing_wallets(user_id,credits) values(p_user,1) on conflict(user_id) do update set credits=billing_wallets.credits+1; end if;
 end if; end $$;
do $$ declare r record; begin for r in select p.oid::regprocedure sig,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'billing_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',r.sig);
 if r.proname in ('billing_enforced','billing_snapshot','billing_my_pro','billing_like','billing_use_boost','billing_boosted_profiles','billing_record_view','billing_send_instant','billing_fulfill_concierge') then execute format('grant execute on function %s to authenticated',r.sig); end if;
 if r.proname in ('billing_apply_purchase','billing_sync_subscription','billing_is_pro') then execute format('grant execute on function %s to service_role',r.sig); end if;
 end loop; end $$;
-- Protect both ledger minting and direct profile balance edits, regardless of rollout flag.
create policy billing_token_ledger_insert on public.token_transactions as restrictive for insert to authenticated with check(public.has_role(auth.uid(),'admin'));
create policy billing_token_ledger_update on public.token_transactions as restrictive for update to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy billing_token_ledger_delete on public.token_transactions as restrictive for delete to authenticated using(public.has_role(auth.uid(),'admin'));
-- Invoker trigger: trusted SECURITY DEFINER ledger/RPC updates run as their owner.
-- Ordinary direct profile writes still run as authenticated and cannot mint tokens.
create function public.billing_profile_balance_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$
 begin
 if current_user in ('anon','authenticated') and not public.has_role(auth.uid(),'admin') then
  if (tg_op='INSERT' and coalesce(new.tokens,0)<>0) or (tg_op='UPDATE' and new.tokens is distinct from old.tokens) then raise exception 'Token balances are server managed' using errcode='42501'; end if;
 end if;
 return new;
 end $$;
create trigger billing_profile_balance_guard before insert or update on public.profiles for each row execute function public.billing_profile_balance_guard();
revoke all on function public.billing_profile_balance_guard() from public,anon,authenticated;
-- Legacy token transaction writers share the same locked profile balance.
-- Old service-role workers cannot overspend a stale balance.
create or replace function public.update_token_balance() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 if new.transaction_type='spend' then
  update profiles set tokens=coalesce(tokens,0)-abs(new.amount) where id=new.user_id and coalesce(tokens,0)>=abs(new.amount);
  if not found then raise exception 'NO_MESSAGE_CREDITS'; end if;
 elsif new.transaction_type in ('purchase','grant','refund') then
  update profiles set tokens=coalesce(tokens,0)+new.amount where id=new.user_id;
 end if;
 return new;
 end $$;
create function public.billing_legacy_instant(p_user uuid,p_target uuid,p_content text,p_request uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
 declare m uuid; begin
 if p_user is null or p_user=p_target or p_request is null or length(btrim(p_content)) not between 1 and 4000 then raise exception 'Invalid message'; end if;
 if not public.is_approved(p_user) or not exists(select 1 from profiles where id=p_target and approved and not coalesce(is_hidden,false) and not coalesce(is_test_account,false) and not coalesce(is_flagged,false)) then raise exception 'Profile unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,871));
 perform billing_accrue_annual(p_user);
 select message_id into m from billing_instant_sends where user_id=p_user and request_id=p_request;
 if m is not null then return jsonb_build_object('success',true,'messageId',m,'tokensSpent',30,'newBalance',(select tokens from profiles where id=p_user)); end if;
 if exists(select 1 from matches where least(user_1_id,user_2_id)=least(p_user,p_target) and greatest(user_1_id,user_2_id)=greatest(p_user,p_target) and status='unmatched') then raise exception 'This connection was closed'; end if;
 perform billing_spend_message(p_user);
 insert into instant_messages(sender_id,receiver_id,content,tokens_spent) values(p_user,p_target,btrim(p_content),30) returning id into m;
 insert into billing_instant_sends values(p_user,p_request,p_target,m);
 return jsonb_build_object('success',true,'messageId',m,'tokensSpent',30,'newBalance',(select tokens from profiles where id=p_user));
 end $$;
revoke all on function public.billing_legacy_instant(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.billing_legacy_instant(uuid,uuid,text,uuid) to service_role;
revoke all on function public.update_token_balance() from public,anon,authenticated;
-- Do not let clients create free instant connections or send unsolicited messages.
create policy billing_match_insert on public.matches as restrictive for insert to authenticated with check(
 not public.billing_enforced() or public.has_role(auth.uid(),'admin') or (
 exists(select 1 from swipes where swiper_id=user_1_id and swiped_id=user_2_id and action='like')
 and exists(select 1 from swipes where swiper_id=user_2_id and swiped_id=user_1_id and action='like')));
create policy billing_message_send on public.messages as restrictive for insert to authenticated with check(
 not public.billing_enforced() or (sender_id=auth.uid() and exists(select 1 from matches where least(user_1_id,user_2_id)=least(sender_id,receiver_id) and greatest(user_1_id,user_2_id)=greatest(sender_id,receiver_id) and status in ('active','successful_collaboration'))));
create function public.billing_match_update_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$
 begin
 if public.billing_enforced() and auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
 if new.user_1_id<>old.user_1_id or new.user_2_id<>old.user_2_id or (old.status='unmatched' and new.status<>'unmatched') then raise exception 'Connection cannot be changed or reopened'; end if;
 end if; return new; end $$;
create trigger billing_match_update_guard before update on public.matches for each row execute function public.billing_match_update_guard();
revoke all on function public.billing_match_update_guard() from public,anon,authenticated;
create function public.billing_match_pair_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 begin
 perform pg_advisory_xact_lock(hashtextextended(least(new.user_1_id,new.user_2_id)::text||greatest(new.user_1_id,new.user_2_id)::text,872));
 if exists(select 1 from matches where least(user_1_id,user_2_id)=least(new.user_1_id,new.user_2_id) and greatest(user_1_id,user_2_id)=greatest(new.user_1_id,new.user_2_id)) then return null; end if;
 return new;
 end $$;
create trigger billing_match_pair_guard before insert on public.matches for each row execute function public.billing_match_pair_guard();
revoke all on function public.billing_match_pair_guard() from public,anon,authenticated;
commit;
