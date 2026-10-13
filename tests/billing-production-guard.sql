set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update profiles set name='Ordinary edit succeeds' where id=auth.uid();
do $$ begin
 if not exists(select 1 from profiles where id=auth.uid() and name='Ordinary edit succeeds') then raise exception 'No fixture row';end if;
end $$;
do $$ begin update profiles set approved=true where id=auth.uid();raise exception 'approval bypass';exception when insufficient_privilege then null;end $$;
do $$ begin update profiles set is_test_account=true where id=auth.uid();raise exception 'test bypass';exception when insufficient_privilege then null;end $$;
do $$ begin update profiles set is_flagged=true where id=auth.uid();raise exception 'flag bypass';exception when insufficient_privilege then null;end $$;
do $$ begin update profiles set rejection_reason='forged' where id=auth.uid();raise exception 'review bypass';exception when insufficient_privilege then null;end $$;
reset role;
