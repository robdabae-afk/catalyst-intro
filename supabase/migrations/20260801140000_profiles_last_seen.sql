-- Presence: green dot = online (recent heartbeat), white dot = active in last 12h
ALTER TABLE public.profiles
  ADD COLUMN last_seen_at timestamptz;
