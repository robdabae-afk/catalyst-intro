
# /match — Live Event Matching Platform

A standalone app at `catalystintro.com/match`, independent from the main `/app`. Founders and investors create dedicated `/match` accounts, join a live event with an event code, investors browse founders and express funding interest, and matched pairs chat and exchange documents.

## Scope

- New route tree under `/match/*` — separate from existing app routes.
- Separate accounts (own profiles table); reuses the same Supabase auth users but with a `match_profiles` row that is independent from the main `profiles` table.
- Event-code gating; users are only visible/active inside an event window.
- Investor → "Interested" action triggers email + in-app notification and unlocks chat.
- Document requests use a preset list; founders upload on demand and the investor downloads from the chat thread.

## User Flows

### Founder
1. Visit `/match` → sign up / log in.
2. Complete founder profile: name, photo, startup name, one-liner, industry, stage, traction, pitch deck (optional), funding amount, location.
3. Enter event code to join an event.
4. Receives email + in-app notification when an investor expresses interest.
5. Chats with interested investors; uploads requested documents inside the chat.

### Investor
1. Visit `/match` → sign up / log in.
2. Complete investor profile: name, photo, firm, accredited/institutional flag, average check size, investment philosophy.
3. Enter event code to join an event.
4. Browse founders attending the same event (card/list view).
5. Tap "Interested" on a founder → chat unlocks, founder notified.
6. Chat and request documents.

### Admin
- Create events (name, code, start/end time).
- View attendee list per event.
- Toggle event active/inactive.

## Data Model

New tables, all separate from existing main-app tables:

- `match_profiles` — id (= auth.uid), role ('founder'|'investor'), name, avatar_url, created_at.
- `match_founder_profiles` — profile_id, startup_name, one_liner, industry[], stage, traction, funding_amount, pitch_deck_url, location.
- `match_investor_profiles` — profile_id, firm_name, accreditation ('accredited'|'institutional'|'none'), avg_check_size, philosophy.
- `match_events` — id, name, code (unique), starts_at, ends_at, is_active, created_by.
- `match_event_attendees` — event_id, profile_id, joined_at. Visibility = membership in same event with overlapping active window.
- `match_interests` — id, event_id, investor_id, founder_id, created_at. Unique per (event, investor, founder). Creating one unlocks the chat thread.
- `match_threads` — id, event_id, investor_id, founder_id, created_at.
- `match_messages` — id, thread_id, sender_id, content, created_at.
- `match_document_requests` — id, thread_id, requester_id, doc_type ('pitch_deck'|'cap_table'|'incorporation'|'financials'|'other'), note, status ('pending'|'fulfilled'|'declined'), file_url, created_at, fulfilled_at.
- `match_notifications` — id, user_id, type, payload jsonb, read_at, created_at.

Storage bucket: `match-documents` (private), RLS scoped to thread participants.

RLS: every table enables RLS. Profiles visible to other attendees of the same active event. Interests, threads, messages, document requests scoped strictly to the two participants. Admin role bypass via existing `has_role(auth.uid(),'admin')`.

## Notifications

- In-app: `match_notifications` rows + Supabase Realtime subscription on the client; badge in `/match` nav.
- Email: a new app-email template `match-interest` sent via the existing `send-transactional-email` function with idempotency key `interest-{interest_id}`. Triggered from the "Express interest" action (edge function `match-express-interest`) so it runs server-side.

## Chat

- Realtime via `ALTER PUBLICATION supabase_realtime ADD TABLE match_messages`.
- Thread auto-created on first interest. Both sides can send.

## Document Requests

- Preset doc-type dropdown inside chat ("Request document" button).
- Founder sees pending requests at the top of the thread; tapping "Upload" opens a file picker that writes to `match-documents/{thread_id}/{request_id}.{ext}` and flips status to fulfilled.
- Investor downloads via signed URL.

## Routing & UI

- `src/pages/match/` directory with: `MatchLanding`, `MatchAuth`, `MatchOnboarding` (founder + investor variants), `MatchEventJoin`, `MatchDiscover` (investor browse), `MatchInbox` (founder + investor threads), `MatchThread`, `MatchAdminEvents`.
- New `MatchLayout` with its own header/nav, completely separate from `AppNavigation`.
- Add routes under `/match/*` in `App.tsx` with a dedicated `MatchAuthGuard`.
- Visual style matches existing "Silver & Sleek" tokens for consistency.

## Edge Functions

- `match-express-interest`: validates same-event membership, inserts interest + thread, inserts notification, calls `send-transactional-email`.
- `match-join-event`: validates event code + active window, inserts attendee row.
- `match-request-signed-url`: returns signed URL for a fulfilled document request (verifies caller is thread participant).

## Out of Scope (this iteration)

- Payments / SAFE generation / cap-table tooling (not requested for /match).
- Founder swiping on investors (only investors initiate interest).
- Reusing main-app profiles (explicitly separate accounts per your answer).

## Build Order

1. Migration: all `match_*` tables, RLS, storage bucket, realtime publication.
2. `/match` routes, auth, layout, onboarding (founder + investor).
3. Event join + admin event management.
4. Investor discovery + Interested action + edge function + email template.
5. Threads, messages, realtime chat.
6. Document request flow + signed-URL function.
7. In-app notifications + nav badge.
