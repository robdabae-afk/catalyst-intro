
CREATE OR REPLACE FUNCTION public.match_is_co_attendee(_event_id uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_event_attendees
    WHERE event_id = _event_id AND profile_id = _user
  );
$$;

DROP POLICY IF EXISTS "co-attendees read attendance" ON public.match_event_attendees;

CREATE POLICY "co-attendees read attendance"
ON public.match_event_attendees
FOR SELECT
TO authenticated
USING (public.match_is_co_attendee(event_id, auth.uid()));
