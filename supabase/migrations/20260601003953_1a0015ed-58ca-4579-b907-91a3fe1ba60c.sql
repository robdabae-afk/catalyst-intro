
DROP POLICY IF EXISTS "Users can view authorized documents" ON storage.objects;

CREATE POLICY "Users can view authorized documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.document_requests dr
      WHERE dr.file_url = name
        AND (dr.requester_id = auth.uid() OR dr.target_id = auth.uid())
        AND dr.status = 'approved'
    )
  )
);

UPDATE public.document_requests
SET file_url = regexp_replace(file_url, '^.*/storage/v1/object/(?:public|sign)/documents/', '')
WHERE file_url LIKE '%/storage/v1/object/%';

ALTER TABLE public.cap_table_entries
  ADD CONSTRAINT cap_table_investment_positive
    CHECK (investment_amount > 0 AND investment_amount <= 1000000000),
  ADD CONSTRAINT cap_table_equity_valid
    CHECK (equity_percentage IS NULL OR (equity_percentage >= 0 AND equity_percentage <= 100)),
  ADD CONSTRAINT cap_table_valuation_positive
    CHECK (valuation IS NULL OR (valuation > 0 AND valuation <= 10000000000));

ALTER TABLE public.safes
  ADD CONSTRAINT safes_amount_positive
    CHECK (amount > 0 AND amount <= 100000000),
  ADD CONSTRAINT safes_valuation_cap_valid
    CHECK (valuation_cap IS NULL OR (valuation_cap > 0 AND valuation_cap <= 1000000000)),
  ADD CONSTRAINT safes_discount_rate_valid
    CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate <= 100));

DROP VIEW IF EXISTS public.public_founder_profiles;

ALTER TABLE public.deck_leads
  ADD CONSTRAINT deck_leads_name_not_empty
    CHECK (length(trim(name)) > 0);
