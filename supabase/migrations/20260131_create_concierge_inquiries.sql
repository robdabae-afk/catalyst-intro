-- Create concierge_inquiries table
CREATE TABLE IF NOT EXISTS public.concierge_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    service_name text NOT NULL,
    product_name text NOT NULL,
    budget numeric NOT NULL,
    status text DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.concierge_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous and authenticated) to insert (for form submissions)
CREATE POLICY "Anyone can submit inquiries"
    ON public.concierge_inquiries
    FOR INSERT
    WITH CHECK (true);

-- Only admins can read inquiries
CREATE POLICY "Admins can view inquiries"
    ON public.concierge_inquiries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Only admins can update status
CREATE POLICY "Admins can update inquiries"
    ON public.concierge_inquiries
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );
