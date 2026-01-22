-- Create discover_resets table to track when users reset their swipe history
CREATE TABLE IF NOT EXISTS public.discover_resets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reset_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discover_resets ENABLE ROW LEVEL SECURITY;

-- Users can view their own reset timestamp
CREATE POLICY "Users can view their own reset"
  ON public.discover_resets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reset
CREATE POLICY "Users can insert their own reset"
  ON public.discover_resets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reset
CREATE POLICY "Users can update their own reset"
  ON public.discover_resets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update swipes action check constraint to allow 'priority' action
ALTER TABLE public.swipes DROP CONSTRAINT IF EXISTS swipes_action_check;
ALTER TABLE public.swipes ADD CONSTRAINT swipes_action_check 
  CHECK (action IN ('like', 'pass', 'priority'));

-- Add index for efficient swipe history queries
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_swiped_created
  ON public.swipes (swiper_id, swiped_id, created_at DESC);