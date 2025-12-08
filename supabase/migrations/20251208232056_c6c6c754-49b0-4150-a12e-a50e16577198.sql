
-- Create document_requests table for investor requests
CREATE TABLE public.document_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('pitch_deck', 'financials', 'cap_table', 'funding_interest', 'meeting', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  message TEXT,
  response_message TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can create requests
CREATE POLICY "Users can create requests"
ON public.document_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Both parties can view their requests
CREATE POLICY "Users can view their requests"
ON public.document_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Target can respond to requests
CREATE POLICY "Target can update requests"
ON public.document_requests FOR UPDATE
USING (auth.uid() = target_id);

-- Create storage bucket for shared documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view shared documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Trigger for updated_at
CREATE TRIGGER update_document_requests_updated_at
BEFORE UPDATE ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
