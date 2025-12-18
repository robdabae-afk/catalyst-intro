-- Add policy allowing investors to view their own equity positions
CREATE POLICY "Investors can view their cap table entries"
ON public.cap_table_entries
FOR SELECT
USING (auth.uid() = investor_id);