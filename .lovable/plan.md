# Dashboard Redesign: Grid-Based Discovery

Replace the Tinder-style swipe Discover surface with a structured browse-grid dashboard inspired by Kalshi, Robinhood, and Polymarket. Matches, inbox, chat, and existing match logic stay untouched. Swipe-based code paths remain only as the underlying data layer (Express Interest writes the same `swipes` row with `action='like'`, mutual interest still creates a `matches` row).

## What the user sees

```text
┌──────────┬────────────────────────────────────────────┐
│ FILTER   │  All  Trending  New  Featured  Saved  ⚙   │
├──────────┴────────────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                  │
│  │card │  │card │  │card │  │card │   <- responsive  │
│  └─────┘  └─────┘  └─────┘  └─────┘      grid        │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                  │
│  │card │  │card │  │card │  │card │                  │
│  └─────┘  └─────┘  └─────┘  └─────┘                  │
└───────────────────────────────────────────────────────┘
```

- **Filter panel (left, collapsible drawer on mobile):** all current discovery filters — for investors browsing founders: industry, stage, MRR/revenue band, traction keywords, location, verified, featured; for founders browsing investors: sectors, check-size band, preferred stage, location, investor type. Persists via existing `filter_preferences` pattern.
- **Top menu bar:** unified nav that absorbs today's bottom nav + top-nav settings buttons: Discover • Matches • Inbox • Requests • My Investments/Portfolio (role-based) • Concierge • Boosts/Tokens • Profile • Settings • Admin (if admin). Notification badges (unread messages, new matches, pending requests) move here. Mobile collapses it into a hamburger that opens a full-height sheet.
- **Card grid:** 4 cols desktop / 3 tablet / 2 mobile. Each tile is compact, info-dense, Polymarket-style.

### Founder card (when an investor browses)
- Logo/avatar (small, top-left), company name, verified/featured chips
- One-liner (2 lines max, truncated)
- Inline metrics row: Stage • Industry tag(s) • MRR • Traction snippet
- Signal chips: Trending / New / Featured when applicable
- Primary CTA: **Express Interest** (heart + label). Secondary: **Save** (bookmark, watchlist), **View** (opens existing profile page)
- After interest sent: button becomes disabled "Interest Sent"; on mutual interest, existing match modal fires

### Investor card (when a founder browses)
- Same layout: avatar, firm name, verified chip, position
- Metrics row: Check size • Preferred stage • Sectors
- Same CTA pattern; Basic-founder messaging gate remains downstream in Matches

## Interaction model

- Click card body → existing `/profile/:id` view (unchanged)
- Express Interest → writes `swipes` row (`action='like'`) using existing logic; mutual = match via current trigger/flow
- Save → new lightweight `watchlist` table (private; no notification to other side)
- Filters + search bar at top of grid; results paginated/infinite-scroll
- No swipe gestures, no per-day swipe limit UX in the grid (Pro/Basic limits still enforced server-side on the like action, surfaced as a toast/upsell when hit)
- Ad insertion: every Nth tile shows a sponsored card (reuse `ad_profiles`), Pro bypasses

## Routes & files

- **New:** `src/pages/Discover.tsx` (grid dashboard, replaces the swipe view)
- **New:** `src/components/discover/DiscoverGrid.tsx`, `DiscoverCard.tsx`, `DiscoverFilters.tsx`, `DiscoverMenuBar.tsx`
- **New hook:** `src/hooks/useDiscoverFeed.ts` — paginated query against `profiles` + `founder_profiles`/`investor_profiles`, applies filters + swipe-history exclusions (reuse `useSwipeHistory` filtering)
- **New hook:** `src/hooks/useExpressInterest.ts` — wraps the existing like → match logic in one call (returns `{ matched: boolean }`)
- **Reuse:** `useSwipeHistory`, `useMatchMessaging`, `useDailySwipes` (limits), `MatchModal`, `FilterPreferences`
- **Route swap in `src/App.tsx`:** `/discover` (and `/dashboard` if it currently points to swipe) → `Discover.tsx`. Old `SwipeCard` / `SwipePanel` / `CaughtUpState` files stay on disk (per "no deletes") but are unrouted.
- **Nav cleanup:** `BottomNavigation.tsx` removed from layout in favor of new top `DiscoverMenuBar`; on mobile collapses to hamburger.

## Data layer

- **Watchlist table** (new migration):
  ```sql
  CREATE TABLE public.watchlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_id)
  );
  GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
  GRANT ALL ON public.watchlist TO service_role;
  ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "own watchlist" ON public.watchlist
    FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  ```
- No changes to `swipes`, `matches`, `messages`, `profiles`.

## Visual direction

Silver & Sleek theme stays (Playfair Display headers, Inter body, metallic silver/dark gray/off-white). Cards: subtle border, `rounded-xl`, hover lift + faint silver glow. Signal chips use small caps Inter. Grid feels like Polymarket's market list — dense, scannable, monetary, with the typographic refinement of Robinhood's lists.

## Out of scope (no changes)

- Matches page, Inbox, MatchThread, chat gating rules
- Onboarding, auth, profile editing
- Concierge, SAFEs, Investments, Admin panels
- All swipe-era files remain on disk per the no-delete rule

## Open follow-ups after build

1. Decide whether to delete the unrouted swipe files in a later cleanup pass (requires explicit permission).
2. Whether the grid should default to "Trending" or "All" on first load.
