# Isolated Catalyst platform setup

The platform backend is opt-in. It is a community and preview-deal application, not an investment/payment processor. Existing `profiles`, auth triggers, user roles, waitlist policies, and the old product are untouched. The platform uses new `public.platform_*` tables and its own roles. Database `user` maps to UI `member`; `admin` maps unchanged. Community size defaults to 28,000.

## Apply exactly one new migration

Review `supabase/migrations/20261006070000_platform.sql`, back up the target database, and test against a disposable Supabase project first. Apply **only that file** via the Supabase SQL editor or a privileged `psql` connection with `ON_ERROR_STOP=1`. It is transactional and intended to run once. Do not run a historical bulk `supabase db push`: this repository has old migration history and seed files that are unrelated to this isolated rollout. Do not apply these regression fixtures to production.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261006070000_platform.sql
```

Do not expose database credentials or a service-role key in the client. Client calls use the project's public anon key and the authenticated user's JWT. Keep the platform feature flag disabled until schema, first admin, and storage upload behavior are verified. The contract proposes `VITE_PLATFORM_BACKEND_ENABLED=true`; use the actual flag consumed by the API implementation.

## Bootstrap the verified first admin

Have the intended administrator sign up and verify their email normally. Independently verify ownership of that address, then replace the example literal below in the privileged SQL editor. Do not infer this permission from an existing legacy role, user metadata, a public form, or an unverified email. This SQL requires exactly one confirmed account and refuses to run once an admin exists.

```sql
DO $$
DECLARE u auth.users;
BEGIN
  PERFORM 1 FROM public.platform_settings WHERE id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.platform_profiles WHERE role='admin') THEN
    RAISE EXCEPTION 'An admin already exists. Use the authenticated role-change RPC.';
  END IF;
  SELECT * INTO STRICT u FROM auth.users
    WHERE lower(email)=lower('REPLACE_WITH_VERIFIED_ADMIN_EMAIL')
      AND email_confirmed_at IS NOT NULL;
  INSERT INTO public.platform_profiles(id,email,name,role)
    VALUES(u.id,u.email,'','admin')
    ON CONFLICT(id) DO UPDATE SET email=excluded.email,role='admin';
END $$;
```

Subsequent role changes must use `platform_set_role`. It serializes changes with a settings-row lock and prevents removal of the last admin. Never delete the last administrator directly in Auth or privileged SQL. This guard cannot protect against database-owner/service-role operations outside the platform.

## RPC and field contract

All SQL field names are snake_case; map to the requested camelCase in the API. Foreign keys reference `platform_profiles` so call `platform_ensure_profile()` after sign-in, before community writes. It derives email from `auth.users`, defaults role to `user`, and ignores metadata role. Only `name`, `city`, `bio`, `interests`, and `notif_prefs` can be directly updated. Email synchronization is not automatic; existing profile email remains a server-managed snapshot.

`platform_rsvp(p_event_id uuid, p_cancel boolean default false)` returns an RSVP row and is the only member RSVP write path. It locks the event row, makes active repeated RSVP calls idempotent, and chooses `approved`, `pending`, or `waitlisted` from capacity and settings. Cancellation clears check-in. Seats count only approved RSVPs; pending requests do not reserve seats. There is no automatic waitlist promotion after cancellation.

`platform_admin_rsvp(p_rsvp_id uuid, p_status text default null, p_check_in boolean default null)` returns the updated RSVP. Use it for status and check-in changes; null preserves the existing field. Approval locks the event and verifies capacity, even for admins. Check-in requires approved status. Direct table RSVP writes are not granted. Event capacity decreases below approved occupancy are also rejected.

`platform_moderate_question(p_question_id uuid, p_answer text default null, p_hidden boolean default null)` handles admin answer/hide updates. Null means leave unchanged; empty string can clear answer text. Members can insert only `deal_id`, `user_id`, and `body`, and cannot forge moderation fields. Members see only unhidden questions on preview deals.

`platform_event_counts(p_event_id uuid default null)` returns `event_id`, `going_count`, `waitlist_count`. Anonymous clients can request published-event aggregates, never the attendee roster. Authenticated admins additionally receive draft/cancelled aggregates. Members read only their own RSVP rows; admins may join profiles to supply attendee name/email.

`platform_member_names(p_user_ids uuid[])` returns only `id`/`name`, capped at 100 requested IDs. It exposes display names only for the caller, admins, visible preview Q&A authors, and shared-thread members. Use it for `memberName` and `senderName`, rather than broad profile SELECT that would leak emails. Admins can join `platform_profiles` directly. `rsvpCount` and admin stats can be computed with admin-only table queries; no privileged stats RPC is needed.

`platform_announce(p_title text, p_body text, p_audience jsonb)` accepts JSON string `"all"`, JSON string `"admins"`, or exactly `{ "eventId": "uuid" }`. It creates the announcement and all scoped notifications in one transaction. Event audience means approved, pending, or waitlisted attendees, not declined/cancelled users. Title/body and audience are bounded. Use this RPC, not separate announcement/notification inserts, for sending.

`platform_waitlist(p_query text default '', p_limit integer default 50, p_offset integer default 0)` is admin-only and returns `{rows,total}` from the existing `waitlist_signups` table, without changing its table or policies. Filtering is literal case-insensitive substring, not SQL wildcard matching. Limit is 1–100, offset 0–1,000,000, query at most 200 characters. Legacy entries have no `source` column, so response `source` is null. Rows use snake_case `created_at`.

Thread creation/membership is admin-managed. Members can only read joined threads, insert messages as themselves in joined threads, and upsert their own `platform_thread_reads.read_at`. Message inserts update `threads.last_message_at` through a trusted trigger. Notification owners can update only `read_at`, never payload or ownership. Safe profile and notification column grants also apply to admins; use privileged RPCs for restricted operations. No arbitrary investment, monetary balance, raised amount, backer, or portfolio-position fields exist.

## Covers

`platform-covers` is a public bucket with a 5 MiB object limit and only `image/jpeg`, `image/png`, `image/webp` MIME types. Authenticated admins alone may write; policies also require jpg/jpeg/png/webp extensions. SVG is not allowed. Upload paths should use generated UUIDs and a recognized extension. Client validation is useful, but MIME/extension controls alone cannot prove file contents. For untrusted admin-supplied uploads, use trusted server-side image decoding/re-encoding and magic-byte validation before upload. Bucket/public-object URLs are intentionally public, so do not upload private documents. Existing storage buckets/policies are unchanged.

## Test and deployment checks

Run `tests/platform-rls.sql` as database owner against a disposable local Supabase database with this migration applied. It creates fixtures inside a transaction and rolls them back. Assertions cover metadata escalation, safe column grants, private profiles/threads/notifications, anonymous access, forged Q&A, foreign-thread messaging, RSVP capacity, scoped announcements, and the last-admin guard. The local PostgreSQL validation used a minimal `auth.uid`/storage fixture, not a live project; verify real Supabase Storage HTTP size/MIME enforcement separately.

```sh
psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/platform-rls.sql
```

Also test two concurrent RSVP approvals for the final seat and simultaneous role demotions. Verify uploaded cover headers/content, session role mapping, disabled-feature behavior, and signup/profile bootstrap in staging. No live database was modified as part of development.
