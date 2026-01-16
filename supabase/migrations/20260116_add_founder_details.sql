-- Add new columns to founder_profiles
ALTER TABLE "public"."founder_profiles" 
ADD COLUMN IF NOT EXISTS "user_growth" text,
ADD COLUMN IF NOT EXISTS "burn_rate" text,
ADD COLUMN IF NOT EXISTS "last_round" text,
ADD COLUMN IF NOT EXISTS "valuation" text;

-- Create team_members table
CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "founder_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "role" text NOT NULL,
    "image_url" text,
    "linkedin_url" text,
    "is_core" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create funding_rounds table
CREATE TABLE IF NOT EXISTS "public"."funding_rounds" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "founder_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "round_type" text NOT NULL,
    "amount" numeric,
    "date" date,
    "valuation" numeric,
    "investors" text[],
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."funding_rounds" ENABLE ROW LEVEL SECURITY;

-- Policies for team_members
CREATE POLICY "Users can view team members" ON "public"."team_members"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own team members" ON "public"."team_members"
    FOR INSERT WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update their own team members" ON "public"."team_members"
    FOR UPDATE USING (auth.uid() = founder_id);

CREATE POLICY "Users can delete their own team members" ON "public"."team_members"
    FOR DELETE USING (auth.uid() = founder_id);

-- Policies for funding_rounds
CREATE POLICY "Users can view funding rounds" ON "public"."funding_rounds"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own funding rounds" ON "public"."funding_rounds"
    FOR INSERT WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update their own funding rounds" ON "public"."funding_rounds"
    FOR UPDATE USING (auth.uid() = founder_id);

CREATE POLICY "Users can delete their own funding rounds" ON "public"."funding_rounds"
    FOR DELETE USING (auth.uid() = founder_id);
