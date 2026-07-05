# Enforce Liquid Glass on every surface (no exceptions)

## Why the first pass didn't stick

The reskin only overrode the design-token utilities (`bg-card`, `bg-popover`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-background`, `input`). Large parts of the app bypass those tokens with **hard-coded** classes:

- `bg-black`, `bg-white`, `bg-zinc-900`, `bg-neutral-900`, `bg-gray-900`
- Arbitrary hex: `bg-[#0A0A0A]`, `bg-[#111]`, `bg-[#1a1a1a]`, `bg-[#0F0F0F]`, `bg-[#0d1a13]`
- Custom Tailwind tokens: `bg-surface-dark`, `bg-surface-card`, `bg-background-dark`, `bg-border-subtle`
- Page-level gradients: `bg-gradient-to-b from-background to-muted/30`, `bg-gradient-to-br from-primary/20 to-accent/20`
- Sticky headers using `bg-black/80 backdrop-blur-md` and Tabs using `bg-zinc-900/50`

Files with the largest offender counts: `pages/InvestorPortal.tsx`, `pages/Onboarding.tsx`, `pages/Matches.tsx`, `pages/Home.tsx`, `pages/Concierge.tsx`, `pages/Settings.tsx`, `pages/ReferralDashboard.tsx`, `components/AppNavigation.tsx`, `components/BottomNavigation.tsx`, `components/desktop/*`, `components/Admin*.tsx`, `components/discover/*`, `components/SwipeCard.tsx`.

Chasing each file by hand would take dozens of edits and still miss things. Instead I'll extend `src/index.css` so the glass rules also **beat every hard-coded opaque class in the codebase**, in one place.

## Approach — CSS-only, zero component edits

Extend `src/index.css` with a global "glass enforcement" layer using high-specificity + `!important` selectors that cover every opaque pattern in use.

### 1. Nuke opaque backgrounds on containers

Force translucent glass on:

```
[class*="bg-black"]:not(button):not(.bg-black\/40):not(.bg-black\/70),
[class*="bg-zinc-"], [class*="bg-neutral-"], [class*="bg-gray-9"], [class*="bg-gray-8"],
[class*="bg-surface"], [class*="bg-background-dark"], [class*="bg-border-subtle"],
[class*="bg-[#0"], [class*="bg-[#1"], [class*="bg-[#2"], [class*="bg-[#3"]
{
  background-color: rgba(255,255,255,0.06) !important;
  background-image: none !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
  border-color: rgba(255,255,255,0.12) !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.25) !important;
}
```

Preserve semi-transparent overlays that use `/40`, `/60`, `/70`, `/80` alpha (they're intentional scrims — leave them so modals still dim behind).

### 2. Kill container gradients that create big solid bands

```
[class*="bg-gradient-to-"]:not(button):not([class*="from-primary"]):not([class*="from-amber"]) {
  background-image: none !important;
  background-color: rgba(255,255,255,0.05) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
}
```

Keep gradients on primary/accent **buttons** (they're the glossy highlight the user asked for).

### 3. Glossy translucent primary buttons

Every `button` (or `[role="button"]`) with `bg-white`, `bg-primary`, or gold/amber gradients becomes the glossy glass variant:

```
button[class*="bg-white"], button[class*="bg-primary"],
button[class*="from-amber"], button[class*="from-primary"] {
  background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55)) !important;
  color: #0a0a1a !important;
  border: 1px solid rgba(255,255,255,0.5) !important;
  box-shadow:
    0 8px 24px -6px rgba(255,255,255,0.35),
    inset 0 1px 0 rgba(255,255,255,0.9),
    inset 0 -1px 0 rgba(0,0,0,0.15) !important;
  backdrop-filter: blur(14px) !important;
}
```

Non-button `bg-white` (rare decorative dots, avatars) left alone.

### 4. Floating navigation

Detach top bars, sidebars, bottom nav from edges and float them:

```
nav, header, aside,
[class*="sticky"][class*="top-0"],
[class*="fixed"][class*="bottom-0"] {
  background-color: rgba(20,20,40,0.35) !important;
  backdrop-filter: blur(32px) saturate(200%) !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  border-radius: 20px !important;
  margin: 8px !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.35) !important;
}
```

Scope carefully so it only applies to the outer nav containers, not every `<nav>`-descendant element (use `:where()` guards or drop the margin rule where it would break layout — see technical notes).

### 5. Inputs — frosted glass with glowing focus

Already partially in place; broaden to catch hard-coded input classes like `bg-black border-zinc-800`:

```
input, textarea, select,
[class*="bg-black"] input, [class*="bg-zinc"] input {
  background-color: rgba(255,255,255,0.06) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
}
```

### 6. Cards, tabs, dialogs, sheets, popovers, toasts

Already covered by token overrides; add fallbacks for hard-coded card wrappers (`rounded-2xl`/`rounded-3xl` + any opaque `bg-`) so they become floating panes with `border-radius: 24px` and `box-shadow: 0 8px 40px rgba(0,0,0,.25)`.

### 7. Background — lighting only

Body already has the multi-hue radial gradient. Add a stronger vignette + a couple of animated blurred "aurora" blobs (pure CSS, `@keyframes`) so glass surfaces have real color to refract.

### 8. Typography polish

Bump primary text to `#f5f7ff`, muted to `rgba(230,232,245,0.72)`. No font change.

## Technical notes

- All changes land in `src/index.css` inside `@layer components` so utilities can still override where truly needed.
- `!important` is used only inside the enforcement layer — this is deliberate because the goal is to defeat inline utility classes across ~100 files.
- The nav margin rule is applied via a more specific `body > div > nav`, `body > div > header:first-child` selector to avoid indenting nested navs inside cards.
- `[class*="bg-white"]` matches `bg-white/10` too. I'll exclude alpha variants with `:not([class*="bg-white/"])` so overlays stay overlays.
- No React/TSX files are modified; no layout, spacing, IA, or copy changes.
- After the CSS ships I'll drive Playwright over `/dashboard`, `/matches`, `/investor-portal`, `/onboarding`, `/settings`, `/referrals` and take screenshots to verify no opaque surfaces remain. Any survivors get one more targeted selector added.

## Deliverable

A single edit to `src/index.css`. Zero component file edits. Every surface — cards, nav, sidebar, bottom bar, modals, sheets, inputs, tabs, buttons, popovers, toasts, dropdowns, dialogs, list rows, admin panels, onboarding sheets — renders as translucent frosted glass over a rich ambient gradient background.
