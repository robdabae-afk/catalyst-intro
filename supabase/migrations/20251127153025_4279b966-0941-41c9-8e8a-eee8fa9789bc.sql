-- Add signature tracking fields to safes table
ALTER TABLE safes ADD COLUMN IF NOT EXISTS founder_signed_at timestamp with time zone;
ALTER TABLE safes ADD COLUMN IF NOT EXISTS founder_signature_data text;
ALTER TABLE safes ADD COLUMN IF NOT EXISTS investor_signed_at timestamp with time zone;
ALTER TABLE safes ADD COLUMN IF NOT EXISTS investor_signature_data text;

-- Add company information fields for SAFE generation
ALTER TABLE founder_profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE founder_profiles ADD COLUMN IF NOT EXISTS company_state text;
ALTER TABLE founder_profiles ADD COLUMN IF NOT EXISTS company_address text;

-- Drop and recreate RLS policies for safes table
DROP POLICY IF EXISTS "Investors can view SAFEs they're part of" ON safes;
DROP POLICY IF EXISTS "Investors can sign their SAFEs" ON safes;

CREATE POLICY "Investors can view SAFEs they're part of"
ON safes FOR SELECT
USING (auth.uid() = investor_id);

CREATE POLICY "Investors can sign their SAFEs"
ON safes FOR UPDATE
USING (auth.uid() = investor_id);

-- Create a function to generate SAFE document content
CREATE OR REPLACE FUNCTION generate_safe_content(safe_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_record safes%ROWTYPE;
  founder_record profiles%ROWTYPE;
  founder_profile founder_profiles%ROWTYPE;
  investor_record profiles%ROWTYPE;
  investor_profile investor_profiles%ROWTYPE;
  result json;
BEGIN
  -- Get SAFE details
  SELECT * INTO safe_record FROM safes WHERE id = safe_id;
  
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
$$;