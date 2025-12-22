-- Create table to store user feedback
CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table to track feedback prompts
CREATE TABLE public.feedback_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  last_prompt_at timestamp with time zone,
  last_feedback_at timestamp with time zone,
  admin_requested_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_feedback
CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.user_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.user_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for feedback_prompts
CREATE POLICY "Users can view their own prompt status"
ON public.feedback_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt status"
ON public.feedback_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt status"
ON public.feedback_prompts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all prompt statuses"
ON public.feedback_prompts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prompt statuses"
ON public.feedback_prompts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_feedback_prompts_updated_at
BEFORE UPDATE ON public.feedback_prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();