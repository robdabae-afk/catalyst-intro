-- Startup-submitted news / investor announcements, surfaced on investors' Portfolio page
CREATE TABLE public.startup_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read startup updates"
  ON public.startup_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Founders can post their own updates"
  ON public.startup_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can delete their own updates"
  ON public.startup_updates FOR DELETE
  TO authenticated
  USING (auth.uid() = founder_id);

CREATE INDEX startup_updates_founder_id_idx ON public.startup_updates (founder_id, created_at DESC);
