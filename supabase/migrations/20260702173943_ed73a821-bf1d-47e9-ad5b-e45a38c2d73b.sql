
CREATE TABLE public.intro_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pitch_summary text,
  ask_amount text,
  ask_stage text,
  why_you text,
  include_deck boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX intro_requests_investor_idx ON public.intro_requests(investor_id, status);
CREATE INDEX intro_requests_founder_idx ON public.intro_requests(founder_id, status);

GRANT SELECT, INSERT, UPDATE ON public.intro_requests TO authenticated;
GRANT ALL ON public.intro_requests TO service_role;

ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders create their own intro requests"
  ON public.intro_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Participants read intro requests"
  ON public.intro_requests FOR SELECT TO authenticated
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Investors update intro request status"
  ON public.intro_requests FOR UPDATE TO authenticated
  USING (auth.uid() = investor_id)
  WITH CHECK (auth.uid() = investor_id);

CREATE TRIGGER intro_requests_updated_at
  BEFORE UPDATE ON public.intro_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
