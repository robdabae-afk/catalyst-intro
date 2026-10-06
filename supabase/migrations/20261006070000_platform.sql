-- Isolated preview/community backend. Apply this file alone, never historical migrations.
BEGIN;
CREATE TABLE public.platform_profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 email text NOT NULL CHECK(length(email)<=320), name text NOT NULL DEFAULT '' CHECK(length(name)<=120),
 role text NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
 city text CHECK(length(city)<=120), bio text CHECK(length(bio)<=2000),
 interests text[] NOT NULL DEFAULT '{}' CHECK(cardinality(interests)<=30 AND length(interests::text)<=4000),
 notif_prefs text[] NOT NULL DEFAULT '{}' CHECK(cardinality(notif_prefs)<=20 AND length(notif_prefs::text)<=2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ SELECT EXISTS(SELECT 1 FROM public.platform_profiles WHERE id=auth.uid() AND role='admin') $$;
CREATE TABLE public.platform_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), org_name text NOT NULL DEFAULT 'Catalyst' CHECK(length(org_name) BETWEEN 1 AND 120),
 contact_email text NOT NULL DEFAULT 'catalystintroapp@gmail.com' CHECK(length(contact_email)<=320 AND position('@' IN contact_email)>1),
 default_capacity integer NOT NULL DEFAULT 100 CHECK(default_capacity BETWEEN 1 AND 100000),
 require_approval boolean NOT NULL DEFAULT false, community_size integer NOT NULL DEFAULT 28000 CHECK(community_size>=0)
);
INSERT INTO public.platform_settings(id) VALUES(true);
CREATE TABLE public.platform_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200), starts_at timestamptz NOT NULL,
 ends_at timestamptz CHECK(ends_at>=starts_at), venue text NOT NULL DEFAULT '' CHECK(length(venue)<=300), address text CHECK(length(address)<=500),
 capacity integer CHECK(capacity BETWEEN 1 AND 100000), cover_url text CHECK(length(cover_url)<=2000), description text NOT NULL DEFAULT '' CHECK(length(description)<=20000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','cancelled')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_event_rsvps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.platform_events ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.platform_profiles ON DELETE CASCADE, status text NOT NULL CHECK(status IN ('pending','approved','declined','waitlisted','cancelled')),
 checked_in_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,user_id), CHECK(checked_in_at IS NULL OR status='approved')
);
CREATE TABLE public.platform_deals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
 line text NOT NULL DEFAULT '' CHECK(length(line)<=500), sector text NOT NULL DEFAULT '' CHECK(length(sector)<=120), city text NOT NULL DEFAULT '' CHECK(length(city)<=120),
 about text NOT NULL DEFAULT '' CHECK(length(about)<=20000), min_check numeric(16,2) CHECK(min_check>=0), valuation_cap text CHECK(length(valuation_cap)<=120),
 instrument text NOT NULL DEFAULT '' CHECK(length(instrument)<=200), goal numeric(16,2) CHECK(goal>=0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','preview','archived')), is_sample boolean NOT NULL DEFAULT true,
 cover_url text CHECK(length(cover_url)<=2000), traction text[] NOT NULL DEFAULT '{}' CHECK(cardinality(traction)<=30 AND length(traction::text)<=10000),
 use_of_funds text[] NOT NULL DEFAULT '{}' CHECK(cardinality(use_of_funds)<=30 AND length(use_of_funds::text)<=10000), created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.platform_deals IS 'Preview information only. No investments, payments, positions, returns or transaction processing.';
CREATE TABLE public.platform_deal_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid NOT NULL REFERENCES public.platform_deals ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.platform_profiles ON DELETE CASCADE,
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 4000), answer text CHECK(length(answer)<=10000), answered_at timestamptz,
 hidden boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_saved_deals (
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.platform_profiles ON DELETE CASCADE, deal_id uuid NOT NULL REFERENCES public.platform_deals ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,deal_id)
);
CREATE TABLE public.platform_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('dm','event','deal')), title text NOT NULL CHECK(length(title)<=200),
 last_message_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_thread_members (
 thread_id uuid NOT NULL REFERENCES public.platform_threads ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.platform_profiles ON DELETE CASCADE,
 PRIMARY KEY(thread_id,user_id)
);
CREATE FUNCTION public.platform_in_thread(p_thread_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ SELECT EXISTS(SELECT 1 FROM public.platform_thread_members WHERE thread_id=p_thread_id AND user_id=auth.uid()) $$;
CREATE TABLE public.platform_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.platform_threads ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.platform_profiles ON DELETE CASCADE, body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 10000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_thread_reads (
 thread_id uuid NOT NULL REFERENCES public.platform_threads ON DELETE CASCADE, user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.platform_profiles ON DELETE CASCADE,
 read_at timestamptz NOT NULL DEFAULT now() CHECK(read_at<=now()+interval '1 minute'), PRIMARY KEY(thread_id,user_id)
);
CREATE TABLE public.platform_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.platform_profiles ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('announcement','rsvp','answer','message')), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 body text NOT NULL CHECK(length(body)<=10000), link text CHECK(length(link)<=2000), read_at timestamptz CHECK(read_at<=now()+interval '1 minute'), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_announcements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
 audience jsonb NOT NULL CHECK(length(audience::text)<=200), sent_at timestamptz, created_by uuid NOT NULL REFERENCES public.platform_profiles, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_events_time ON public.platform_events(status,starts_at);
