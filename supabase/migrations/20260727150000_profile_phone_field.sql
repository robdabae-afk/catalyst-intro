-- Optional phone number, shown in Basic Information on the Settings page
ALTER TABLE public.profiles
  ADD COLUMN phone text;
