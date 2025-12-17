-- Fix 1: Add authorization check to generate_safe_content function
CREATE OR REPLACE FUNCTION public.generate_safe_content(safe_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_record safes%ROWTYPE;
  founder_record profiles%ROWTYPE;
  founder_profile founder_profiles%ROWTYPE;
  investor_record profiles%ROWTYPE;
  investor_profile investor_profiles%ROWTYPE;
  result json;
BEGIN
  -- Get SAFE details first
  SELECT * INTO safe_record FROM safes WHERE id = safe_id;
  
  -- Check if SAFE exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SAFE not found';
  END IF;
  
  -- Authorization check: verify caller is founder or investor of this SAFE
  IF safe_record.founder_id != auth.uid() AND safe_record.investor_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: not authorized to view this SAFE';
  END IF;
  
  -- Get founder details
  SELECT * INTO founder_record FROM profiles WHERE id = safe_record.founder_id;
  SELECT * INTO founder_profile FROM founder_profiles WHERE profile_id = safe_record.founder_id;
  
  -- Get investor details
  SELECT * INTO investor_record FROM profiles WHERE id = safe_record.investor_id;
  SELECT * INTO investor_profile FROM investor_profiles WHERE profile_id = safe_record.investor_id;
  
  -- Build result
  result := json_build_object(
    'safe_id', safe_record.id,
    'amount', safe_record.amount,
    'valuation_cap', safe_record.valuation_cap,
    'discount_rate', safe_record.discount_rate,
    'execution_date', safe_record.execution_date,
    'company_name', COALESCE(founder_profile.company_name, founder_profile.startup_name),
    'company_state', founder_profile.company_state,
    'company_address', founder_profile.company_address,
    'founder_name', founder_record.name,
    'founder_email', founder_record.email,
    'investor_name', investor_record.name,
    'investor_email', investor_record.email,
    'investor_firm', investor_profile.firm_name,
    'founder_signed', safe_record.founder_signed_at IS NOT NULL,
    'investor_signed', safe_record.investor_signed_at IS NOT NULL
  );
  
  RETURN result;
END;
$function$;

-- Fix 2: Make documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Fix 3: Drop the overly permissive SELECT policy and create a restricted one
DROP POLICY IF EXISTS "Users can view shared documents" ON storage.objects;

-- Create policy that only allows access to document parties
CREATE POLICY "Users can view authorized documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- User is the uploader (their user ID is the first folder)
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- User is party to the document request containing this file
    EXISTS (
      SELECT 1 FROM document_requests dr
      WHERE dr.file_url LIKE '%' || storage.filename(name) || '%'
      AND (dr.requester_id = auth.uid() OR dr.target_id = auth.uid())
      AND dr.status = 'approved'
    )
  )
);