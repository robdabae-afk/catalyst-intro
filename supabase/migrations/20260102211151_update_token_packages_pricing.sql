-- Update token packages to match new pricing
-- 30 credits for $15, 100 credits for $30, 200 credits for $70

-- Delete old packages
DELETE FROM public.token_packages;

-- Insert new packages with correct pricing
INSERT INTO public.token_packages (name, tokens, price_cents, display_order) VALUES
  ('Small Pack', 30, 1500, 1),
  ('Medium Pack', 100, 3000, 2),
  ('Large Pack', 200, 7000, 3)
ON CONFLICT DO NOTHING;


