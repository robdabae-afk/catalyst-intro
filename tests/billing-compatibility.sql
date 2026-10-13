\set ON_ERROR_STOP on
-- Flag remains off before client/edge publish; cached clients retain reciprocal reads.
update billing_rollout_flags set enforce_v2=false;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000070';
update profiles set subscription_status='active',subscription_expires_at=now()+interval '1 month',tokens=65,stripe_customer_id='cus_legacy' where id=auth.uid();
select assert_true(billing_is_pro(auth.uid()),'Legacy active Pro recognized');
select assert_true((billing_snapshot()->>'credits')::int=2,'65 legacy tokens buy 2 messages, not 65');
select assert_true((billing_snapshot()->>'tokenRemainder')::int=5,'5 remainder preserved');
insert into matches(user_1_id,user_2_id,status) values('00000000-0000-0000-0000-000000000071',auth.uid(),'active');
select billing_send_instant('00000000-0000-0000-0000-000000000071','Hi','00000000-0000-0000-0000-000000000072');
select assert_true((select tokens=35 from profiles where id=auth.uid()),'New RPC spends exactly 30 tokens');
select assert_true((select count(*)=1 from matches where user_1_id=auth.uid() or user_2_id=auth.uid()),'Reverse match not duplicated');
select billing_legacy_instant(auth.uid(),'00000000-0000-0000-0000-000000000073','Hi','00000000-0000-0000-0000-000000000074');
select billing_legacy_instant(auth.uid(),'00000000-0000-0000-0000-000000000073','Hi','00000000-0000-0000-0000-000000000074');
select assert_true((select tokens=5 from profiles where id=auth.uid()),'Legacy retry cannot double spend');
do $$begin perform billing_spend_message(auth.uid());raise exception 'Remainder spent';exception when others then if sqlerrm<>'NO_MESSAGE_CREDITS' then raise;end if;end$$;
do $$begin insert into token_transactions(user_id,transaction_type,amount) values(auth.uid(),'spend',30);raise exception 'Old writer overspent';exception when others then if sqlerrm<>'NO_MESSAGE_CREDITS' then raise;end if;end$$;
insert into billing_wallets(user_id,credits) values(auth.uid(),1);
select billing_spend_message(auth.uid());
select assert_true((select tokens=5 from profiles where id=auth.uid()),'V2 credit does not consume remainder');
select assert_true((select credits=0 from billing_wallets where user_id=auth.uid()),'Wallet credit consumed once');
update billing_rollout_flags set enforce_v2=true;
set role authenticated;
insert into messages(sender_id,receiver_id,content) values(auth.uid(),'00000000-0000-0000-0000-000000000071','Reverse match works');
reset role;
select 'billing compatibility assertions passed';
