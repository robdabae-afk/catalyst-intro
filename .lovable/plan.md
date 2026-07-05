# Glassmorphism Overlay — Site-Wide (excluding Pitch Deck)

Add a consistent glass-morphism visual layer across every page except the pitch deck viewer (`/catalystdeck`, `public/catalystdeck.html`) and the deck editor (`/catalystdeck/edit`, `CatalystDeckEditor.tsx`). Keep current colors, fonts (Playfair Display / Plus Jakarta / Inter), photography, and layouts intact — only the surface treatment changes.

## Visual concept

- Backgrounds stay black / silver-sleek. On top of them, primary surfaces (cards, modals, nav bars, sheets, popovers, dropdowns) become frosted glass: translucent fill, backdrop blur, subtle inner highlight, hairline border, soft outer shadow.
- Photography and gradients remain the "hero" layer; glass panels sit above them so imagery bleeds through with a soft blur.
- No color palette changes. No font changes. No layout changes.

## Design tokens (added to `src/index.css`)

New CSS variables under `:root` and `.dark` (values shared since app is dark-first):

```
--glass-bg: 0 0% 100% / 0.06;         /* translucent white fill */
--glass-bg-strong: 0 0% 100% / 0.10;  /* modals / popovers */
--glass-border: 0 0% 100% / 0.12;
--glass-highlight: 0 0% 100% / 0.18;  /* top inner stroke */
--glass-shadow: 0 20px 60px -20px hsl(0 0% 0% / 0.6);
--glass-blur: 18px;
--glass-blur-strong: 28px;
```

Plus three utility classes in the `@layer utilities` block:

- `.glass` — card-level frost (bg `--glass-bg`, `backdrop-filter: blur(var(--glass-blur)) saturate(1.4)`, 1px border `--glass-border`, top inner highlight via `box-shadow: inset 0 1px 0 var(--glass-highlight)`, outer `--glass-shadow`).
- `.glass-strong` — modal/popover variant using `--glass-bg-strong` and `--glass-blur-strong`.
- `.glass-nav` — thinner blur (10px), no shadow, sticky-header friendly.

Fallback: `@supports not (backdrop-filter: blur(1px))` bumps the fill opacity to ~0.85 so panels stay legible on browsers without backdrop-filter (Firefox with the flag off).

## Where the treatment is applied

Applied by editing a small number of primitives so it propagates everywhere without touching individual pages:

1. `src/components/ui/card.tsx` — `Card` swaps `bg-card` for `glass` (keeps `text-card-foreground`, border becomes the glass hairline).
2. `src/components/ui/dialog.tsx` — `DialogContent` uses `glass-strong`; overlay gets a slightly darker tint + blur.
3. `src/components/ui/sheet.tsx` — same as dialog (`glass-strong`).
4. `src/components/ui/popover.tsx`, `dropdown-menu.tsx`, `hover-card.tsx`, `command.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `context-menu.tsx`, `select.tsx` content panels — `glass-strong`.
5. `src/components/ui/tooltip.tsx` — `glass` (lighter).
6. `src/components/ui/alert.tsx`, `badge.tsx` (default variant only) — `glass`.
7. `src/components/ui/toast.tsx` + `sonner.tsx` — `glass-strong`.
8. `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx` trigger — swap `bg-background` for `glass` so form fields match.
9. `src/components/ui/tabs.tsx` (`TabsList`), `toggle-group.tsx` — `glass`.
10. Navigation shells: `src/components/AppNavigation.tsx`, `BottomNavigation.tsx`, `src/components/desktop/Sidebar.tsx`, `src/match/MatchLayout.tsx` header, `src/components/discover/DiscoverMenuBar.tsx` — apply `glass-nav` to their outer container (replacing solid `bg-black` / `border-b` treatments while keeping the border color).

## Explicit exclusions (untouched)

- `public/catalystdeck.html`
- `public/catalystdeck-overlay.js`
- `public/catalystdeck-editor.js`
- `src/pages/CatalystDeck.tsx`
- `src/pages/CatalystDeckEditor.tsx`

Because the deck uses its own inline styles and print pipeline, the shared shadcn primitives are not referenced by the printed slide DOM, so editing the primitives has no effect on PDF output. We'll double-check by grepping the deck files for any shadcn imports before we ship.

## Accessibility & performance

- Contrast: verify body/foreground text on frosted panels still meets WCAG AA against the darkest photo backdrops; if a panel falls below, we raise the `--glass-bg` alpha to 0.10–0.14 for that specific surface.
- `prefers-reduced-transparency`: media query removes `backdrop-filter` and raises fill opacity to ~0.9.
- Blur is GPU-accelerated; we cap heavy blur (`glass-blur-strong`) to modal/popover surfaces to avoid painting cost on scroll.

## Verification

- Playwright pass: screenshot Home, Dashboard/Discover, Matches, Match landing, Settings, Admin, Auth — confirm frosted surfaces render and typography/colors are unchanged.
- Load `/catalystdeck` and `/catalystdeck/edit`, screenshot, confirm zero visual change vs. current.
- Trigger PDF print flow from the editor and confirm slide output is byte-identical to today (no shadcn leakage).

## Out of scope

- No color, font, spacing, or layout changes.
- No new pages or components.
- No changes to deck rendering or print pipeline.
