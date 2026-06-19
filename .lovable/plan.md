
# Rework /app landing + signup flow

Goal: a focused, trust-forward, fintech-grade entry experience (Robinhood / Kalshi feel). No scroll-for-days marketing. One screen at a time, one decision at a time, mobile-first — and the same flow renders cleanly on desktop inside a centered phone-width container.

## What changes

### Routes
- `/app` → new `AppLanding` (replaces what users currently see when they hit /app on mobile).
- `/onboarding/founder` and `/onboarding/investor` → both rendered by a single new `AppSignup` component, role pre-selected from the path. A bare `/app/signup` also works, with role chosen on step 1.
- `/auth` (sign in) gets a re-skinned mobile view that matches the new visual language. Logic untouched.
- Old `Landing.tsx`, `FounderOnboarding.tsx`, `InvestorOnboarding.tsx` stay in the repo unrouted as fallback. We can re-mount them in `App.tsx` if we need to revert.

### Visual system (matches the mockup)
- Pure black canvas `#0A0A0A`, white primary, graphite surfaces `#111` / `#1a1a1a`, hairline borders `#222`/`#2a2a2a`.
- One column. Max width ~380px on mobile, centered card on desktop (no phone bezel chrome — just the same content, centered).
- Tabler-style icons (use lucide equivalents we already have).
- Type: tight tracking, 24–28px titles, 14px body, 11px eyebrows. We'll add the tokens to `index.css` as semantic vars (`--surface-1`, `--surface-2`, `--hairline`, `--text-dim`, `--text-mute`) so we never hardcode hex in components.
- Persistent layout shell: top nav bar (back + progress dots + optional skip), scrollable body, sticky bottom CTA. No page scroll past the CTA.

### Signup flow (7 steps, mockup-exact field set)
1. **Role** — Founder / Investor tiles.
2. **Account** — Full name, email, password, optional referral code.
3. **Profile basics**
   - Founder: banner (opt), profile photo (req), startup name, HQ location, LinkedIn (opt), one-liner.
   - Investor: profile photo (req), firm name (opt), location (opt), LinkedIn (opt), thesis (opt), portfolio link (opt).
4. **Stage / Type**
   - Founder: stage chips, MRR select, funding sought, traction (250-char), backed by (opt).
   - Investor: investor type, accreditation, check size (opt), total investments (opt).
5. **Industries / Focus** — tag chips, multi-select. Reuses `INDUSTRIES` from `src/lib/constants.ts`.
6. **Legal** — one checkbox, attorney-drafted SAFE disclaimer block, terms acceptance. Same legal capture (`legal_accepted_at`, `legal_accepted_ip`) as today.
7. **Success** — confirmation + next-step list, then routes to the existing post-signup access screen (`/early-access` vs `/pending-approval`).

Anything NOT in the mockup (video upload, incorporation docs, financial statements, EIN, pitch-deck URL + visibility, preferred city, company state/address, MRR detail beyond the bucket) is **removed from signup** and only editable later from Settings/profile. The DB columns stay; we just stop collecting them at signup.

### Landing screen (`/app`)
- Logo + wordmark, one-line tagline, three trust rows (Identity verified / Attorney-drafted SAFEs / Data never sold), `Get started` primary, `Already have an account` secondary.
- **No stats row.** No scroll content below the CTA. Single viewport.

### Sign-in
- Re-skinned to match — same email/password logic, same `/forgot-password` link, same post-login redirect (founders → `/match/inbox`, others → `/dashboard` per current rules).

## Technical details

- New files:
  - `src/pages/app/AppLanding.tsx`
  - `src/pages/app/AppSignup.tsx` (orchestrator with step state, progress dots, validation gate per step)
  - `src/pages/app/steps/StepRole.tsx`, `StepAccount.tsx`, `StepProfile.tsx`, `StepStage.tsx`, `StepIndustries.tsx`, `StepLegal.tsx`, `StepSuccess.tsx`
  - `src/pages/app/components/PhoneShell.tsx` (nav bar + scroll body + bottom CTA primitive), `FieldInput.tsx`, `Chip.tsx`, `RoleTile.tsx`, `UploadZone.tsx`, `TrustRow.tsx`
- `src/index.css`: add new semantic tokens under `:root` for the signup surface palette so components stay token-driven.
- `src/App.tsx`: point `/app`, `/onboarding/founder`, `/onboarding/investor`, `/app/signup` at the new components. Leave imports of old `Landing`, `FounderOnboarding`, `InvestorOnboarding` in place but unused.
- Signup submission reuses the existing `supabase.auth.signUp(... options.data ...)` pattern from `FounderOnboarding.tsx`/`InvestorOnboarding.tsx` so the `handle_new_user` DB trigger keeps working — same metadata keys, just a trimmed subset. Avatar/banner upload identical to current code.
- Founder post-signup still hands off to the existing access-step screen (Early Access $29 vs Waitlist) by routing to `/early-access` / `/pending-approval` — no change to that screen this pass.
- No backend / SQL / RLS / edge-function changes.

## Out of scope (call out)
- Match flow (`/match/*`) is untouched.
- Dashboard / inbox / swipe surfaces untouched.
- Admin, payments, SAFE generation untouched.
- We are not redesigning desktop marketing/landing for non-/app routes.
