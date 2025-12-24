-- Add DELETE policy for founders to delete their own cap table entries
CREATE POLICY "Founders can delete their cap table entries"
ON public.cap_table_entries
FOR DELETE
USING (auth.uid() = founder_id);