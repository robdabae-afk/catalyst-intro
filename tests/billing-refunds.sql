begin;
insert into billing_orders(id,user_id,sku,amount,stripe_session_id,status) values
('00000000-0000-0000-0000-000000000090','00000000-0000-0000-0000-000000000070','messages_three',900,'cs_refund_fixture','paid');
insert into billing_wallets(user_id,credits) values('00000000-0000-0000-0000-000000000070',2) on conflict(user_id) do update set credits=2;
select billing_refund('evt_partial','00000000-0000-0000-0000-000000000090','cs_refund_fixture','ch_fixture',900,300,'usd');
select assert_true((select credits=1 from billing_wallets where user_id='00000000-0000-0000-0000-000000000070'),'partial revokes proportional one credit');
select billing_refund('evt_full','00000000-0000-0000-0000-000000000090','cs_refund_fixture','ch_fixture',900,900,'usd');
select billing_refund('evt_full_retry','00000000-0000-0000-0000-000000000090','cs_refund_fixture','ch_fixture',900,900,'usd');
select assert_true((select credits=0 from billing_wallets where user_id='00000000-0000-0000-0000-000000000070'),'clamped wallet');
select assert_true((select revoked_credits=2 and unrecovered_credits=1 and manual_review from billing_refund_adjustments where charge_id='ch_fixture'),'spent credit audited');
select assert_true((select status='refunded' from billing_orders where stripe_session_id='cs_refund_fixture'),'full order refunded');

insert into billing_orders(id,user_id,sku,amount,stripe_session_id,status) values('00000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000070','concierge_one',1000,'cs_concierge_refund','paid');
insert into concierge_jobs(order_id,user_id,match_count) values('00000000-0000-0000-0000-000000000091','00000000-0000-0000-0000-000000000070',1);
select billing_refund('evt_con_partial','00000000-0000-0000-0000-000000000091','cs_concierge_refund','ch_con',1000,500,'usd');
select assert_true((select status='review_hold' from concierge_jobs where order_id='00000000-0000-0000-0000-000000000091'),'partial concierge held');
select billing_refund('evt_con_full','00000000-0000-0000-0000-000000000091','cs_concierge_refund','ch_con',1000,1000,'usd');
select assert_true((select status='cancelled' from concierge_jobs where order_id='00000000-0000-0000-0000-000000000091'),'full queued cancelled');
select assert_true(exists(select 1 from billing_refund_reviews where event_id='evt_partial' and charge_id='ch_fixture' and order_id is not null),'partial durable review');
select assert_true(exists(select 1 from billing_refund_reviews where event_id='evt_con_partial'),'concierge durable review');
insert into billing_refund_reviews(event_id,charge_id,reason) values('evt_ambiguous','ch_unknown','Ambiguous payment mapping');
select assert_true(exists(select 1 from billing_refund_reviews where event_id='evt_ambiguous' and order_id is null),'unmapped durable review nullable order');
rollback;

