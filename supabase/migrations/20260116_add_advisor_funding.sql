-- Create advisor_investments table
CREATE TABLE IF NOT EXISTS "public"."advisor_investments" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "founder_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "advisor_name" text NOT NULL,
    "advisor_user_id" uuid REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    "amount" numeric NOT NULL,
    "investment_date" date DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."advisor_investments" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view advisor investments" ON "public"."advisor_investments"
    FOR SELECT USING (true);

CREATE POLICY "Founders can insert their own advisor investments" ON "public"."advisor_investments"
    FOR INSERT WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Founders can update their own advisor investments" ON "public"."advisor_investments"
    FOR UPDATE USING (auth.uid() = founder_id);

CREATE POLICY "Founders can delete their own advisor investments" ON "public"."advisor_investments"
    FOR DELETE USING (auth.uid() = founder_id);
