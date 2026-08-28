# Simulated QA sweep: every function, both user types

Yes — this can be done with a scripted browser (Playwright) driving the real app in the sandbox, signed in as a founder test account and then an investor test account, clicking through every page and action while recording console errors, failed network calls, blank screens, and dead buttons. The output is a written QA report in chat (and optionally a saved markdown file), not new app features.

## What gets tested

Shared (both roles)
- Sign-in, sign-out, forgot password, waitlist page, public signup pages
- Home feed: hot picks, news, latest updates carousel, priority match card, all "View all" links
- Discover/swipe: card render, pass/connect/like, tap-to-expand, daily limit behavior, caught-up state
- Full profile view: hero, traction tiles, sections, share, action tray
- Messages/Matches: thread list, open thread, send message, unread badges, filters, thread menu
- Connections, Requests, Coffee chat scheduling, Settings (every field save + avatar/logo upload), Filter preferences, Referrals, Onboarding checklist, Support/feedback, Catalyst deck viewer

Founder-only
- Signup wizard end to end, profile completion, traction tile selection, MRR/growth/customers/ops-date/full-time-team fields
- Post a startup update (category, image source), Latest Updates founder view (Post + composer, comment-only restrictions)
- Founder analytics, SAFEs list/detail, cap table, document requests, pitch deck visibility toggle, identity verification upload

Investor-only
- Signup steps, investor profile fields (thesis, check size, sectors, portfolio companies)
- Request intro banner (like + intro_request row + priority message), Latest Updates investor view
- Portfolio / investments, market pulse, SAFE generation and signature flow, watchlist, document requests

## How each failure is judged

For every step the script records: final URL, whether expected content rendered, console errors, network 4xx/5xx (with the endpoint), and whether the click changed state. Each becomes PASS / FAIL / BLOCKED with the evidence attached.

## Known blockers to resolve first

- `AuthGuard` currently redirects non-admin users to `/settings`, so a plain founder or investor account can only reach Settings. The sweep needs either admin-flagged test accounts or a temporary bypass; without one, most role screens report BLOCKED rather than tested.
- Most `%test%` accounts have `approved = false` and many are `is_hidden = true`, which changes discovery and gating behavior. I'll pick one founder and one investor test account that are approved and unhidden, or note the gate as the finding.
- Anything requiring real Stripe payment, real email/SMS delivery, or Google Calendar OAuth will be exercised up to the external handoff and then marked "external — not executed".

## Technical approach

- Playwright scripts under `/tmp/qa-sweep/`, one per role, run against `http://localhost:8080`, mobile viewport 394x690 plus a desktop pass.
- Sessions minted per test user with `lovable auth-session` and restored into localStorage before navigating.
- Console + `page.on("response")` listeners capture every error; screenshots saved per step for failing cases.
- Read-only against the database except where the test action itself writes (messages, updates, swipes, intro requests) — those rows are created under test accounts and listed in the report so they can be cleaned up.
- Deliverable: a findings table in chat grouped by role and severity, each item naming the page, action, and observed error.

## Not included

No fixes are applied in this pass — the sweep produces the failure list first, then you pick what to fix.
