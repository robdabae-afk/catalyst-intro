-- Create swipes table to track likes and passes
CREATE TABLE public.swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID NOT NULL,
  swiped_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(swiper_id, swiped_id)
);

-- Enable RLS
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- Users can view their own swipes
CREATE POLICY "Users can view their own swipes"
ON public.swipes
FOR SELECT
USING (auth.uid() = swiper_id);

-- Users can create their own swipes
CREATE POLICY "Users can create swipes"
ON public.swipes
FOR INSERT
WITH CHECK (auth.uid() = swiper_id);

-- Users can see swipes on them (for match detection)
CREATE POLICY "Users can see swipes on them"
ON public.swipes
FOR SELECT
USING (auth.uid() = swiped_id);