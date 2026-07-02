## Problem

On `/onboarding`, clicking "Continue to dashboard" (or "Skip for now") calls `navigate("/dashboard")`. Dashboard mounts and immediately runs:

```ts
if (!authLoading && !user) navigate("/onboarding");
```

`user` here is the `profiles` row from `useAuth`, not the auth user. For any signed-in user whose profile row hasn't hydrated (or briefly during load), Dashboard redirects straight back to `/onboarding` — a redirect loop that looks like "the next page doesn't load".

## Fix

In `src/pages/Dashboard.tsx`:

1. Replace the `useAuth`-based redirect with an auth-session check that only bounces truly unauthenticated visitors to `/auth`.
2. Keep rendering the dashboard when the auth session exists even if the `profiles` row hasn't loaded yet — downstream components already handle a null profile.

Concretely, swap the effect at lines 42-44 for one that calls `supabase.auth.getUser()` (or reads the session) and only navigates to `/auth` when there is no auth user. No other behavior changes.

## Out of scope

- No changes to Onboarding.tsx, AuthGuard, or the feed hooks.
- No schema changes.
