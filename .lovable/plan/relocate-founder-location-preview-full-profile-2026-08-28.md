# Relocate founder location: preview → full profile

## Goal
Remove the location tag from founder preview/miniature cards and keep it visible only on the full profile view.

## Current state
- `src/components/SwipeCard.tsx` renders the founder location as a rounded chip at the top-left of the hero image overlay in swipe/preview cards.
- `src/pages/Dashboard.tsx` renders the founder location in the top chips row of the preview card.
- `src/pages/ProfileView.tsx` already renders the location chip below the "Founder · Company" line in the full profile hero.
- `src/components/discover/DiscoverCard.tsx` does not currently display a location tag for founders.

## Proposed changes
1. **Remove location from preview swipe card**
   - File: `src/components/SwipeCard.tsx`
   - Delete the `location` chip block inside the founder hero image overlay.

2. **Remove location from dashboard preview card**
   - File: `src/pages/Dashboard.tsx`
   - Remove the `isFounderCard && founderLocation` chip from the top chips row.

3. **Confirm full-profile placement**
   - File: `src/pages/ProfileView.tsx`
   - Keep the existing location chip below the founder name and company name.
   - No visual change unless you want it moved elsewhere (e.g., next to the stage badge in the Traction card, or inline with the one-liner).

## Outcome
Founder preview cards will show name, company, industries, one-liner, and stats — but no location badge. The full profile view will remain the place to see HQ/location.

## Scope
Presentation-only change. No database, RLS, or API changes required.