CREATE INDEX platform_rsvps_user ON public.platform_event_rsvps(user_id);
CREATE INDEX platform_rsvps_event_status ON public.platform_event_rsvps(event_id,status);
CREATE INDEX platform_questions_deal ON public.platform_deal_questions(deal_id,created_at);
CREATE INDEX platform_questions_user ON public.platform_deal_questions(user_id);
CREATE INDEX platform_members_user ON public.platform_thread_members(user_id);
CREATE INDEX platform_messages_thread ON public.platform_messages(thread_id,created_at);
CREATE INDEX platform_notifications_user ON public.platform_notifications(user_id,created_at DESC);

-- Explicitly remove inherited Supabase defaults before adding least-privilege grants.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','settings','events','event_rsvps','deals','deal_questions','saved_deals','threads','thread_members','messages','thread_reads','notifications','announcements'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY','platform_'||t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated','platform_'||t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated','platform_'||t);
 EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin())','platform_'||t);
 END LOOP;
END $$;
GRANT SELECT ON public.platform_events,public.platform_deals TO anon;
GRANT INSERT,UPDATE,DELETE ON public.platform_settings,public.platform_events,public.platform_deals,public.platform_threads,public.platform_thread_members,public.platform_announcements TO authenticated;
GRANT UPDATE(name,city,bio,interests,notif_prefs) ON public.platform_profiles TO authenticated;
GRANT INSERT(deal_id,user_id,body) ON public.platform_deal_questions TO authenticated;
GRANT DELETE ON public.platform_deal_questions TO authenticated;
GRANT INSERT(user_id,deal_id),DELETE ON public.platform_saved_deals TO authenticated;
GRANT INSERT(thread_id,user_id,body) ON public.platform_messages TO authenticated;
GRANT DELETE ON public.platform_messages TO authenticated;
GRANT INSERT(thread_id,user_id,read_at),UPDATE(thread_id,user_id,read_at) ON public.platform_thread_reads TO authenticated;
GRANT UPDATE(read_at) ON public.platform_notifications TO authenticated;
CREATE POLICY self_read ON public.platform_profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY self_update ON public.platform_profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY published ON public.platform_events FOR SELECT TO anon,authenticated USING(status='published');
CREATE POLICY own_rsvp_event ON public.platform_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.platform_event_rsvps r WHERE r.event_id=platform_events.id AND r.user_id=auth.uid()));
CREATE POLICY previews ON public.platform_deals FOR SELECT TO anon,authenticated USING(status='preview');
CREATE POLICY own_rsvp ON public.platform_event_rsvps FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY visible_question ON public.platform_deal_questions FOR SELECT TO authenticated USING(NOT hidden AND EXISTS(SELECT 1 FROM public.platform_deals d WHERE d.id=deal_id AND d.status='preview'));
CREATE POLICY ask ON public.platform_deal_questions FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND answer IS NULL AND answered_at IS NULL AND NOT hidden AND EXISTS(SELECT 1 FROM public.platform_deals d WHERE d.id=deal_id AND d.status='preview'));
CREATE POLICY own_save ON public.platform_saved_deals FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY save ON public.platform_saved_deals FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.platform_deals d WHERE d.id=deal_id AND d.status='preview'));
CREATE POLICY unsave ON public.platform_saved_deals FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE POLICY member_thread ON public.platform_threads FOR SELECT TO authenticated USING(public.platform_in_thread(id));
CREATE POLICY member_roster ON public.platform_thread_members FOR SELECT TO authenticated USING(public.platform_in_thread(thread_id));
CREATE POLICY member_messages ON public.platform_messages FOR SELECT TO authenticated USING(public.platform_in_thread(thread_id));
CREATE POLICY send ON public.platform_messages FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND public.platform_in_thread(thread_id));
CREATE POLICY own_read ON public.platform_thread_reads FOR ALL TO authenticated USING(user_id=auth.uid() AND public.platform_in_thread(thread_id)) WITH CHECK(user_id=auth.uid() AND public.platform_in_thread(thread_id));
CREATE POLICY own_notification ON public.platform_notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY read_notification ON public.platform_notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY settings_read ON public.platform_settings FOR SELECT TO authenticated USING(true);

