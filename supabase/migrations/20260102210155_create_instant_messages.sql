-- Create instant_messages table for direct messaging from discovery/swipe cards
CREATE TABLE public.instant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tokens_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_instant_messages_sender ON public.instant_messages(sender_id);
CREATE INDEX idx_instant_messages_receiver ON public.instant_messages(receiver_id);
CREATE INDEX idx_instant_messages_created_at ON public.instant_messages(created_at);

-- Enable RLS
ALTER TABLE public.instant_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view instant messages they sent or received"
ON public.instant_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send instant messages"
ON public.instant_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received instant messages (mark as read)"
ON public.instant_messages FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all instant messages"
ON public.instant_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add column to track instant message count for popularity
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instant_message_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_profiles_instant_message_count ON public.profiles(instant_message_count);

-- Function to increment instant message count
CREATE OR REPLACE FUNCTION public.increment_instant_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET instant_message_count = instant_message_count + 1
  WHERE id = NEW.receiver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment count
CREATE TRIGGER increment_instant_message_count_trigger
AFTER INSERT ON public.instant_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_instant_message_count();

