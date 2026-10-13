-- Minimal local schema contract, deliberately not a production migration.
do $$begin create role anon; exception when duplicate_object then null; end$$;
do $$begin create role authenticated; exception when duplicate_object then null; end$$;
do $$begin create role service_role bypassrls; exception when duplicate_object then null; end$$;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to authenticated,service_role;
create function auth.role() returns text language sql stable as $$select current_user::text$$;
create table profiles(id uuid primary key references auth.users,name text,user_type text,approved boolean default true,is_hidden boolean default false,is_test_account boolean default false,is_flagged boolean default false,rejection_reason text);
create function has_role(u uuid,r text) returns boolean language sql stable as $$select u='00000000-0000-0000-0000-000000000099'::uuid and r='admin'$$;
create function is_approved(u uuid) returns boolean language sql stable as $$select coalesce((select approved and not is_flagged from profiles where id=u),false)$$;
create table swipes(id uuid primary key default gen_random_uuid(),swiper_id uuid references auth.users,swiped_id uuid references auth.users,action text,pass_reason text,created_at timestamptz default now(),unique(swiper_id,swiped_id));
create table matches(id uuid primary key default gen_random_uuid(),user_1_id uuid references auth.users,user_2_id uuid references auth.users,status text default 'active',unique(user_1_id,user_2_id));
create table messages(id uuid primary key default gen_random_uuid(),sender_id uuid references auth.users,receiver_id uuid references auth.users,content text,read boolean default false);
create table app_companies(id text primary key,owner_id uuid references profiles,status text);
create table app_item_state(user_id uuid references auth.users,kind text,item_id text,primary key(user_id,kind,item_id));
alter table swipes enable row level security;alter table matches enable row level security;alter table messages enable row level security;
create policy read_swipes on swipes for select to authenticated using(swiper_id=auth.uid() or swiped_id=auth.uid());
create policy write_swipes on swipes for insert to authenticated with check(swiper_id=auth.uid());
create policy change_swipes on swipes for update to authenticated using(swiper_id=auth.uid());
create policy read_matches on matches for select to authenticated using(user_1_id=auth.uid() or user_2_id=auth.uid());
create policy create_matches on matches for insert to authenticated with check(user_1_id=auth.uid() or user_2_id=auth.uid());
create policy change_matches on matches for update to authenticated using(user_1_id=auth.uid() or user_2_id=auth.uid());
create policy create_messages on messages for insert to authenticated with check(sender_id=auth.uid());
grant select,insert,update on swipes,matches,messages,app_item_state to authenticated;
grant select on profiles,app_companies to authenticated;
insert into auth.users select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,100) i;
insert into profiles(id,name,user_type,approved,is_hidden,is_test_account,is_flagged) select id,'Member','investor',true,false,false,false from auth.users;
insert into app_companies values('company-one','00000000-0000-0000-0000-000000000002','published');

alter table profiles add column tokens integer not null default 0, add column subscription_status text, add column subscription_expires_at timestamptz, add column stripe_customer_id text;
create table token_transactions(id uuid primary key default gen_random_uuid(),user_id uuid,transaction_type text,amount integer,product_type text,description text);
create function update_token_balance() returns trigger language plpgsql security definer as $$ begin
 update profiles set tokens=tokens+case when new.transaction_type='spend' then -abs(new.amount) else new.amount end where id=new.user_id;
 return new; end $$;
create trigger update_token_balance_trigger after insert on token_transactions for each row execute function update_token_balance();
create table instant_messages(id uuid primary key default gen_random_uuid(),sender_id uuid,receiver_id uuid,content text,tokens_spent integer,read boolean default false,read_at timestamptz);

alter table token_transactions enable row level security;
create policy legacy_ledger_own_insert on token_transactions for insert to authenticated with check(user_id=auth.uid());
grant insert,select,update,delete on token_transactions to authenticated;
grant update on profiles to authenticated;
