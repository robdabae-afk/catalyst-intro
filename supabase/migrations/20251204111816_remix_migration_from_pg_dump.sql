CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: funding_stage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.funding_stage AS ENUM (
    'pre-seed',
    'seed',
    'series-a',
    'series-b'
);


--
-- Name: user_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type AS ENUM (
    'founder',
    'investor'
);


--
-- Name: generate_safe_content(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_safe_content(safe_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: cap_table_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cap_table_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    founder_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    safe_id uuid,
    investment_amount numeric(15,2) NOT NULL,
    equity_percentage numeric(5,2),
    valuation numeric(15,2),
    investment_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: coffee_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coffee_chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    founder_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    proposed_date timestamp with time zone,
    meeting_location text,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: founder_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.founder_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    startup_name text NOT NULL,
    one_liner text NOT NULL,
    industry text,
    traction text,
    pitch_deck_url text,
    preferred_city text,
    created_at timestamp with time zone DEFAULT now(),
    company_name text,
    company_state text,
    company_address text
);


--
-- Name: investor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    firm_name text,
    typical_check_size text,
    preferred_stage public.funding_stage,
    sectors_of_interest text[],
    location text,
    portfolio_link text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_type public.user_type NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: safes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    founder_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    valuation_cap numeric(15,2),
    discount_rate numeric(5,2),
    execution_date date,
    status text DEFAULT 'draft'::text,
    document_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    founder_signed_at timestamp with time zone,
    founder_signature_data text,
    investor_signed_at timestamp with time zone,
    investor_signature_data text
);


--
-- Name: swipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swiper_id uuid NOT NULL,
    swiped_id uuid NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT swipes_action_check CHECK ((action = ANY (ARRAY['like'::text, 'pass'::text])))
);


--
-- Name: cap_table_entries cap_table_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_entries
    ADD CONSTRAINT cap_table_entries_pkey PRIMARY KEY (id);


--
-- Name: coffee_chats coffee_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coffee_chats
    ADD CONSTRAINT coffee_chats_pkey PRIMARY KEY (id);


--
-- Name: founder_profiles founder_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_profiles
    ADD CONSTRAINT founder_profiles_pkey PRIMARY KEY (id);


--
-- Name: founder_profiles founder_profiles_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_profiles
    ADD CONSTRAINT founder_profiles_profile_id_key UNIQUE (profile_id);


--
-- Name: investor_profiles investor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_profiles
    ADD CONSTRAINT investor_profiles_pkey PRIMARY KEY (id);


