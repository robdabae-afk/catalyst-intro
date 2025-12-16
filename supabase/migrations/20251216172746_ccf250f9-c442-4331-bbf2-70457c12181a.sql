-- Add pitch_deck_visibility column to founder_profiles
ALTER TABLE public.founder_profiles 
ADD COLUMN pitch_deck_visibility text NOT NULL DEFAULT 'public' 
CHECK (pitch_deck_visibility IN ('public', 'private'));