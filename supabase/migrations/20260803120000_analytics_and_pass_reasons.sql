-- Phase A of data strategy: event instrumentation + explainable pass data

-- 1. Analytics events (page/profile/deck views etc.)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE INDEX analytics_events_type_time_idx ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX analytics_events_user_idx ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX analytics_events_target_idx ON public.analytics_events (target_id, created_at DESC);

-- 2. One-tap pass reasons on swipes
ALTER TABLE public.swipes
  ADD COLUMN pass_reason text;
