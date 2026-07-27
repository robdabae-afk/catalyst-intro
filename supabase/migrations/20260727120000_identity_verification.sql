-- Identity verification: government ID + selfie manual review pipeline

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

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification submissions"
ON public.identity_verifications
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all verification submissions"
ON public.identity_verifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit their own verification"
ON public.identity_verifications
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can review verification submissions"
ON public.identity_verifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Private storage bucket for ID documents and selfies (never public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('id-verification', 'id-verification', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY "Users can upload their own verification photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-verification' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users and admins can view verification photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-verification'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
