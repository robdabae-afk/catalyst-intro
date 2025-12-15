-- Change founder_profiles.industry from text to text[] and add stage column
ALTER TABLE public.founder_profiles 
  ALTER COLUMN industry TYPE text[] USING CASE WHEN industry IS NOT NULL THEN ARRAY[industry] ELSE NULL END;

-- Add stage column using existing funding_stage enum
ALTER TABLE public.founder_profiles 
  ADD COLUMN stage public.funding_stage;