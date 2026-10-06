-- Run against disposable LOCAL Supabase/Postgres as database owner, after only the new migration.
-- Every fixture rolls back. Never run on production. psql -v ON_ERROR_STOP=1 -f tests/platform-rls.sql
BEGIN;
CREATE FUNCTION pg_temp.assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERT: %',msg; END IF; END $$;
CREATE FUNCTION pg_temp.denied(stmt text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE stmt; EXCEPTION WHEN insufficient_privilege OR check_violation THEN RETURN; END;
 RAISE EXCEPTION 'Statement unexpectedly permitted: %',stmt;
END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-000000000001','admin-platform@example.test','{}'),
 ('00000000-0000-0000-0000-000000000002','member-platform@example.test','{"role":"admin","name":"Member"}'),
 ('00000000-0000-0000-0000-000000000003','other-platform@example.test','{}');
INSERT INTO public.platform_profiles(id,email,name,role) VALUES
 ('00000000-0000-0000-0000-000000000001','admin-platform@example.test','Admin','admin'),
 ('00000000-0000-0000-0000-000000000003','other-platform@example.test','Other','user');
UPDATE public.platform_settings SET require_approval=false;
INSERT INTO public.platform_events(id,title,starts_at,capacity,status) VALUES
 ('10000000-0000-0000-0000-000000000001','Public',now()+interval '1 day',1,'published'),
 ('10000000-0000-0000-0000-000000000002','Secret',now()+interval '1 day',1,'draft');
INSERT INTO public.platform_deals(id,slug,name,status) VALUES
 ('20000000-0000-0000-0000-000000000001','sample','Preview','preview'),
 ('20000000-0000-0000-0000-000000000002','secret','Secret','draft');
INSERT INTO public.platform_threads(id,kind,title) VALUES('30000000-0000-0000-0000-000000000001','dm','Private');
INSERT INTO public.platform_thread_members(thread_id,user_id) VALUES('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003');
INSERT INTO public.platform_notifications(id,user_id,kind,title,body) VALUES
 ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','announcement','Private','Secret');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT public.platform_ensure_profile();
SELECT pg_temp.assert((SELECT role='user' FROM public.platform_profiles WHERE id=auth.uid()),'metadata cannot elevate role');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_profiles),'other profiles hidden');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_events),'draft event hidden');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_deals),'draft deal hidden');
SELECT pg_temp.assert((SELECT count(*)=0 FROM public.platform_threads),'private thread hidden');
SELECT pg_temp.assert((SELECT count(*)=0 FROM public.platform_notifications),'private notifications hidden');
SELECT pg_temp.denied($q$UPDATE public.platform_profiles SET role='admin' WHERE id=auth.uid()$q$);
SELECT pg_temp.denied($q$UPDATE public.platform_profiles SET email='forged@example.test' WHERE id=auth.uid()$q$);
SELECT pg_temp.denied($q$SELECT public.platform_set_role(auth.uid(),'admin')$q$);
SELECT pg_temp.denied($q$INSERT INTO public.platform_event_rsvps(event_id,user_id,status) VALUES('10000000-0000-0000-0000-000000000001',auth.uid(),'approved')$q$);
SELECT pg_temp.denied($q$INSERT INTO public.platform_deal_questions(deal_id,user_id,body,answer,hidden) VALUES('20000000-0000-0000-0000-000000000001',auth.uid(),'question','forged',true)$q$);
SELECT pg_temp.denied($q$INSERT INTO public.platform_messages(thread_id,user_id,body) VALUES('30000000-0000-0000-0000-000000000001',auth.uid(),'not a member')$q$);
SELECT pg_temp.denied($q$UPDATE public.platform_notifications SET title='forged'$q$);
SELECT pg_temp.denied($q$SELECT public.platform_announce('bad','bad','"all"')$q$);
SELECT pg_temp.denied($q$SELECT public.platform_waitlist()$q$);
UPDATE public.platform_profiles SET name='Safe',bio='Safe' WHERE id=auth.uid();
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001')).status='approved','first seat approved');
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001')).status='approved','repeat RSVP idempotent');
INSERT INTO public.platform_deal_questions(deal_id,body) VALUES('20000000-0000-0000-0000-000000000001','Question');
INSERT INTO public.platform_saved_deals(deal_id) VALUES('20000000-0000-0000-0000-000000000001');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001')).status='waitlisted','capacity cannot overflow');
INSERT INTO public.platform_messages(thread_id,body) VALUES('30000000-0000-0000-0000-000000000001','Allowed');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT pg_temp.denied($q$SELECT public.platform_set_role(auth.uid(),'user')$q$);
SELECT pg_temp.denied($q$SELECT public.platform_admin_rsvp((SELECT id FROM public.platform_event_rsvps WHERE user_id='00000000-0000-0000-0000-000000000003'),'approved')$q$);
SELECT public.platform_admin_rsvp((SELECT id FROM public.platform_event_rsvps WHERE user_id='00000000-0000-0000-0000-000000000002'),NULL,true);
SELECT public.platform_announce('Admin notice','Private admin body','"admins"');
SELECT pg_temp.assert((public.platform_waitlist())->>'total'='0','admin waitlist read works');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_member_names(ARRAY['00000000-0000-0000-0000-000000000002'::uuid])),'admin resolves display name');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_notifications WHERE title='Admin notice'),'admin audience scoped');
SELECT public.platform_announce('Event notice','Event body','{"eventId":"10000000-0000-0000-0000-000000000001"}');
SELECT pg_temp.assert((SELECT count(*)=2 FROM public.platform_notifications WHERE title='Event notice'),'event audience scoped');
SELECT public.platform_set_role('00000000-0000-0000-0000-000000000003','admin');
SELECT public.platform_set_role('00000000-0000-0000-0000-000000000003','user');
SELECT public.platform_moderate_question((SELECT id FROM public.platform_deal_questions LIMIT 1),'Answer',false);
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_notifications WHERE kind='answer'),'answer notification generated');
SELECT public.platform_moderate_question((SELECT id FROM public.platform_deal_questions LIMIT 1),NULL,true);
SELECT pg_temp.assert((SELECT count(*)>=2 FROM public.platform_notifications WHERE kind='rsvp'),'RSVP notifications generated');
SELECT pg_temp.denied($q$UPDATE public.platform_events SET capacity=0 WHERE id='10000000-0000-0000-0000-000000000001'$q$);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT pg_temp.assert((SELECT count(*)=0 FROM public.platform_deal_questions),'hidden Q&A suppressed even for author');
SELECT pg_temp.denied($q$SELECT public.platform_rsvp('10000000-0000-0000-0000-000000000001',true)$q$);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT public.platform_admin_rsvp((SELECT id FROM public.platform_event_rsvps WHERE user_id='00000000-0000-0000-0000-000000000002'),NULL,false);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001',true)).checked_in_at IS NULL,'cancellation clears check-in');
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001',true)).status='cancelled','cancellation idempotent');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
UPDATE public.platform_settings SET require_approval=true;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
SELECT pg_temp.assert((public.platform_rsvp('10000000-0000-0000-0000-000000000001')).status='pending','approval setting honored');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
SELECT public.platform_admin_rsvp((SELECT id FROM public.platform_event_rsvps WHERE user_id='00000000-0000-0000-0000-000000000003'),'declined');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
SELECT pg_temp.denied($q$SELECT public.platform_rsvp('10000000-0000-0000-0000-000000000001')$q$);
SELECT pg_temp.denied($q$SELECT public.platform_rsvp('10000000-0000-0000-0000-000000000001',true)$q$);
INSERT INTO public.platform_thread_reads(thread_id,user_id,read_at) VALUES('30000000-0000-0000-0000-000000000001',auth.uid(),now()) ON CONFLICT(thread_id,user_id) DO UPDATE SET thread_id=excluded.thread_id,user_id=excluded.user_id,read_at=excluded.read_at;
INSERT INTO public.platform_thread_reads(thread_id,user_id,read_at) VALUES('30000000-0000-0000-0000-000000000001',auth.uid(),now()) ON CONFLICT(thread_id,user_id) DO UPDATE SET thread_id=excluded.thread_id,user_id=excluded.user_id,read_at=excluded.read_at;
RESET ROLE;
UPDATE public.platform_events SET status='cancelled' WHERE id='10000000-0000-0000-0000-000000000001';
SET LOCAL ROLE authenticated;
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_events),'attendee sees cancelled event but not unrelated draft');
RESET ROLE;
UPDATE public.platform_events SET status='published' WHERE id='10000000-0000-0000-0000-000000000001';
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_events),'anon published only');
SELECT pg_temp.assert((SELECT count(*)=1 FROM public.platform_event_counts()),'anonymous aggregate only published');
SELECT pg_temp.denied($q$SELECT * FROM public.platform_profiles$q$);
SELECT pg_temp.denied($q$SELECT * FROM public.platform_event_rsvps$q$);
SELECT pg_temp.denied($q$SELECT public.platform_ensure_profile()$q$);
RESET ROLE;
ROLLBACK;
\echo 'platform RLS regression passed (fixtures rolled back)'
