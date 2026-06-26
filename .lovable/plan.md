## Rework slide 03 — The Problem (`public/catalystdeck.html`)

Rebuild the `#problem` section to match the selected **Editorial luxury grid v6** prototype, fit all the new copy on a single ~1063×690 viewport, and stay inside the existing theme (black bg, `--gold` #b59410, Cormorant Garamond + Inter, existing `.scene` / `.scene-num` / `.scene-label` primitives).

### New copy mapping

- Title (Cormorant, large): "Today, two problems exist:"
- Two problem cards side-by-side, each with a small uppercase eyebrow + statement + supporting line:
  - **Barriers to access** — "Retail investors cannot discover (at scale) promising early-stage startups before they become widely known. If you don't know an opportunity exists, you can't evaluate or invest in it."
  - **Friction in funding** — "First-time founders often raise capital through an inefficient, relationship-driven process where warm introductions and existing networks can matter as much as the quality of the business itself."
- Footer band (two columns above a hairline):
  - Left, italic Cormorant: "The result is a capital market that isn't as efficient as it could be. Exceptional founders can struggle to find funding, while motivated investors miss opportunities simply because they lack access to the right networks."
  - Right, small Inter: "When capital doesn't flow efficiently to promising companies, innovation slows. The next generation of transformative businesses shouldn't be determined primarily by who founders know — they should compete on the strength of their ideas, execution, and potential."

The Tesla quote (current hero line on this slide) is removed, since the user's provided copy replaces it. The "Internal Use Only" footer text from the prototype is dropped; we keep the existing `.scene-num` "03" / `.scene-label` "The Problem".

### Layout / styling

Add a small block of slide-scoped CSS (namespaced under `#problem`) so it doesn't affect other slides:

```text
┌───────────────────────────────────────────────────────────┐
│ 03                                          The Problem   │
│                                                           │
│  ── THE CORE THESIS                                       │
│  Today, two problems exist:           (Cormorant ~44px)   │
│                                                           │
│  ── Barriers to access     │   ── Friction in funding     │
│  Retail investors cannot…  │   First-time founders…       │
│  (supporting line)         │   (supporting line)          │
│                                                           │
│  ─────────────────────────────────────────────────────    │
│  The result is a capital   │  When capital doesn't flow…  │
│  market that isn't as…     │  …ideas, execution, potential│
└───────────────────────────────────────────────────────────┘
```

Specifics:
- Container: `padding: 6vh 6vw;` flex column, `justify-content: space-between` so header / cards / footer distribute across the viewport.
- Title: Cormorant Garamond, `clamp(30px, 4.2vw, 48px)`, `line-height:1.1`, weight 300.
- Eyebrow chip ("The Core Thesis"): gold, 10px, letter-spacing 0.4em, optional 1px gold border pill — match v6.
- Problem cards: two-col grid, `gap: 56px`. Each: gold 6px hairline + uppercase 11px gold-tinted label, statement at 17–18px Inter light, supporting line at 12.5–13px `#888` with left hairline border.
- Footer: top border `1px solid rgba(255,255,255,0.08)`, two columns (~55/45). Left italic Cormorant 18–19px; right Inter 12.5px `#888`, line-height 1.6.
- Subtle ambient glow divs (gold + white blur radial) absolutely positioned, low opacity — same as v6.
- All `reveal` classes preserved so the existing scroll-snap fade-in still works.

### Verification

After implementation, run a Playwright screenshot at 1063×690 of `#problem` to confirm everything fits without scroll and matches the chosen direction; tighten font sizes if anything overflows.

No other slides are touched.