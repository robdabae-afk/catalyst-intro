
CREATE TABLE public.deck_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_slug text NOT NULL DEFAULT 'catalyst',
  edit_id text NOT NULL,
  kind text NOT NULL DEFAULT 'override' CHECK (kind IN ('override','insert')),
  slide_key text,
  parent_selector text,
  element_type text CHECK (element_type IS NULL OR element_type IN ('text','image')),
  text_content text,
  image_url text,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  hidden boolean NOT NULL DEFAULT false,
  z_index int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deck_slug, edit_id)
);

GRANT SELECT ON public.deck_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.deck_overrides TO authenticated;
GRANT ALL ON public.deck_overrides TO service_role;

ALTER TABLE public.deck_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deck overrides are publicly readable"
  ON public.deck_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert deck overrides"
  ON public.deck_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deck overrides"
  ON public.deck_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete deck overrides"
  ON public.deck_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER deck_overrides_set_updated_at
  BEFORE UPDATE ON public.deck_overrides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX deck_overrides_deck_slug_idx ON public.deck_overrides(deck_slug);
