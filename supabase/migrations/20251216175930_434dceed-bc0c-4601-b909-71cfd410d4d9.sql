-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'closed');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update tickets (to close them)
CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for support_messages
-- Users can view messages on their tickets
CREATE POLICY "Users can view messages on their tickets"
ON public.support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Users can send messages on their tickets
CREATE POLICY "Users can send messages on their tickets"
ON public.support_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.support_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can send messages on any ticket
CREATE POLICY "Admins can send messages"
ON public.support_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  public.has_role(auth.uid(), 'admin')
);

-- Create trigger for updated_at on tickets
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;