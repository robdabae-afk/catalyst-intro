
## Root cause

The test founder login **succeeds in auth**, but **no `public.profiles` row exists** for that user — verified directly in the DB:

```
test.founder@catalyst.test  → auth.users ✓   profiles ✗   founder_profiles ✗
test.investor@catalyst.test → auth.users ✓   profiles ✗   investor_profiles ✗
```

The `on_auth_user_created` trigger does exist, but `handle_new_user()` silently swallows errors (`EXCEPTION WHEN OTHERS THEN RAISE LOG …`), so the test seed created the auth user and the trigger failed for those two rows — leaving them with no profile.

When the user signs in:

1. `useAuth` → `profiles` query returns `null` → `currentUser = null`.
2. `AuthGuard` polls profiles 5× and finds nothing → falls through and renders `<Dashboard>`.
3. `Dashboard.fetchProfiles` early-returns on `!currentUser` **without** setting `loading = false`.
4. The page is stuck on "Curating Profiles…" forever.

This will affect **any** user whose profile row is missing for any reason (trigger race, trigger error, seed function failure), so we must fix it in three places.

## Plan

### 1. Backfill the test accounts (DB migration)

Insert the missing `profiles` + `founder_profiles` / `investor_profiles` rows for the two test users directly, idempotently:

- `profiles` row with `user_type`, `name`, `email`, `legal_accepted_at = now()`, `avatar_url = null`, `onboarding_dismissed_at = null` (so the gamified checklist shows).
- For the founder: `founder_profiles` with `startup_name="Acme Labs"`, `one_liner`, `preferred_city`, `stage='seed'`, `industry=['AI','Fintech']`.
- For the investor: `investor_profiles` with `firm_name="Catalyst Capital"`, `position="Partner"`, `location`, `preferred_stage='seed'`, `sectors_of_interest=['AI','Fintech']`.

### 2. Fix the silent failure mode in Dashboard

In `src/pages/Dashboard.tsx`:

- When `authLoading` resolves and `currentUser` is still `null`, redirect to `/onboarding` (the gate will recreate / route correctly) rather than spinning forever.
- Move `setLoading(false)` so it always fires when `currentUser` is null instead of leaving the spinner up.

### 3. Make AuthGuard recover instead of falling through

In `src/components/AuthGuard.tsx`: if the profile row is still missing after polling, redirect the user to `/onboarding` instead of rendering the protected page. `/onboarding` is the right "we need your profile created" surface and it already polls itself.

### 4. Re-test

Sign in as `test.founder@catalyst.test` / `test1234`:
- Expect: `/dashboard` loads — either the checklist appears (if `onboarding_dismissed_at` is null) or the swipe feed renders.
- Same for `test.investor@catalyst.test`.

## Technical details

- No table schema changes — only data inserts.
- Migration uses `INSERT … ON CONFLICT DO NOTHING` so it's safe to re-run.
- Not deleting any additional pages this round — the remaining sprawl (Dashboard, Matches, Settings, etc.) is the actual product. Aggressive purge offered by the user isn't needed to fix this bug.
- Not editing `handle_new_user()` itself — the trigger is fine for the live signup flow; the seed function is the outlier and the next plan will rework it if you want.

## Out of scope

- Rewriting the seed function (works on fresh accounts going forward; only the two existing rows are affected).
- `/match/*` — untouched.
