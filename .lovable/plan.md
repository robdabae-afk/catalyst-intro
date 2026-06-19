## Intro animation for /app landing

Apply the "Center-to-header kinetic" direction to `src/pages/app/AppLanding.tsx`, using the existing `catalyst-logo.png` asset (no logo redraw).

### Choreography
1. **0.0s – 0.7s:** Logo enters at viewport center, scale 8 → 1, opacity 0 → 1, blur fades out. Background pure black, rest of page hidden.
2. **0.7s – 1.4s:** Logo travels from center to its final header slot (top of page) with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
3. **1.1s – 1.9s:** Tagline, trust-row card, and CTA buttons fade + slide up (`translateY(20px) → 0`), staggered ~80ms each.
4. **Idle (after intro):** Logo gets a subtle 4s ease-in-out vertical float (±3px) so the page stays alive without distraction.

### Implementation
- Pure CSS keyframes added inline in the component (no new deps, no Motion library).
- Logo rendered once; animation uses `position: absolute` during travel, then settles into normal flow via `forwards` fill.
- Layout, copy, trust rows, colors, and `h-screen overflow-hidden` no-scroll lock all preserved.
- Intro plays on every fresh mount of `/app` (matches the prototype). No sessionStorage gate unless requested later.
- Respect `prefers-reduced-motion`: skip the intro and show final state immediately.

### Out of scope
- No changes to signup flow, auth, routing, copy, or the logo image itself.
- No shimmer text effect (the prototype's shimmer was on a text wordmark; our logo is an image — float + intro travel only).
