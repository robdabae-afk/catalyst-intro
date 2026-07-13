CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist owner select" ON public.watchlist FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "watchlist owner insert" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "watchlist owner delete" ON public.watchlist FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX watchlist_user_idx ON public.watchlist(user_id, created_at DESC);