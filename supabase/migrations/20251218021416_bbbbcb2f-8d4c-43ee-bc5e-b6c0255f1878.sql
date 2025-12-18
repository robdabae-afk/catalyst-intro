-- Ad profile types enum
CREATE TYPE public.ad_profile_type AS ENUM ('startup', 'investment_fund', 'external');

-- Spotlight duration enum
CREATE TYPE public.spotlight_duration AS ENUM ('1_day', '1_week', '1_month');

-- Ad profiles table
CREATE TABLE public.ad_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to existing profile (optional - for promoting existing users)
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Ad type and basic info
  ad_type ad_profile_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  
  -- Startup-specific fields (used when ad_type = 'startup')
  company_name TEXT,
  one_liner TEXT,
  industry TEXT[],
  stage TEXT,
  website_url TEXT,
  
  -- Investment fund-specific fields (used when ad_type = 'investment_fund')
  firm_name TEXT,
  typical_check_size TEXT,
  sectors_of_interest TEXT[],
  portfolio_link TEXT,
  
  -- External company fields (used when ad_type = 'external')
  external_company_name TEXT,
  service_description TEXT,
  cta_text TEXT,
  cta_url TEXT,
  
  -- Spotlight settings
  spotlight_duration spotlight_duration,
  spotlight_start_date TIMESTAMPTZ,
  spotlight_end_date TIMESTAMPTZ,
  
  -- Admin tracking
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage ad profiles
CREATE POLICY "Admins can view all ad profiles"
ON public.ad_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create ad profiles"
ON public.ad_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad profiles"
ON public.ad_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ad profiles"
ON public.ad_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Public read for active ad profiles (for swipe deck)
CREATE POLICY "Anyone can view active ad profiles"
ON public.ad_profiles
FOR SELECT
USING (is_active = true AND spotlight_end_date > now());

-- Function to get active ad profiles for swipe deck
CREATE OR REPLACE FUNCTION public.get_active_ad_profiles()
RETURNS TABLE (
  id UUID,
  ad_type ad_profile_type,
  linked_profile_id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  company_name TEXT,
  one_liner TEXT,
  industry TEXT[],
  stage TEXT,
  website_url TEXT,
  firm_name TEXT,
  typical_check_size TEXT,
  sectors_of_interest TEXT[],
  portfolio_link TEXT,
  external_company_name TEXT,
  service_description TEXT,
  cta_text TEXT,
  cta_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ap.id,
    ap.ad_type,
    ap.linked_profile_id,
    ap.name,
    ap.description,
    ap.image_url,
    ap.banner_url,
    ap.company_name,
    ap.one_liner,
    ap.industry,
    ap.stage,
    ap.website_url,
    ap.firm_name,
    ap.typical_check_size,
    ap.sectors_of_interest,
    ap.portfolio_link,
    ap.external_company_name,
    ap.service_description,
    ap.cta_text,
    ap.cta_url
  FROM public.ad_profiles ap
  WHERE ap.is_active = true 
    AND ap.spotlight_end_date > now()
    AND ap.spotlight_start_date <= now();
$$;

-- Trigger for updated_at
CREATE TRIGGER update_ad_profiles_updated_at
BEFORE UPDATE ON public.ad_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();