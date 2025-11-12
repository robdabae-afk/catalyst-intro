-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('founder', 'investor');

-- Create enum for funding stages
CREATE TYPE public.funding_stage AS ENUM ('pre-seed', 'seed', 'series-a', 'series-b');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create founder_profiles table
CREATE TABLE public.founder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_name TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  industry TEXT,
  traction TEXT,
  pitch_deck_url TEXT,
  preferred_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create investor_profiles table
CREATE TABLE public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  firm_name TEXT,
  typical_check_size TEXT,
  preferred_stage public.funding_stage,
  sectors_of_interest TEXT[],
  location TEXT,
  portfolio_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create coffee_chats table
CREATE TABLE public.coffee_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_date TIMESTAMP WITH TIME ZONE,
  meeting_location TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create safes table
CREATE TABLE public.safes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  valuation_cap DECIMAL(15, 2),
  discount_rate DECIMAL(5, 2),
  execution_date DATE,
  status TEXT DEFAULT 'draft',
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cap_table_entries table
CREATE TABLE public.cap_table_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  safe_id UUID REFERENCES public.safes(id) ON DELETE SET NULL,
  investment_amount DECIMAL(15, 2) NOT NULL,
  equity_percentage DECIMAL(5, 2),
  valuation DECIMAL(15, 2),
  investment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cap_table_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for founder_profiles
CREATE POLICY "Anyone can view founder profiles"
  ON public.founder_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own founder profile"
  ON public.founder_profiles FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own founder profile"
  ON public.founder_profiles FOR UPDATE
  USING (auth.uid() = profile_id);

-- RLS Policies for investor_profiles
CREATE POLICY "Anyone can view investor profiles"
  ON public.investor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own investor profile"
  ON public.investor_profiles FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own investor profile"
  ON public.investor_profiles FOR UPDATE
  USING (auth.uid() = profile_id);

-- RLS Policies for coffee_chats
CREATE POLICY "Users can view their own coffee chats"
  ON public.coffee_chats FOR SELECT
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Users can create coffee chats"
  ON public.coffee_chats FOR INSERT
  WITH CHECK (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Users can update their own coffee chats"
  ON public.coffee_chats FOR UPDATE
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

-- RLS Policies for safes
CREATE POLICY "Users can view their own SAFEs"
  ON public.safes FOR SELECT
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Founders can create SAFEs"
  ON public.safes FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update their own SAFEs"
  ON public.safes FOR UPDATE
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

-- RLS Policies for cap_table_entries
CREATE POLICY "Founders can view their cap table"
  ON public.cap_table_entries FOR SELECT
  USING (auth.uid() = founder_id);

CREATE POLICY "Founders can create cap table entries"
  ON public.cap_table_entries FOR INSERT
  WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can update their cap table entries"
  ON public.cap_table_entries FOR UPDATE
  USING (auth.uid() = founder_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.coffee_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.safes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.cap_table_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();