--
-- Name: investor_profiles investor_profiles_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_profiles
    ADD CONSTRAINT investor_profiles_profile_id_key UNIQUE (profile_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: safes safes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safes
    ADD CONSTRAINT safes_pkey PRIMARY KEY (id);


--
-- Name: swipes swipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_pkey PRIMARY KEY (id);


--
-- Name: swipes swipes_swiper_id_swiped_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiper_id_swiped_id_key UNIQUE (swiper_id, swiped_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_sender_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender_receiver ON public.messages USING btree (sender_id, receiver_id);


--
-- Name: cap_table_entries set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cap_table_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: coffee_chats set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coffee_chats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: safes set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.safes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cap_table_entries cap_table_entries_founder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_entries
    ADD CONSTRAINT cap_table_entries_founder_id_fkey FOREIGN KEY (founder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: cap_table_entries cap_table_entries_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_entries
    ADD CONSTRAINT cap_table_entries_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: cap_table_entries cap_table_entries_safe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_entries
    ADD CONSTRAINT cap_table_entries_safe_id_fkey FOREIGN KEY (safe_id) REFERENCES public.safes(id) ON DELETE SET NULL;


--
-- Name: coffee_chats coffee_chats_founder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coffee_chats
    ADD CONSTRAINT coffee_chats_founder_id_fkey FOREIGN KEY (founder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: coffee_chats coffee_chats_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coffee_chats
    ADD CONSTRAINT coffee_chats_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: founder_profiles founder_profiles_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_profiles
    ADD CONSTRAINT founder_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: investor_profiles investor_profiles_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_profiles
    ADD CONSTRAINT investor_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: safes safes_founder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safes
    ADD CONSTRAINT safes_founder_id_fkey FOREIGN KEY (founder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: safes safes_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safes
    ADD CONSTRAINT safes_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: founder_profiles Anyone can view founder profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view founder profiles" ON public.founder_profiles FOR SELECT USING (true);


--
-- Name: investor_profiles Anyone can view investor profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view investor profiles" ON public.investor_profiles FOR SELECT USING (true);


--
-- Name: safes Founders can create SAFEs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Founders can create SAFEs" ON public.safes FOR INSERT WITH CHECK ((auth.uid() = founder_id));


--
-- Name: cap_table_entries Founders can create cap table entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Founders can create cap table entries" ON public.cap_table_entries FOR INSERT WITH CHECK ((auth.uid() = founder_id));


--
-- Name: cap_table_entries Founders can update their cap table entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Founders can update their cap table entries" ON public.cap_table_entries FOR UPDATE USING ((auth.uid() = founder_id));


--
-- Name: cap_table_entries Founders can view their cap table; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Founders can view their cap table" ON public.cap_table_entries FOR SELECT USING ((auth.uid() = founder_id));


--
-- Name: safes Investors can sign their SAFEs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Investors can sign their SAFEs" ON public.safes FOR UPDATE USING ((auth.uid() = investor_id));


--
-- Name: safes Investors can view SAFEs they're part of; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Investors can view SAFEs they're part of" ON public.safes FOR SELECT USING ((auth.uid() = investor_id));


--
-- Name: coffee_chats Users can create coffee chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create coffee chats" ON public.coffee_chats FOR INSERT WITH CHECK (((auth.uid() = founder_id) OR (auth.uid() = investor_id)));


--
-- Name: swipes Users can create swipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create swipes" ON public.swipes FOR INSERT WITH CHECK ((auth.uid() = swiper_id));


--
-- Name: founder_profiles Users can insert their own founder profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own founder profile" ON public.founder_profiles FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: investor_profiles Users can insert their own investor profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own investor profile" ON public.investor_profiles FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: swipes Users can see swipes on them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can see swipes on them" ON public.swipes FOR SELECT USING ((auth.uid() = swiped_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: messages Users can update messages they received; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages they received" ON public.messages FOR UPDATE USING ((auth.uid() = receiver_id));


--
-- Name: safes Users can update their own SAFEs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own SAFEs" ON public.safes FOR UPDATE USING (((auth.uid() = founder_id) OR (auth.uid() = investor_id)));


--
-- Name: coffee_chats Users can update their own coffee chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own coffee chats" ON public.coffee_chats FOR UPDATE USING (((auth.uid() = founder_id) OR (auth.uid() = investor_id)));


--
-- Name: founder_profiles Users can update their own founder profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own founder profile" ON public.founder_profiles FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: investor_profiles Users can update their own investor profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own investor profile" ON public.investor_profiles FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: safes Users can view their own SAFEs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own SAFEs" ON public.safes FOR SELECT USING (((auth.uid() = founder_id) OR (auth.uid() = investor_id)));


--
-- Name: coffee_chats Users can view their own coffee chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own coffee chats" ON public.coffee_chats FOR SELECT USING (((auth.uid() = founder_id) OR (auth.uid() = investor_id)));


--
-- Name: messages Users can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));


--
-- Name: swipes Users can view their own swipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own swipes" ON public.swipes FOR SELECT USING ((auth.uid() = swiper_id));


--
-- Name: cap_table_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cap_table_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: coffee_chats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coffee_chats ENABLE ROW LEVEL SECURITY;

--
-- Name: founder_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: investor_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: safes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.safes ENABLE ROW LEVEL SECURITY;

--
-- Name: swipes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


