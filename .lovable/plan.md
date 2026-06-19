
## Diagnosis: why the gamified checklist doesn't appear

After login, this is what actually happens today:

```text
Auth.tsx → navigate("/dashboard")
  → <AuthGuard>
       checks onboarding_dismissed_at  → navigate("/onboarding")   ✓ correct
       then renders <ProfileCompletionGate>  ← legacy gate
  → /onboarding renders Onboarding.tsx  ✓ should appear
```

The blocker is **`ProfileCompletionGate`** (`src/components/AuthGuard.tsx` wraps every authed page in it). It:

- Reads `linkedin_url`, `location`/`investor_type`, `accreditation_status`
- If `profile_grace_until` is null it treats grace as **already expired**
- Renders a full-screen red "Profile Incomplete — Update Profile Now" lock that redirects to `/settings`

For both freshly-signed-up users and the test accounts (no LinkedIn, no location, no grace period), the gate fires the moment they hit `/dashboard`. Even if the AuthGuard tries to redirect to `/onboarding` first, any later return to `/dashboard` is locked — so the user perceives "the checklist never shows / I land on the wrong screen". This gate is a leftover from the deleted approval/waitlist system and must be removed.

A second contributor: `Auth.tsx` "back" button goes to `/` (now the EventSignIn page) instead of `/app`, which is why some sign-in attempts feel like they "land on /events".

## Plan

### 1. Fix the onboarding gate (root cause)

- **`src/components/AuthGuard.tsx`** — stop wrapping children in `ProfileCompletionGate`. Keep only the auth + `onboarding_dismissed_at` redirect.
- Make the redirect resilient: if `profile` row hasn't been created yet (race with `handle_new_user` trigger), wait/poll once instead of falling through.
- **`src/pages/Onboarding.tsx`** — if `userId` exists but `profile` is missing, retry once before rendering empty state.

### 2. Delete dead legacy pages & components (per "Keep /match, delete other legacy")

Files to remove entirely:

- `src/pages/Landing.tsx` (old marketing — replaced by `src/pages/app/AppLanding.tsx`)
- `src/pages/FounderOnboarding.tsx` and `src/pages/InvestorOnboarding.tsx` (replaced by `AppSignup.tsx`)
- `src/pages/EarlyAccess.tsx`, `src/pages/Waitlist.tsx`, `src/pages/PendingApproval.tsx`
- `src/pages/FounderProfileInput.tsx` (replaced by the gamified onboarding + Settings)
- `src/components/ProfileCompletionGate.tsx`
- `src/components/desktop/PendingApprovalOverlay.tsx`
- `src/hooks/useApprovalCheck.ts`

Routes to remove from **`src/App.tsx`**:

- `/app/legacy`, `/onboarding/founder-legacy`, `/onboarding/investor-legacy`
- `/founder-input` and `/app/founder-input`

Keep intact:

- All `/match/*` routes and `src/pages/match/*`, `src/match/*`
- `/` and `/events` → `EventSignIn` (event check-in homepage stays)
- Everything under `/app/*`, `/dashboard`, `/onboarding`, etc.

### 3. Rewire stray buttons & defaults

| File | Current | Fix |
|---|---|---|
| `src/pages/Auth.tsx` line 292 | back → `/` | back → `/app` |
| `src/pages/Auth.tsx` lines 370, 378 | "Sign up as founder/investor" → `/onboarding/founder` and `/onboarding/investor` | → `/app/signup?role=founder` and `?role=investor` (matches AppSignup's `initialRole`) |
| `src/components/BottomNavigation.tsx` line 22 | Profile → `/founder-input` | Profile → `/profile/:userId` (own profile) |
| `src/components/desktop/DesktopLayout.tsx` | imports `useApprovalCheck` + renders `PendingApprovalOverlay` | strip both imports and the overlay JSX |
| `src/components/CaughtUpState.tsx` line 152 | → `/matches` | keep (route exists), but verify it loads under the new flow |

Also keep the existing aliases `/onboarding/founder` → `AppSignup` and `/onboarding/investor` → `AppSignup` so any external links keep working.

### 4. Walk through both end-to-end flows and verify

Founder:
`/app` → `/app/signup?role=founder` → 5 signup steps → email confirm → `/onboarding` (checklist shows) → "Continue" → `/dashboard` → Discover, Inbox, Fundraising → Cap Table, Settings, Concierge, Referrals, Profile share.

Investor:
`/app` → `/app/signup?role=investor` → 5 signup steps → `/onboarding` (investor variant) → `/dashboard` → Discover, Inbox, Investments, Settings, Concierge.

For each step I will: (a) confirm `navigate()` targets the right route, (b) confirm the destination route exists in `App.tsx`, (c) confirm AuthGuard does not bounce the user back to onboarding once dismissed.

### 5. Test-account verification

Sign in with `test.founder@catalyst.test / test1234` and `test.investor@catalyst.test / test1234`, confirm both land on `/onboarding` with an empty 0/5 checklist, then can dismiss to `/dashboard` without being locked out.

## Technical details

- **No DB migrations required.** `onboarding_dismissed_at` already exists; `ProfileCompletionGate`'s `profile_grace_until` column can stay in the schema unused.
- **No edge function changes required.** `seed-test-accounts` already produces the desired empty-checklist state.
- After deleting `useApprovalCheck.ts` and the legacy pages, run a `rg` pass to ensure zero remaining imports before considering the audit complete.
- The `is_approved()` SQL function and `user_roles` 'user' insert from `seed-test-accounts` are unused after this change but harmless; leave for now.

## Out of scope

- `/match/*` live event platform — untouched.
- `/` `EventSignIn` homepage — untouched (separate product per earlier decisions).
- Visual redesign of the onboarding page — only fixing display + gate logic.
