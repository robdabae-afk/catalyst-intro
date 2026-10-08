-- Disposable LOCAL DB only, after the original approvalGate RLS tests.
INSERT INTO public.profiles(id,approved,email,is_test_account,is_test_mode,rejection_reason) VALUES
 ('10000000-0000-0000-0000-000000000001',true,'prior-review@example.test',false,false,'Old rejection'),
 ('10000000-0000-0000-0000-000000000002',false,'flagged-test@example.test',true,false,NULL),
 ('10000000-0000-0000-0000-000000000003',true,'mode-only@example.test',false,true,NULL),
 ('10000000-0000-0000-0000-000000000004',false,'untrusted-profile@example.test',false,false,NULL),
 ('10000000-0000-0000-0000-000000000005',true,'kat@propel.earth',false,false,NULL),
 ('10000000-0000-0000-0000-000000000006',false,'test.founder@catalyst.test',false,false,NULL),
 ('10000000-0000-0000-0000-000000000007',false,'test.investor@catalystintro.com',false,false,NULL),
 ('10000000-0000-0000-0000-000000000008',true,'other@example.test',false,false,NULL);
INSERT INTO auth.users VALUES
 ('10000000-0000-0000-0000-000000000004','  KAT@PROPEL.EARTH  ',now()),
 ('10000000-0000-0000-0000-000000000005','other@example.test',now()),
 ('10000000-0000-0000-0000-000000000006','test.founder@catalyst.test',now()),
 ('10000000-0000-0000-0000-000000000007','test.investor@catalystintro.com',now()),
 ('10000000-0000-0000-0000-000000000008','kat@propel.earth',NULL);
-- Prove January seed fallback works without auth, and does not use ID alone.
UPDATE profiles SET email='sarah@example.com' WHERE id='00000000-0000-0000-0000-000000000001';
UPDATE profiles SET email='alex@example.com' WHERE id='00000000-0000-0000-0000-000000000002';
UPDATE profiles SET email='marcus@solaris.io' WHERE id='00000000-0000-0000-0000-000000000003';
-- id 4 intentionally has no seed email, retains user role, must reset to pending.
