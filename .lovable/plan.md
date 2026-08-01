Goal: Reduce the vertical length of `/app/home` (mobile homepage) so users do not need to scroll on a typical phone viewport, while keeping all existing content and being conservative with sizing changes.

Current state (from `src/pages/Home.tsx`):
- Header: `pt-14 pb-2` plus 24px title
- Priority Match card: `px-6 py-8`
- Section headers: `pt-3`
- Latest Events: renders up to 3 `EventCard`s
- `EventCard`: `px-4 py-3.5` plus 52px date badge
- Latest Updates horizontal strip: cards have `minHeight: 160` and `padding: 19px 17px 17px`
- Scroll container: `pb-24` to clear bottom nav

Planned conservative changes:
1. Header
   - Reduce top padding from `pt-14` to `pt-10`.
   - Keep welcome text and settings button.

2. Priority Match card
   - Reduce vertical padding from `py-8` to `py-5`.
   - Slightly reduce the large "0 new" number font size from 32px to 28px.
   - Keep the arrow button and label text unchanged.

3. Section headers
   - Reduce top padding from `pt-3` to `pt-1`.

4. Latest Events
   - Cap displayed events at 2 instead of 3 (`events.slice(0, 2)`).
   - Reduce `EventCard` vertical padding from `py-3.5` to `py-2.5`.
   - Reduce date badge vertical padding slightly.

5. Latest Updates
   - Reduce news card `minHeight` from 160px to 130px.
   - Reduce card padding from `19px 17px 17px` to `14px 14px 12px`.
   - Reduce body line clamp from 2 to 1 to save height.

6. Scroll container
   - Reduce bottom padding from `pb-24` to `pb-20` since the bottom nav is 66px tall and floating with margin.

7. Verification
   - Switch the preview to mobile viewport.
   - Take a screenshot to confirm the full homepage is visible without scrolling.
   - If still scrolling, make one additional conservative pass on padding/spacing before considering content removal.

No content will be removed; only spacing, font sizing, and the event cap will be adjusted.