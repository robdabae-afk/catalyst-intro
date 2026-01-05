-- Create user_activity_logs table for Heatmap
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    activity_type text CHECK (activity_type IN ('swipe', 'message', 'profile_update')),
    created_at timestamptz DEFAULT now()
);

-- Index for faster queries on logs
CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_idx ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS user_activity_logs_created_at_idx ON public.user_activity_logs(created_at);

-- Create history_access table for Token Gating
CREATE TABLE IF NOT EXISTS public.history_access (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_id uuid REFERENCES auth.users(id) NOT NULL,
    target_profile_id uuid REFERENCES public.profiles(id) NOT NULL,
    granted_at timestamptz DEFAULT now(),
    UNIQUE(viewer_id, target_profile_id)
);

-- Function: Get Response Metrics
CREATE OR REPLACE FUNCTION get_response_metrics(profile_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    total_threads int;
    replied_threads int;
    avg_minutes numeric;
    result json;
BEGIN
    -- Get total threads where user received a message (as a starter)
    -- Simplification: A "thread" is defined by a unique sender for the receiver.
    -- We count threads where the user is the receiver of the first message?
    -- Actually, simpler: Count all unique senders who sent messages TO this user.
    SELECT COUNT(DISTINCT sender_id)
    INTO total_threads
    FROM public.messages
    WHERE receiver_id = profile_id;

    -- Count threads where user replied (sent a message back to that sender)
    SELECT COUNT(DISTINCT m1.sender_id)
    INTO replied_threads
    FROM public.messages m1
    WHERE m1.receiver_id = profile_id
    AND EXISTS (
        SELECT 1 FROM public.messages m2
        WHERE m2.sender_id = profile_id
        AND m2.receiver_id = m1.sender_id
    );

    -- Calculate Average Reply Time
    -- For each thread (where they replied), find difference between first receive and first reply.
    WITH thread_start AS (
        SELECT sender_id, MIN(created_at) as first_received
        FROM public.messages
        WHERE receiver_id = profile_id
        GROUP BY sender_id
    ),
    first_reply AS (
        SELECT receiver_id as responder_target, MIN(created_at) as first_sent
        FROM public.messages
        WHERE sender_id = profile_id
        GROUP BY receiver_id
    )
    SELECT AVG(EXTRACT(EPOCH FROM (fr.first_sent - ts.first_received))/60)
    INTO avg_minutes
    FROM thread_start ts
    JOIN first_reply fr ON ts.sender_id = fr.responder_target
    WHERE fr.first_sent > ts.first_received;

    -- Format
    result := json_build_object(
        'response_rate', CASE WHEN total_threads > 0 THEN ROUND((replied_threads::numeric / total_threads) * 100) ELSE 0 END,
        'avg_reply_time', CASE
            WHEN avg_minutes IS NULL THEN 'N/A'
            WHEN avg_minutes < 60 THEN ROUND(avg_minutes) || 'm'
            WHEN avg_minutes < 1440 THEN ROUND(avg_minutes / 60) || 'h'
            ELSE ROUND(avg_minutes / 1440) || 'd'
        END
    );

    RETURN result;
END;
$$;

-- Function: Get Active Deals Count
CREATE OR REPLACE FUNCTION get_active_deals_count(profile_id uuid, user_type text)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    count_val int;
BEGIN
    IF user_type = 'founder' THEN
        -- Safes where they are the founder
        SELECT COUNT(*) INTO count_val FROM public.safes WHERE founder_id = profile_id;
    ELSE
        -- Safes where they are investor + Matches active
        SELECT
            (SELECT COUNT(*) FROM public.safes WHERE investor_id = profile_id) +
            (SELECT COUNT(*) FROM public.matches WHERE (user_1_id = profile_id OR user_2_id = profile_id) AND status = 'active')
        INTO count_val;
    END IF;

    RETURN count_val;
END;
$$;

-- Function: Get Activity Heatmap (Last 90 days)
CREATE OR REPLACE FUNCTION get_activity_heatmap(profile_id uuid)
RETURNS int[]
LANGUAGE plpgsql
AS $$
DECLARE
    daily_counts int[];
    i int;
    day_date date;
    cnt int;
BEGIN
    daily_counts := ARRAY[]::int[];
    -- Loop 90 days back to today
    FOR i IN 0..89 LOOP
        day_date := current_date - (89 - i); -- 0 is 89 days ago, 89 is today

        SELECT COUNT(*)
        INTO cnt
        FROM public.user_activity_logs
        WHERE user_id = profile_id
        AND created_at::date = day_date;

        daily_counts := daily_counts || cnt;
    END LOOP;

    RETURN daily_counts;
END;
$$;

-- Function: Unlock Deal History
CREATE OR REPLACE FUNCTION unlock_deal_history(viewer_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cost int;
    current_credits int;
    user_plan text;
BEGIN
    -- Check if already unlocked
    IF EXISTS (SELECT 1 FROM public.history_access WHERE viewer_id = $1 AND target_profile_id = $2) THEN
        RETURN true;
    END IF;

    -- Determine cost based on subscription
    SELECT subscription_plan, spotlight_credits INTO user_plan, current_credits
    FROM public.profiles
    WHERE id = viewer_id;

    IF user_plan = 'pro' THEN
        cost := 2;
    ELSE
        cost := 10; -- Basic
    END IF;

    -- Check balance
    IF current_credits < cost THEN
        RETURN false;
    END IF;

    -- Deduct credits
    UPDATE public.profiles
    SET spotlight_credits = spotlight_credits - cost
    WHERE id = viewer_id;

    -- Grant access
    INSERT INTO public.history_access (viewer_id, target_profile_id)
    VALUES (viewer_id, target_id);

    RETURN true;
END;
$$;
