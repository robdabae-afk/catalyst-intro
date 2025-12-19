-- Create match_status enum for tracking conversation states
CREATE TYPE match_status AS ENUM ('active', 'unmatched', 'successful_collaboration');

-- Create matches table to track active conversations with their status
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'active',
  first_message_sender_id uuid REFERENCES auth.users(id),
  first_message_at timestamp with time zone,
  marked_successful_by uuid REFERENCES auth.users(id),
  marked_successful_at timestamp with time zone,
  unmatched_by uuid REFERENCES auth.users(id),
  unmatched_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_match UNIQUE (user_1_id, user_2_id),
  CONSTRAINT different_users CHECK (user_1_id != user_2_id)
);

-- Add index for faster lookups
CREATE INDEX idx_matches_user_1 ON public.matches(user_1_id);
CREATE INDEX idx_matches_user_2 ON public.matches(user_2_id);
CREATE INDEX idx_matches_status ON public.matches(status);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can update their own matches"
ON public.matches FOR UPDATE
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "System can insert matches"
ON public.matches FOR INSERT
WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Add weekly_initiation tracking to profiles for Pro Founders
ALTER TABLE public.profiles 
ADD COLUMN weekly_initiations_count integer NOT NULL DEFAULT 0,
ADD COLUMN weekly_initiations_reset_at timestamp with time zone;

-- Create trigger to update updated_at on matches
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to get active conversation count for a user
CREATE OR REPLACE FUNCTION public.get_active_conversation_count(user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.matches
  WHERE (user_1_id = user_id OR user_2_id = user_id)
    AND status = 'active';
$$;

-- Function to check if investor sent first message in a match
CREATE OR REPLACE FUNCTION public.investor_sent_first_message(match_id uuid, founder_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT first_message_sender_id IS NOT NULL AND first_message_sender_id != founder_id
     FROM public.matches
     WHERE id = match_id),
    false
  );
$$;

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;