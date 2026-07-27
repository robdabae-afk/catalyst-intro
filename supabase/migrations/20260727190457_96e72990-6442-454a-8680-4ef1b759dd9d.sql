CREATE TABLE public.identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_document_url text NOT NULL,
  selfie_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_identity_verifications_profile_id ON public.identity_verifications(profile_id);
CREATE INDEX idx_identity_verifications_status ON public.identity_verifications(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification submissions"
ON public.identity_verifications
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all verification submissions"
ON public.identity_verifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit their own verification"
ON public.identity_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can review verification submissions"
ON public.identity_verifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upload their own verification photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-verification' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users and admins can view verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-verification'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);