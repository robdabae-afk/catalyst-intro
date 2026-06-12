
ALTER TABLE public.match_events ALTER COLUMN starts_at DROP NOT NULL;
ALTER TABLE public.match_events ALTER COLUMN ends_at DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.match_share_active_event(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_event_attendees a
    JOIN public.match_event_attendees b ON a.event_id = b.event_id
    JOIN public.match_events e ON e.id = a.event_id
    WHERE a.profile_id = _a AND b.profile_id = _b
      AND e.is_active = true
  );
$$;
