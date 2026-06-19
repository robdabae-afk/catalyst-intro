## Add intro logo animation to /app landing

Add a cinematic intro animation to `src/pages/app/AppLanding.tsx` that plays once on load: the existing Catalyst logo image starts large and centered, then smoothly scales down and travels up to its resting position while the rest of the page (tagline, trust rows, CTAs) fades and slides in behind it. At rest, the logo gets a subtle continuous "alive" motion.

### Scope

- Only file edited: `src/pages/app/AppLanding.tsx`.
- Uses the existing `catalyst-logo.png` asset — no logo redraw, no SVG substitution. Arrow stays exactly as it is in the real PNG.
- No copy, layout, color, or routing changes. Three trust rows and buttons stay identical.
- Viewport-locked (`h-screen overflow-hidden`) preserved — no scroll.

### Behavior

1. **Intro (0 → ~1.4s)** — logo PNG starts at ~6× scale centered in the viewport, fades in, then eases down to its normal size and slides up into the header slot. Cubic-bezier(0.16, 1, 0.3, 1) for a weighted, premium feel.
2. **Content reveal (~1.1s delay → 1.9s)** — tagline, trust-row card, and the two buttons fade + translate-up together (single stagger group, keeps total intro under ~2s so the CTA is interactable quickly).
3. **Idle (after intro)** — the logo gets a slow 4s vertical float (~4px) loop, evoking "alive but calm." No shimmer on the wordmark (it's a raster PNG — shimmer would not apply cleanly), so we keep the motion in transform space only.
4. **Plays once per session** — gated by a `sessionStorage` flag (`catalyst:introPlayed`). On subsequent navigations to `/app` in the same tab session, the page renders in its final state instantly. (Reload still replays — matches user intent of "when someone loads onto the page".)
5. **Respect reduced motion** — if `prefers-reduced-motion: reduce`, skip the intro and idle float entirely; render the final state.

### Technical details

- Pure CSS keyframes scoped via a `<style>` tag inside the component (consistent with the rest of this page's hardcoded styling) — no new dependencies, no Motion/GSAP install needed.
- Keyframes added: `catalyst-logo-intro`, `catalyst-content-reveal`, `catalyst-logo-float`.
- Intro uses absolute positioning during the animation and lands in the normal flex slot at the end (via `forwards` fill + a final `position: static` step achieved by animating a wrapper that releases after completion using `animation-fill-mode: forwards` and a parent placeholder of fixed height to prevent layout shift).
- Session gate: `useState(() =&gt; !sessionStorage.getItem('catalyst:introPlayed'))`, set the flag in a `useEffect` after first paint.
- Reduced-motion gate: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

### Out of scope

- No changes to `/app/signup`, `/auth`, or any other route.
- No font swap, no shimmer gradient on the wordmark (logo is a PNG image, not text).
- No background particles, glow, or pattern additions.
