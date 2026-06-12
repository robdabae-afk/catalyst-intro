
DO $$ BEGIN CREATE TYPE public.match_role AS ENUM ('founder','investor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.match_accreditation AS ENUM ('accredited','institutional','none'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.match_doc_type AS ENUM ('pitch_deck','cap_table','incorporation','financials','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.match_doc_status AS ENUM ('pending','fulfilled','declined'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.match_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.match_role NOT NULL,
  name text NOT NULL,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_profiles TO authenticated;
GRANT ALL ON public.match_profiles TO service_role;
ALTER TABLE public.match_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_founder_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  startup_name text, one_liner text, industry text[], stage text, traction text,
  funding_amount text, pitch_deck_url text, location text, website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_founder_profiles TO authenticated;
GRANT ALL ON public.match_founder_profiles TO service_role;
ALTER TABLE public.match_founder_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_investor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  firm_name text,
  accreditation public.match_accreditation NOT NULL DEFAULT 'none',
  avg_check_size text, philosophy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_investor_profiles TO authenticated;
GRANT ALL ON public.match_investor_profiles TO service_role;
ALTER TABLE public.match_investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, code text NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.match_events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, profile_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_event_attendees TO authenticated;
GRANT ALL ON public.match_event_attendees TO service_role;
ALTER TABLE public.match_event_attendees ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.match_events(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, investor_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_interests TO authenticated;
GRANT ALL ON public.match_interests TO service_role;
ALTER TABLE public.match_interests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.match_events(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, investor_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_threads TO authenticated;
GRANT ALL ON public.match_threads TO service_role;
ALTER TABLE public.match_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.match_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_messages TO authenticated;
GRANT ALL ON public.match_messages TO service_role;
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.match_threads(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL REFERENCES public.match_profiles(id) ON DELETE CASCADE,
  doc_type public.match_doc_type NOT NULL,
  note text,
  status public.match_doc_status NOT NULL DEFAULT 'pending',
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_document_requests TO authenticated;
GRANT ALL ON public.match_document_requests TO service_role;
ALTER TABLE public.match_document_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_notifications TO authenticated;
GRANT ALL ON public.match_notifications TO service_role;
ALTER TABLE public.match_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.match_share_active_event(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_event_attendees a
    JOIN public.match_event_attendees b ON a.event_id = b.event_id
    JOIN public.match_events e ON e.id = a.event_id
    WHERE a.profile_id = _a AND b.profile_id = _b
      AND e.is_active = true AND e.starts_at <= now() AND e.ends_at >= now()
  );
$$;

CREATE OR REPLACE FUNCTION public.match_is_thread_participant(_thread uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_threads t
    WHERE t.id = _thread AND (t.investor_id = _user OR t.founder_id = _user)
  );
$$;

CREATE POLICY "own profile rw" ON public.match_profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "co-attendees read profile" ON public.match_profiles FOR SELECT TO authenticated USING (public.match_share_active_event(id, auth.uid()));
CREATE POLICY "admins all profiles" ON public.match_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "founder own row" ON public.match_founder_profiles FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "co-attendees view founder" ON public.match_founder_profiles FOR SELECT TO authenticated USING (public.match_share_active_event(profile_id, auth.uid()));
CREATE POLICY "admins all founder rows" ON public.match_founder_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "investor own row" ON public.match_investor_profiles FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "co-attendees view investor" ON public.match_investor_profiles FOR SELECT TO authenticated USING (public.match_share_active_event(profile_id, auth.uid()));
CREATE POLICY "admins all investor rows" ON public.match_investor_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "authed read events" ON public.match_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins all events" ON public.match_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own attendance" ON public.match_event_attendees FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "co-attendees read attendance" ON public.match_event_attendees FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.match_event_attendees me WHERE me.event_id = match_event_attendees.event_id AND me.profile_id = auth.uid()));
CREATE POLICY "admins all attendees" ON public.match_event_attendees FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "participants read interests" ON public.match_interests FOR SELECT TO authenticated USING (investor_id = auth.uid() OR founder_id = auth.uid());
CREATE POLICY "investor creates interest" ON public.match_interests FOR INSERT TO authenticated WITH CHECK (investor_id = auth.uid());
CREATE POLICY "admins all interests" ON public.match_interests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "participants read threads" ON public.match_threads FOR SELECT TO authenticated USING (investor_id = auth.uid() OR founder_id = auth.uid());
CREATE POLICY "investor creates thread" ON public.match_threads FOR INSERT TO authenticated WITH CHECK (investor_id = auth.uid());
CREATE POLICY "admins all threads" ON public.match_threads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "participants read messages" ON public.match_messages FOR SELECT TO authenticated USING (public.match_is_thread_participant(thread_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.match_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.match_is_thread_participant(thread_id, auth.uid()));
CREATE POLICY "admins all messages" ON public.match_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "participants read doc reqs" ON public.match_document_requests FOR SELECT TO authenticated USING (public.match_is_thread_participant(thread_id, auth.uid()));
CREATE POLICY "participants create doc reqs" ON public.match_document_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND public.match_is_thread_participant(thread_id, auth.uid()));
CREATE POLICY "founder updates doc reqs" ON public.match_document_requests FOR UPDATE TO authenticated USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "admins all doc reqs" ON public.match_document_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own notifs read" ON public.match_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifs update" ON public.match_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "self insert notifs" ON public.match_notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins all notifs" ON public.match_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER match_profiles_updated BEFORE UPDATE ON public.match_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER match_founder_profiles_updated BEFORE UPDATE ON public.match_founder_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER match_investor_profiles_updated BEFORE UPDATE ON public.match_investor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER match_events_updated BEFORE UPDATE ON public.match_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_document_requests;

CREATE POLICY "match docs read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'match-documents' AND public.match_is_thread_participant((storage.foldername(name))[1]::uuid, auth.uid()));
CREATE POLICY "match docs insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'match-documents' AND public.match_is_thread_participant((storage.foldername(name))[1]::uuid, auth.uid()));
CREATE POLICY "match docs update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'match-documents' AND public.match_is_thread_participant((storage.foldername(name))[1]::uuid, auth.uid()));
