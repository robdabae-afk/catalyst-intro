-- Create deck_leads table for Catalyst Deck lead capture
CREATE TABLE public.deck_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    source TEXT NOT NULL,
    check_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deck_leads ENABLE ROW LEVEL SECURITY;

-- Admin-only access for viewing leads
CREATE POLICY "Admins can view all deck leads"
ON public.deck_leads FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Public insert for lead capture (anyone can submit the form)
CREATE POLICY "Anyone can insert deck leads"
ON public.deck_leads FOR INSERT
WITH CHECK (true);