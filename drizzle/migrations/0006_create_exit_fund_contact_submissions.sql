CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  company TEXT NOT NULL CHECK (char_length(company) BETWEEN 1 AND 150),
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('partnership', 'media', 'ecosystem', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact inquiry"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(company) BETWEEN 1 AND 150
  AND inquiry_type IN ('partnership', 'media', 'ecosystem', 'other')
  AND char_length(message) BETWEEN 10 AND 2000
);

CREATE POLICY "Admins can read contact inquiries"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));