-- Add sender_id column to track who created the invite
ALTER TABLE public.coffee_chats ADD COLUMN sender_id uuid REFERENCES auth.users(id);

-- Update existing invites to have sender_id (set to founder_id as default since we can't know)
UPDATE public.coffee_chats SET sender_id = founder_id WHERE sender_id IS NULL;