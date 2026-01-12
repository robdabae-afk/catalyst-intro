-- Create token_packages table
CREATE TABLE public.token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies - public read access for active packages
CREATE POLICY "Anyone can view active token packages"
ON public.token_packages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all token packages"
ON public.token_packages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage token packages"
ON public.token_packages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_token_packages_updated_at
BEFORE UPDATE ON public.token_packages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed default token packages (1 token = $1)
-- Note: Stripe price IDs need to be created in Stripe dashboard
INSERT INTO public.token_packages (name, tokens, price_cents, display_order) VALUES
  ('Starter Pack', 10, 1000, 1),
  ('Value Pack', 25, 2500, 2),
  ('Popular Pack', 50, 5000, 3),
  ('Premium Pack', 100, 10000, 4)
ON CONFLICT DO NOTHING;


