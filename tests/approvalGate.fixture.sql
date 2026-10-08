-- Disposable local PostgreSQL ONLY. Creates a minimal Supabase-compatible policy fixture.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles(user_id uuid, role public.app_role, UNIQUE(user_id,role));
CREATE FUNCTION public.has_role(uuid, public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=$1 AND role=$2) $$;
CREATE TABLE public.profiles(id uuid PRIMARY KEY, approved boolean NOT NULL DEFAULT false, is_verified boolean DEFAULT false, is_flagged boolean DEFAULT false, is_hidden boolean DEFAULT false, is_test_account boolean DEFAULT false, is_test_mode boolean DEFAULT false, rejection_reason text, user_type text, name text);
CREATE TABLE public.founder_profiles(profile_id uuid, startup_name text);
CREATE TABLE public.investor_profiles(profile_id uuid, investment_thesis text);
CREATE TABLE public.app_companies(id text PRIMARY KEY, owner_id uuid, status text, data jsonb, sort integer, created_at timestamptz DEFAULT now());
CREATE TABLE public.identity_verifications(profile_id uuid, status text DEFAULT 'pending', reviewed_by uuid, reviewed_at timestamptz, rejection_reason text);
CREATE FUNCTION public.app_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT public.has_role(auth.uid(),'admin') $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['profiles','founder_profiles','investor_profiles','app_companies','identity_verifications'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 -- Deliberately overbroad old policies: the migration must intersect them.
 EXECUTE format('CREATE POLICY old_read ON public.%I FOR SELECT TO anon,authenticated USING(true)',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO anon,authenticated',t);
 END LOOP; END $$;
CREATE POLICY self_profile ON public.profiles FOR ALL TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY submit ON public.identity_verifications FOR INSERT TO authenticated WITH CHECK(profile_id=auth.uid());
CREATE POLICY admin_profiles ON public.profiles FOR ALL TO authenticated USING(public.app_is_admin()) WITH CHECK(public.app_is_admin());
GRANT ALL ON public.user_roles TO authenticated;
INSERT INTO public.profiles(id,user_type,name) VALUES
 ('00000000-0000-0000-0000-000000000001','founder','Pending founder'),
 ('00000000-0000-0000-0000-000000000002','investor','Pending investor'),
 ('00000000-0000-0000-0000-000000000003','founder','Approved founder'),
 ('00000000-0000-0000-0000-000000000004','investor','Approved investor'),
 ('00000000-0000-0000-0000-000000000005','investor','Admin');
INSERT INTO public.user_roles VALUES
 ('00000000-0000-0000-0000-000000000003','user'),
 ('00000000-0000-0000-0000-000000000004','user'),
 ('00000000-0000-0000-0000-000000000005','admin');
INSERT INTO public.founder_profiles VALUES ('00000000-0000-0000-0000-000000000003','Secret company');
INSERT INTO public.investor_profiles VALUES ('00000000-0000-0000-0000-000000000004','Secret thesis');
INSERT INTO public.app_companies(id,owner_id,status,data,sort) VALUES ('company','00000000-0000-0000-0000-000000000003','published','{"name":"Company","line":"Teaser","team":[{"email":"private@example.test"}],"docs":["secret"]}',0);
