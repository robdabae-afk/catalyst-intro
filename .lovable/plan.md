# Fix: swipe action buttons hidden behind bottom nav

## What happened

The Discover screen (`src/pages/Dashboard.tsx`) was rebuilt in the recent mobile UI work ("Rebuild mobile UI: swipe view…" / "Rebuild bottom tab bar per nav spec"). In that rebuild the three action buttons became normal in-flow elements at the bottom of the card column, while the tab bar is a floating overlay (`fixed bottom-4`, 66px tall).

The only thing reserving space under the buttons is the "Go Pro" banner, which renders with `pb-20` **only when the user is not Pro**. So:

- Non-Pro user: 80px of padding happens to clear the nav.
- Pro user (and the loading/out-of-cards paths use a separate 80px spacer): no reserved space at all, so the buttons sit directly under the floating nav and get covered.

The overlap in the screenshot matches a Pro/admin test account — no Go Pro banner is visible.

## Fix

In `src/pages/Dashboard.tsx`:

1. Add a single unconditional bottom reserve on the card-area container instead of relying on the banner: bottom padding of nav height + gap + safe-area (`calc(96px + env(safe-area-inset-bottom))`).
2. Remove the ad-hoc `pb-20` on the Go Pro banner and the conditional `paddingBottom: 80` spacer, so spacing no longer depends on subscription state.
3. Keep the buttons in flow (no layout redesign), so the card simply shrinks slightly and the buttons always clear the nav.

## Verification

Render `/dashboard` at 394x690 with Playwright as a Pro/admin account and confirm the bounding box of the action buttons sits above the nav bar's top edge, then re-check the non-Pro path with the banner visible.
