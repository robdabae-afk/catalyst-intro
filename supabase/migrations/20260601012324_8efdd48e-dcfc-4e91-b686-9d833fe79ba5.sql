ALTER TABLE public.event_attendees ADD COLUMN email text NULL;

DROP POLICY IF EXISTS "Anyone can sign in at event" ON public.event_attendees;

CREATE POLICY "Anyone can sign in at event" ON public.event_attendees
FOR INSERT
TO public
WITH CHECK (
  consent_accepted = true
  AND length(full_name) >= 2 AND length(full_name) <= 120
  AND length(phone) >= 7 AND length(phone) <= 20
  AND (email IS NULL OR (email LIKE '%@%.%' AND length(email) <= 255))
);