CREATE FUNCTION public.platform_ensure_profile() RETURNS public.platform_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.platform_profiles; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
 INSERT INTO public.platform_profiles(id,email,name) SELECT id,coalesce(email,''),left(coalesce(raw_user_meta_data->>'name',''),120) FROM auth.users WHERE id=auth.uid() ON CONFLICT(id) DO NOTHING;
 SELECT * INTO STRICT result FROM public.platform_profiles WHERE id=auth.uid(); RETURN result;
END $$;
CREATE FUNCTION public.platform_set_role(p_user_id uuid,p_role text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- A singleton row serializes all role changes, including simultaneous demotions.
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.platform_settings WHERE id FOR UPDATE;
 -- Recheck after the lock because another admin may have demoted this caller.
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 IF p_role IS NULL OR p_role NOT IN ('user','admin') THEN RAISE EXCEPTION 'invalid role' USING ERRCODE='22023'; END IF;
 IF p_role='user' AND EXISTS(SELECT 1 FROM public.platform_profiles WHERE id=p_user_id AND role='admin') AND (SELECT count(*) FROM public.platform_profiles WHERE role='admin')<=1 THEN RAISE EXCEPTION 'last admin' USING ERRCODE='23514'; END IF;
 UPDATE public.platform_profiles SET role=p_role WHERE id=p_user_id; IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
END $$;
CREATE FUNCTION public.platform_rsvp(p_event_id uuid,p_cancel boolean DEFAULT false) RETURNS public.platform_event_rsvps LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public.platform_events; r public.platform_event_rsvps; s text; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
 PERFORM public.platform_ensure_profile();
 SELECT * INTO e FROM public.platform_events WHERE id=p_event_id FOR UPDATE;
 IF NOT FOUND OR (e.status<>'published' AND NOT coalesce(p_cancel,false)) THEN RAISE EXCEPTION 'event not available' USING ERRCODE='P0002'; END IF;
 SELECT * INTO r FROM public.platform_event_rsvps WHERE event_id=p_event_id AND user_id=auth.uid();
 IF r.status='declined' THEN RAISE EXCEPTION 'RSVP declined; contact the event organizer' USING ERRCODE='42501'; END IF;
 IF coalesce(p_cancel,false) THEN
 IF r.checked_in_at IS NOT NULL THEN RAISE EXCEPTION 'checked-in RSVP must be changed by an organizer' USING ERRCODE='42501'; END IF;
 UPDATE public.platform_event_rsvps SET status='cancelled',checked_in_at=NULL WHERE event_id=p_event_id AND user_id=auth.uid() RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF; RETURN r;
 END IF;
 IF r.status IN ('approved','pending','waitlisted') THEN RETURN r; END IF;
 IF e.starts_at<=now() THEN RAISE EXCEPTION 'event has already started' USING ERRCODE='23514'; END IF;
 IF e.capacity IS NOT NULL AND (SELECT count(*) FROM public.platform_event_rsvps WHERE event_id=e.id AND status='approved')>=e.capacity THEN s:='waitlisted';
 ELSIF (SELECT require_approval FROM public.platform_settings WHERE id) THEN s:='pending'; ELSE s:='approved'; END IF;
 INSERT INTO public.platform_event_rsvps(event_id,user_id,status) VALUES(e.id,auth.uid(),s) ON CONFLICT(event_id,user_id) DO UPDATE SET status=excluded.status,checked_in_at=NULL RETURNING * INTO r;
 RETURN r;
END $$;
CREATE FUNCTION public.platform_admin_rsvp(p_rsvp_id uuid,p_status text DEFAULT NULL,p_check_in boolean DEFAULT NULL) RETURNS public.platform_event_rsvps LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.platform_event_rsvps; e public.platform_events; s text; BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.platform_event_rsvps WHERE id=p_rsvp_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
 SELECT * INTO e FROM public.platform_events WHERE id=r.event_id FOR UPDATE;
 SELECT * INTO r FROM public.platform_event_rsvps WHERE id=p_rsvp_id FOR UPDATE;
 s:=coalesce(p_status,r.status);
 IF s NOT IN ('pending','approved','declined','waitlisted','cancelled') THEN RAISE EXCEPTION 'invalid status' USING ERRCODE='22023'; END IF;
 IF s='approved' AND e.capacity IS NOT NULL AND (SELECT count(*) FROM public.platform_event_rsvps WHERE event_id=e.id AND status='approved' AND id<>r.id)>=e.capacity THEN RAISE EXCEPTION 'capacity reached' USING ERRCODE='23514'; END IF;
 IF coalesce(p_check_in,false) AND s<>'approved' THEN RAISE EXCEPTION 'approval required' USING ERRCODE='23514'; END IF;
 UPDATE public.platform_event_rsvps SET status=s,checked_in_at=CASE WHEN s<>'approved' OR p_check_in=false THEN NULL WHEN p_check_in=true THEN now() ELSE checked_in_at END WHERE id=r.id RETURNING * INTO r; RETURN r;
END $$;
CREATE FUNCTION public.platform_moderate_question(p_question_id uuid,p_answer text DEFAULT NULL,p_hidden boolean DEFAULT NULL) RETURNS public.platform_deal_questions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.platform_deal_questions; BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 IF length(p_answer)>10000 THEN RAISE EXCEPTION 'answer too long' USING ERRCODE='22023'; END IF;
 UPDATE public.platform_deal_questions SET answer=coalesce(p_answer,answer),answered_at=CASE WHEN p_answer IS NOT NULL THEN now() ELSE answered_at END,hidden=coalesce(p_hidden,hidden) WHERE id=p_question_id RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF; RETURN r;
END $$;
CREATE FUNCTION public.platform_announce(p_title text,p_body text,p_audience jsonb) RETURNS public.platform_announcements LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE a public.platform_announcements; event_uuid uuid; BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 200 OR p_body IS NULL OR length(btrim(p_body)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'invalid announcement' USING ERRCODE='22023'; END IF;
 IF p_audience IS NULL THEN RAISE EXCEPTION 'invalid audience' USING ERRCODE='22023'; END IF;
 IF p_audience NOT IN ('"all"'::jsonb,'"admins"'::jsonb) THEN
 IF jsonb_typeof(p_audience)<>'object' OR NOT p_audience ? 'eventId' OR p_audience- 'eventId'<>'{}'::jsonb THEN RAISE EXCEPTION 'invalid audience' USING ERRCODE='22023'; END IF;
 event_uuid:=(p_audience->>'eventId')::uuid;
 IF event_uuid IS NULL OR NOT EXISTS(SELECT 1 FROM public.platform_events WHERE id=event_uuid) THEN RAISE EXCEPTION 'event not found' USING ERRCODE='P0002'; END IF;
 END IF;
 INSERT INTO public.platform_announcements(title,body,audience,sent_at,created_by) VALUES(p_title,p_body,p_audience,now(),auth.uid()) RETURNING * INTO a;
 INSERT INTO public.platform_notifications(user_id,kind,title,body,link)
 SELECT p.id,'announcement',p_title,p_body,CASE WHEN event_uuid IS NOT NULL THEN '/app/events/'||event_uuid ELSE NULL END FROM public.platform_profiles p
 WHERE p_audience='"all"'::jsonb OR (p_audience='"admins"'::jsonb AND p.role='admin') OR EXISTS(SELECT 1 FROM public.platform_event_rsvps r WHERE r.event_id=event_uuid AND r.user_id=p.id AND r.status IN ('approved','pending','waitlisted'));
 RETURN a;
END $$;
CREATE FUNCTION public.platform_event_counts(p_event_id uuid DEFAULT NULL) RETURNS TABLE(event_id uuid,going_count bigint,waitlist_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.id,count(r.id) FILTER(WHERE r.status='approved'),count(r.id) FILTER(WHERE r.status='waitlisted') FROM public.platform_events e LEFT JOIN public.platform_event_rsvps r ON r.event_id=e.id WHERE (e.status='published' OR public.is_platform_admin()) AND (p_event_id IS NULL OR e.id=p_event_id) GROUP BY e.id
$$;
CREATE FUNCTION public.platform_waitlist(p_query text DEFAULT '',p_limit integer DEFAULT 50,p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE rows_json jsonb; n bigint; BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 1000000 OR length(coalesce(p_query,''))>200 THEN RAISE EXCEPTION 'invalid pagination' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO n FROM public.waitlist_signups w WHERE coalesce(p_query,'')='' OR position(lower(p_query) IN lower(w.email||' '||coalesce(w.name,'')))>0;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO rows_json FROM (SELECT w.id,w.email,w.name,to_jsonb(w)->>'user_type' AS source,w.created_at FROM public.waitlist_signups w WHERE coalesce(p_query,'')='' OR position(lower(p_query) IN lower(w.email||' '||coalesce(w.name,'')))>0 ORDER BY w.created_at DESC,w.id LIMIT p_limit OFFSET p_offset) x;
 RETURN jsonb_build_object('rows',rows_json,'total',n);
END $$;
-- Return only display names of visible Q&A authors/thread peers, never their email/profile.
CREATE FUNCTION public.platform_member_names(p_user_ids uuid[]) RETURNS TABLE(id uuid,name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501'; END IF;
 IF cardinality(p_user_ids)>100 THEN RAISE EXCEPTION 'too many ids' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT p.id,p.name FROM public.platform_profiles p WHERE p.id=ANY(p_user_ids) AND
 (p.id=auth.uid() OR public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.platform_deal_questions q JOIN public.platform_deals d ON d.id=q.deal_id WHERE q.user_id=p.id AND NOT q.hidden AND d.status='preview') OR EXISTS(SELECT 1 FROM public.platform_thread_members m WHERE m.user_id=p.id AND public.platform_in_thread(m.thread_id)));
END $$;
CREATE FUNCTION public.platform_capacity_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 IF NEW.capacity IS NOT NULL AND (SELECT count(*) FROM public.platform_event_rsvps WHERE event_id=NEW.id AND status='approved')>NEW.capacity THEN RAISE EXCEPTION 'capacity below approved occupancy' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER platform_capacity_guard BEFORE UPDATE OF capacity ON public.platform_events FOR EACH ROW EXECUTE FUNCTION public.platform_capacity_guard();
-- Message side effect is trusted, not a client-writable timestamp.
CREATE FUNCTION public.platform_message_touch() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN UPDATE public.platform_threads SET last_message_at=NEW.created_at WHERE id=NEW.thread_id; RETURN NEW; END $$;
CREATE TRIGGER platform_message_touch AFTER INSERT ON public.platform_messages FOR EACH ROW EXECUTE FUNCTION public.platform_message_touch();
DO $$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'platform_%' OR p.proname='is_platform_admin') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
 IF f.signature::text NOT LIKE '%platform_message_touch%' AND f.signature::text NOT LIKE '%platform_capacity_guard%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END IF;
 END LOOP; END $$;
GRANT EXECUTE ON FUNCTION public.platform_event_counts(uuid) TO anon;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('platform-covers','platform-covers',true,5242880,ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
CREATE POLICY platform_covers_read ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='platform-covers');
CREATE POLICY platform_covers_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='platform-covers' AND public.is_platform_admin() AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY platform_covers_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='platform-covers' AND public.is_platform_admin()) WITH CHECK(bucket_id='platform-covers' AND public.is_platform_admin() AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY platform_covers_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='platform-covers' AND public.is_platform_admin());
COMMIT;
