# /home Community Feed

A new community feed at `/home` (and `/app/home`) with four stacked sections, plus admin controls. Existing `/dashboard` (Discover) and all other pages are untouched.

## Sections (top to bottom)

1. **Hot this week** — role-aware: founders see hot investors, investors see hot founders. Source priority: admin-pinned for the current ISO week → most express-interests received in last 7 days → newest profiles. Show 6 avatars in a horizontal scroller, tap → existing `/profile/:id`.
2. **Events this week** — upcoming `match_events` where `start_at` is within the next 7 days, ordered by start time. Title, date/time, location, link to event.
3. **Today's news** — the single admin-posted news item for today (title, optional body, optional link, optional image).
4. **Newsletter submission** — a single button opening a dialog: title, link (optional), short note (≤500 chars). Saves to a private table.

## Admin → Feed tab

New tab in existing `/admin` page:
- **Today's news**: form to set/replace today's `home_news` row.
- **Weekly hot picks**: pick up to 6 profiles per role for the current ISO week (`home_hot_picks`).
- **Submissions queue**: list of `home_newsletter_submissions` with Approve / Reject / "Use as news" (prefills today's news form).

## Navigation

Add a "Home" link to `AppNavigation.tsx` hub nav (left of Discover). `/dashboard` stays Discover.

## Technical

**New tables (all in `public`, with GRANTs + RLS):**

```text
home_news
  id uuid pk, news_date date unique, title text, body text, link text,
  image_url text, created_by uuid, created_at timestamptz
  RLS: SELECT to authenticated; INSERT/UPDATE/DELETE admin only.

home_hot_picks
  id uuid pk, week_start date, role user_type, profile_id uuid,
  position int, created_by uuid, created_at timestamptz
  UNIQUE (week_start, role, profile_id)
  RLS: SELECT to authenticated; write admin only.

home_newsletter_submissions
  id uuid pk, submitter_id uuid, title text, link text, note text,
  status text default 'pending', created_at timestamptz
  RLS: submitter SELECT/INSERT own; admin SELECT/UPDATE all.
```

All tables get `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` + `GRANT ALL ... TO service_role`, then `ENABLE RLS`, then policies using `has_role(auth.uid(), 'admin')`.

**New files:**
- `src/pages/Home.tsx` — page shell + section composition
- `src/components/home/HotThisWeek.tsx`
- `src/components/home/EventsThisWeek.tsx`
- `src/components/home/TodaysNews.tsx`
- `src/components/home/NewsletterSubmitButton.tsx` (+ dialog)
- `src/components/admin/AdminFeedPanel.tsx`
- `src/hooks/useHomeFeed.ts` — fetches all four sections in parallel

**Edits:**
- `src/App.tsx` — add `/home` and `/app/home` routes (AuthGuard wrapped)
- `src/components/AppNavigation.tsx` — add Home link; treat `/home` as a hub page
- `src/pages/Admin.tsx` — add "Feed" tab rendering `AdminFeedPanel`
- `src/integrations/supabase/types.ts` — regenerated for new tables

**Hot picks fallback logic** (in `useHomeFeed.ts`): try `home_hot_picks` for current week → if empty, query `match_interests` grouped by recipient in last 7 days for opposite role → if still empty, newest profiles of opposite role.

## Out of scope

- No RSS/news API integration (admin posts manually; can add later)
- No email notification on new submission (can add later via existing Resend setup)
- No changes to `/dashboard` 6-profile cap or Pro upgrade flow
