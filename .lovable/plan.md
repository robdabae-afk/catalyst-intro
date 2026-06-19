## Goal

Strip the signup flow to the bare minimum, lock scroll on mobile, and move all remaining profile-completion work into a gamified post-login onboarding checklist at `/onboarding`.

## Signup restructure (founder + investor)

**Founder — 5 steps total** (was 6):

1. Role select (unchanged)
2. Account: name, email, password, referral code (unchanged)
3. Your startup — **only**: profile photo (optional), Startup Name, HQ Location, One-Liner
4. Stage + Industries — combined: Company stage chips (Pre-seed / Seed / Series A / Series B), Industry chips (Fintech, ConsumerTech, AI, etc.)
5. Legal: disclaimer + agree → submit

**Investor — 5 steps total**, mirrored:

1. Role select
2. Account
3. Your profile — only: profile photo (optional), Name of firm (optional), Location, LinkedIn (optional)
4. Investor type + Sectors of interest — Investor Type select, Accreditation status select, Sector chips
5. Legal → submit

Removed from signup (founder): banner photo, LinkedIn, MRR, funding sought, traction, backed by. Removed from signup (investor): banner, thesis, portfolio link, check size, investment count, notable portfolio.

`TOTAL_STEPS` becomes 5. `canContinue` and `advance` updated accordingly. Submit happens on step 5.

## Mobile no-scroll lock (landing + signup)

- `AppLanding` already uses `h-screen overflow-hidden` — keep.
- `AppSignup` currently uses `min-h-screen` with `overflow-y-auto` on the content area. Change shell to `h-[100dvh] overflow-hidden`, content area becomes `flex-1 min-h-0` with content sized to fit. Add `overscroll-behavior: none` and `touch-action: pan-x` on the page root to block pull-to-refresh/vertical pan.
- Add a one-time effect that sets `document.documentElement.style.overflow = "hidden"` and `document.body.style.overflow = "hidden"` while mounted, restoring on unmount.
- Each step's content is trimmed enough to fit on a 390×690 viewport without scrolling.

## Post-login onboarding checklist (`/onboarding`)

New route + page `src/pages/Onboarding.tsx`, gated to first-time users (redirect there on first login until dismissed or 100%). Existing dashboard remains; users can revisit `/onboarding` any time from a "Complete profile" entry point.

### Layout (mobile-first, no-scroll inside viewport — list scrolls within a container)

```text
+------------------------------------+
|  Header: "Complete your profile"   |
|  XP-style progress bar  (4/7)      |
+------------------------------------+
|  Checklist (scroll within card)    |
|  [ ] Profile photo        +10 XP   |
|  [x] Startup basics       +10 XP   |
|  [ ] Banner image         +10 XP   |
|  [ ] Funding & traction   +20 XP   |
|  [ ] LinkedIn + website   +10 XP   |
|  [ ] Pitch deck           +30 XP   |
|  [ ] Verify identity      +20 XP   |
+------------------------------------+
|  CTA: Continue to dashboard        |
+------------------------------------+
```

Each item:
- Tap → opens a focused mini-form sheet (one card, one task).
- On save → green check, bar animates, subtle confetti / haptic-style pulse.
- Persistent — progress survives reloads (computed from profile fields).

### Founder checklist items (per user's selection)

1. Profile photo + banner (avatar, banner upload)
2. Funding & traction (MRR, funding sought, traction text, backed by, refine stage)
3. LinkedIn + website (linkedin_url, company website)
4. Pitch deck upload (file + public/private toggle)

### Investor checklist items (mirrored)

1. Profile photo + banner
2. Investment thesis + check size
3. LinkedIn + portfolio link
4. Notable portfolio + investment count

Completion is derived live from `profiles` / `founder_profiles` / `investor_profiles` columns (no new schema). A single `profiles.onboarding_dismissed_at` timestamp column is added so we know when the user opts out of the auto-redirect.

## Technical details

- File: rewrite `src/pages/app/AppSignup.tsx` — trim fields, change `TOTAL_STEPS = 5`, update `canContinue`/`advance`, swap shell to `h-[100dvh] overflow-hidden`, add scroll-lock effect.
- File: rewrite `src/pages/app/AppLanding.tsx` — confirm scroll-lock effect present (it already uses `h-screen overflow-hidden`; add the document-level overflow lock too).
- New file: `src/pages/Onboarding.tsx` — checklist UI, derives completion from existing tables, opens per-item mini-forms (reusing the same input/upload components).
- New file: `src/components/onboarding/ChecklistItem.tsx`, `ProgressBar.tsx`, item sheets.
- Route: add `<Route path="/onboarding" element={<Onboarding />} />` in `src/App.tsx`; first-login redirect logic in the post-auth router (existing auth-gate component).
- DB migration: `ALTER TABLE public.profiles ADD COLUMN onboarding_dismissed_at timestamptz`.
- No changes to `handle_new_user` — it already tolerates missing fields (NULLIF / COALESCE).
- Keep reduced-motion + accessibility for the progress animation.

## Out of scope

- Logo intro animation (already handled separately).
- Auth provider config, RLS changes, payment flow.
- Desktop redesign of `/onboarding` (uses the same column, centered, max-width 480px).