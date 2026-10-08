-- Disposable local PostgreSQL only, after both approval migrations + admin browse migration.
CREATE OR REPLACE FUNCTION public.test_assert(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERT: %',msg; END IF; END $$;
-- Real pending targets plus hidden/test targets; no profiles become approved here.
INSERT INTO profiles(id,name,user_type,is_hidden,is_test_account) VALUES
 ('20000000-0000-0000-0000-000000000001','Pending founder','founder',false,false),
 ('20000000-0000-0000-0000-000000000002','Hidden investor','investor',true,true);
INSERT INTO founder_profiles VALUES ('20000000-0000-0000-0000-000000000001','Pending company');
INSERT INTO investor_profiles VALUES ('20000000-0000-0000-0000-000000000002','Hidden thesis');
INSERT INTO app_companies(id,owner_id,status,data,sort) VALUES ('pending-co','20000000-0000-0000-0000-000000000001','pending','{}',1);
-- Restore explicit admin-reviewed members for ordinary-read tests.
UPDATE profiles SET approved=true WHERE id IN ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004');
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_self_read ON user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',false);
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
SELECT test_assert(browse_is_admin(),'actual admin recognized');
SELECT test_assert((SELECT count(*) FROM profiles WHERE id::text LIKE '20000000%')=2,'admin sees pending and hidden/test both roles');
SELECT test_assert((SELECT count(*) FROM founder_profiles WHERE profile_id::text LIKE '20000000%')=1,'admin sees pending founder detail');
SELECT test_assert((SELECT count(*) FROM investor_profiles WHERE profile_id::text LIKE '20000000%')=1,'admin sees hidden investor detail');
SELECT test_assert((SELECT count(*) FROM app_companies WHERE id='pending-co')=1,'admin sees pending company');
SELECT test_assert(NOT (SELECT approved FROM profiles WHERE id='20000000-0000-0000-0000-000000000001'),'browsing does not approve target');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
SELECT test_assert(NOT browse_is_admin(),'ordinary member not admin');
SELECT test_assert((SELECT count(*) FROM profiles WHERE id::text LIKE '20000000%')=0,'ordinary member cannot see pending or hidden/test');
SELECT test_assert((SELECT count(*) FROM app_companies WHERE id='pending-co')=0,'ordinary member cannot see pending company');
SELECT set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
SELECT test_assert(NOT is_approved(auth.uid()),'pending remains denied');
SELECT test_assert((SELECT count(*) FROM profiles)=1,'pending sees self only');
DO $$ BEGIN
 BEGIN INSERT INTO user_roles VALUES(auth.uid(),'admin'); RAISE EXCEPTION 'self-escalation allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
