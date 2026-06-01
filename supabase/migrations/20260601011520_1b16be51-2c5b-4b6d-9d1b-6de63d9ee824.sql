CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.event_attendees TO anon, authenticated;
GRANT ALL ON public.event_attendees TO service_role;

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign in at event"
  ON public.event_attendees FOR INSERT
  WITH CHECK (consent_accepted = true AND length(full_name) BETWEEN 2 AND 120 AND length(phone) BETWEEN 7 AND 20);

CREATE POLICY "Admins can view event attendees"
  ON public.event_attendees FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));