
## Goal

Make the Discover dashboard fit entirely within the viewport (no vertical or horizontal scrolling) on both mobile and desktop, and gate the daily profile feed to 6 profiles for Basic users with an upgrade path to a $40/mo Pro tier for unlimited daily profiles.

## 1. Daily profile limit (6/day, Pro unlimited)

- Add constants in `src/lib/membership-constants.ts`:
  - `BASIC_DAILY_DISCOVER_PROFILES = 6`
  - `PRO_DAILY_DISCOVER_PROFILES = Infinity` (or a high cap)
- Create `src/hooks/useDailyDiscoverFeed.ts` (or extend `useDiscoverFeed`) that:
  - Picks a deterministic daily slice of 6 profiles (seeded by `user_id + YYYY-MM-DD`) from the filtered candidate pool so the same set persists across reloads for that day.
  - For Basic users, hard-caps the returned `profiles` array at 6 and exposes `dailyLimitReached`, `remainingToday`, `isPro`.
  - For Pro users, returns the full filtered feed with pagination (current behavior).
  - Resets at local midnight.
- Filters still apply first; the 6/day cap is applied to the filtered result so the daily set respects the user's filters.
- When filters change mid-day for Basic, the cap still applies to the new filtered set but does not grant additional profiles beyond 6 total interactions for the day. Track "profiles surfaced today" in a new `daily_discover_views` table (or reuse `swipes` count) keyed by user + date.

## 2. Pro membership at $40/mo

- Add a new Stripe price for the $40/mo Pro Discover tier. Reuse the existing Stripe edge functions (`create-checkout`, `check-subscription`, `customer-portal`).
- Add `PRO_DISCOVER_PRICE_ID` in `src/lib/stripe-constants.ts`.
- Reuse existing `GetProButton` / `UpgradePrompt` components; point them at the new price when triggered from Discover.
- `useAuth().isPro` already drives gating — confirm the check-subscription function recognizes the new product as Pro (add product id to the Pro mapping).

## 3. Single-screen dashboard layout (no scroll)

Target: everything visible within `100dvh` minus the menu bar, on 390x690 mobile and standard desktop.

Layout changes in `src/pages/Dashboard.tsx`:
- Wrap the page in `h-[100dvh] overflow-hidden flex flex-col`.
- `DiscoverMenuBar` stays as a compact top bar (single row).
- Main area becomes `flex-1 min-h-0 overflow-hidden` with the grid sized to fill remaining height.
- Grid uses fixed rows so 6 cards always fit:
  - Mobile (<640px): `grid-cols-2 grid-rows-3` → 6 tiles, no scroll.
  - Tablet (sm–lg): `grid-cols-3 grid-rows-2` → 6 tiles.
  - Desktop (lg+): `grid-cols-3 grid-rows-2` with filter sidebar to the left (sidebar also `overflow-hidden`, internal scroll only if user opens a long filter group — default collapsed).
- Remove the "Load more" button for Basic (no more than 6). For Pro, replace with horizontal pagination dots or a "Next 6" button that swaps the visible page in-place (still no page scroll).
- Count line ("X founders") and mobile Filters button merge into the menu bar to save vertical space.

Layout changes in `DiscoverMenuBar.tsx`:
- Collapse to a single row on mobile: logo + search (icon-expand) + view tabs (icon-only) + overflow menu (settings/notifications/profile).
- Remove any secondary row; use a popover for filters/view tabs on small screens.

Layout/density changes in `DiscoverCard.tsx`:
- Reduce padding (`p-4` → `p-2.5`), avatar `h-11` → `h-9`, tighter gaps.
- Title `text-sm` → `text-[13px]`; subtitle clamped to 1 line (was 2) with `min-h` removed.
- Collapse tag row: show stage + 1 industry chip + `+N`.
- Merge metric line into the tag row (small muted tabular-nums on the right).
- Action row becomes a single full-width Express Interest button with a bookmark icon button overlaid top-right of the card (absolute), removing the dedicated footer row.
- Card uses `h-full` and internal `flex-col justify-between` so it fills its grid cell exactly.

## 4. Upgrade prompt when limit hit

- When Basic user has consumed all 6, replace any further would-be tiles with a single full-bleed "Daily limit reached" panel inside the grid area (no scroll), showing:
  - "You've seen today's 6 matches"
  - "Upgrade to Pro ($40/mo) for unlimited daily profiles"
  - CTA → existing checkout flow with the new price id
  - Secondary: "Come back tomorrow"
- Same panel shown if filters return zero profiles today after the daily set is locked.

## 5. Files touched

- `src/pages/Dashboard.tsx` — full-height layout, grid rows, remove load-more for Basic, limit panel.
- `src/components/discover/DiscoverCard.tsx` — density pass, fill cell, bookmark repositioned.
- `src/components/discover/DiscoverMenuBar.tsx` — single-row compact layout, popover for filters on mobile.
- `src/components/discover/DiscoverFilters.tsx` — keep, but ensure sidebar fits within viewport (its own internal scroll only).
- `src/hooks/useDiscoverFeed.ts` — add deterministic daily slice + Basic 6-cap; gate `loadMore`/`hasMore` by tier.
- `src/lib/membership-constants.ts` — add discover daily constants.
- `src/lib/stripe-constants.ts` — add `$40/mo` Pro price id.
- `check-subscription` edge function — map new product id to Pro.
- New migration: `daily_discover_views` table (user_id, date, profile_ids[]) with RLS + GRANTs, to persist the day's locked-in set per user.

## 6. Out of scope

- Inbox, Matches, Profile, Settings, Concierge pages.
- Existing swipe-history logic remains untouched; daily discover limit is independent of express-interest swipe limits.
- No deletions of existing files.

## Open question

For Pro users, should the 6-per-page pagination behavior be "Next 6" tiles in-place (no scroll, keeps the no-scroll rule app-wide) or should Pro users get a scrollable feed? Default in this plan: in-place pagination so the no-scroll rule holds everywhere.
