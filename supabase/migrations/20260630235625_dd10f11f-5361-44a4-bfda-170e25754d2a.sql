-- home_news
CREATE TABLE public.home_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_date date NOT NULL UNIQUE,
  title text NOT NULL,
  body text,
  link text,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_news TO authenticated;
GRANT ALL ON public.home_news TO service_role;
ALTER TABLE public.home_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_news select authenticated" ON public.home_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "home_news admin insert" ON public.home_news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "home_news admin update" ON public.home_news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "home_news admin delete" ON public.home_news FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- home_hot_picks
CREATE TABLE public.home_hot_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  role public.user_type NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, role, profile_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_hot_picks TO authenticated;
GRANT ALL ON public.home_hot_picks TO service_role;
ALTER TABLE public.home_hot_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_hot_picks select authenticated" ON public.home_hot_picks FOR SELECT TO authenticated USING (true);
CREATE POLICY "home_hot_picks admin insert" ON public.home_hot_picks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "home_hot_picks admin update" ON public.home_hot_picks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "home_hot_picks admin delete" ON public.home_hot_picks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- home_newsletter_submissions
CREATE TABLE public.home_newsletter_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  link text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_newsletter_submissions TO authenticated;
GRANT ALL ON public.home_newsletter_submissions TO service_role;
ALTER TABLE public.home_newsletter_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions select own or admin" ON public.home_newsletter_submissions FOR SELECT TO authenticated USING (submitter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "submissions insert own" ON public.home_newsletter_submissions FOR INSERT TO authenticated WITH CHECK (submitter_id = auth.uid());
CREATE POLICY "submissions update admin" ON public.home_newsletter_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "submissions delete admin or own" ON public.home_newsletter_submissions FOR DELETE TO authenticated USING (submitter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER home_news_set_updated_at BEFORE UPDATE ON public.home_news FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER home_newsletter_submissions_set_updated_at BEFORE UPDATE ON public.home_newsletter_submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();