# Backend activation status

The feature flag defaults off. The new admin and member preview use local demo data on that device until the platform backend is explicitly enabled. A demo admin switch never grants access to a real database.

## What was verified locally

`npm run build` and `npm run typecheck` passed after the backend/schema commits. `src/platform/contract-check.ts` makes the real API compile against the UI contract. A fresh PostgreSQL 16 database with mocked Supabase `auth.uid` and storage tables applied only the new migration successfully. `tests/platform-rls.sql` passed for private profiles, role escalation, owner-only notifications, attendee-only event access, draft visibility, declined-request bypass, check-in/cancellation, scoped announcements, question moderation, thread read upserts and capacity guards.

Two concurrent final-seat RSVP calls produced one approved and one waitlisted attendee. Two concurrent administrator self-demotions produced one successful demotion and one last-admin refusal, leaving one administrator. These are local SQL checks, not a live Supabase HTTP integration test.

The existing project was probed read-only. Its platform tables are not installed. No live schema, waitlist policy, auth trigger or other product data was changed.

## Required before live activation

Follow `PLATFORM-SETUP.md` to apply only `20261006070000_platform.sql` in staging, then bootstrap a verified first administrator with the guarded SQL. Validate JWT/RLS behavior, Storage upload MIME/size enforcement and the full admin-create/member-RSVP/admin-check-in flow against that staging project before enabling `VITE_PLATFORM_BACKEND_ENABLED=true` in a deployment.

Keep `VITE_PLATFORM_ALLOW_SHARED_SIGNUP=false`. Shared `auth.users` has a legacy trigger that creates legacy founder profiles and referrals for new accounts. This implementation blocks new platform signup by default instead of silently changing that legacy trigger. Choose isolated Auth or explicitly approve a separate rollout change. Existing confirmed accounts can sign in.

## Deliberate limits

This is a community/events and preview-listing backend. It has no payment, money movement, investment execution or real portfolio holdings. Preview listing amounts are not live fundraising statistics. The 28,000 number describes the community, not application accounts.

Pending requests do not reserve seats. Cancelling does not automatically promote a waitlisted person; admins explicitly approve them after capacity becomes available. Threads and membership are administrator-managed in SQL; member-initiated conversation creation is not implemented. Notifications are in-app, not email or push. Hiding a question removes it from the deal, but does not redact answer text already delivered to its author in a notification. Moderation is not a global content recall. Cover validation enforces claimed MIME/size and extension; trusted server-side image decoding/re-encoding remains required to verify actual bytes against spoofed media.

Member adapter routes cover `/app/swipe`, `/app/discover`, `/app/deal/:id`, `/app/events`, `/app/events/:id`, `/app/inbox`, `/app/inbox/:id`, `/app/notifications` and `/app/profile`. The protected legacy routes remain unchanged. `/app/invest/:id`, `/app/holdings` and `/app/account/*` remain the earlier local-only preview; their content is not a real account, portfolio, payment or investment system. Use `/app/profile` for the new platform profile and notification preferences.

Browser evidence is recorded separately in `/tmp/catalyst-admin/browser-qa.md`, `member-browser-qa.md` and `content-browser-qa.md`. Only executed flows in those reports count as browser verification. Demo browser checks do not establish real Supabase activation.
