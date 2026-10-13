begin;
-- Explicit missing legacy adapter contracts, not historical migration replay.
create table if not exists public.token_transactions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 transaction_type text not null check(transaction_type in ('purchase','grant','spend','refund')),
 amount integer not null check(amount>0), product_type text, stripe_payment_intent_id text, related_id uuid,
 description text, created_at timestamptz not null default now());
create table if not exists public.instant_messages(
 id uuid primary key default gen_random_uuid(),sender_id uuid not null references auth.users(id) on delete cascade,
 receiver_id uuid not null references auth.users(id) on delete cascade,content text not null,
 tokens_spent integer not null,created_at timestamptz not null default now(),read boolean not null default false,read_at timestamptz);
alter table public.token_transactions enable row level security;
alter table public.instant_messages enable row level security;
create policy billing_token_read on token_transactions for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy billing_token_admin_write on token_transactions for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy billing_instant_read on instant_messages for select to authenticated using(sender_id=auth.uid() or receiver_id=auth.uid() or public.has_role(auth.uid(),'admin'));
grant select on token_transactions,instant_messages to authenticated;
grant insert,update,delete on token_transactions to authenticated; -- RLS restricts all writes to admins
grant all on token_transactions,instant_messages to service_role;
-- Only read-state changes are client writable, never sender/content/cost.
grant update(read,read_at) on instant_messages to authenticated;
create policy billing_instant_read_state on instant_messages for update to authenticated using(receiver_id=auth.uid()) with check(receiver_id=auth.uid());
CREATE OR REPLACE FUNCTION public.guard_profile_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
 IF auth.role() IN ('anon','authenticated') AND NOT public.has_role(auth.uid(),'admin') THEN
   IF TG_OP = 'INSERT' THEN
     IF new.approved OR coalesce((to_jsonb(new)->>'is_verified')::boolean,false) OR coalesce(new.is_flagged,false)
        OR coalesce(new.is_test_account,false) THEN
       RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
     END IF;
   ELSIF new.approved IS DISTINCT FROM old.approved
      OR (to_jsonb(new)->>'is_verified')::boolean IS DISTINCT FROM (to_jsonb(old)->>'is_verified')::boolean
      OR new.is_flagged IS DISTINCT FROM old.is_flagged
      OR new.rejection_reason IS DISTINCT FROM old.rejection_reason
      OR new.is_test_account IS DISTINCT FROM old.is_test_account THEN
     RAISE EXCEPTION 'Only admins can set review fields' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN new;
END $function$
;

-- Protect both ledger minting and direct profile balance edits, regardless of rollout flag.
create policy billing_token_ledger_insert on public.token_transactions as restrictive for insert to authenticated with check(public.has_role(auth.uid(),'admin'));
create policy billing_token_ledger_update on public.token_transactions as restrictive for update to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy billing_token_ledger_delete on public.token_transactions as restrictive for delete to authenticated using(public.has_role(auth.uid(),'admin'));
-- Invoker trigger: trusted SECURITY DEFINER ledger/RPC updates run as their owner.
-- Ordinary direct profile writes still run as authenticated and cannot mint tokens.
create function public.billing_profile_balance_guard() returns trigger language plpgsql set search_path=public,pg_temp as $$
 begin
 if current_user in ('anon','authenticated') and not public.has_role(auth.uid(),'admin') then
  if (tg_op='INSERT' and coalesce(new.tokens,0)<>0) or (tg_op='UPDATE' and new.tokens is distinct from old.tokens)
    or (tg_op='INSERT' and (new.subscription_status is not null or new.subscription_expires_at is not null or new.stripe_customer_id is not null))
    or (tg_op='UPDATE' and (new.subscription_status is distinct from old.subscription_status or new.subscription_expires_at is distinct from old.subscription_expires_at or new.stripe_customer_id is distinct from old.stripe_customer_id))
    or (tg_op='INSERT' and ((to_jsonb(new)->>'subscription_plan') is not null or (to_jsonb(new)->>'stripe_subscription_id') is not null))
    or (tg_op='UPDATE' and ((to_jsonb(new)->>'subscription_plan') is distinct from (to_jsonb(old)->>'subscription_plan') or (to_jsonb(new)->>'stripe_subscription_id') is distinct from (to_jsonb(old)->>'stripe_subscription_id')))
    then raise exception 'Token balances are server managed' using errcode='42501'; end if;
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
-- Install the balance trigger only when absent; preserve an existing same-name trigger.
do $$ begin
 if not exists(select 1 from pg_trigger where tgrelid='public.token_transactions'::regclass and tgname='update_token_balance_trigger' and not tgisinternal) then
  create trigger update_token_balance_trigger after insert on public.token_transactions for each row execute function public.update_token_balance();
 end if;
end $$;

revoke all on function public.update_token_balance() from public,anon,authenticated;
commit;
