# Monetization draft
No production migration, function deploy, merge, or publish has been performed. New migration only: 20261011120000_monetization.sql. Native iOS digital purchases deliberately block Stripe until a StoreKit/RevenueCat adapter is connected.

## Confirmed catalog
Founder Pro is USD 29 monthly or 290 yearly. Investor Pro is USD 19 monthly or 190 yearly. Annual billing charges ten monthly payments, covering twelve months. Four independent Stripe recurring price IDs are configured using .env.billing.example. Server chooses member role from the authenticated profile, accepts only month/year, and validates amount, currency and recurring cadence before checkout.

Concierge costs 45 for one investor introduction (founders only), or 55 for two introductions (either role); active Pro discounts these by 20%. Message packs cost 25 for three or 35 for six. Packs do not recur.

## Credit cadence
Both monthly and annual Pro earn one instant-message credit per subscription month, not twelve credits up front on an annual payment. Monthly payments grant once per paid period. Annual earned months accrue transactionally when the member loads billing or sends a credit message. Missed months in an active paid annual period accrue on return. Keys deduplicate snapshot requests, webhooks and send retries. No background cron is required. UTC subscription-anniversary dates anchor annual monthly grants; no accrual while subscription is unpaid, inactive or expired.

## Configuration and validation
Create test-mode recurring prices for the four role/cadence combinations and fixed one-time pack prices, plus an unrestricted 20% concierge coupon. Set server secrets from .env.billing.example, register billing-webhook, and enable the Stripe billing portal. Required webhook events are checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed. Checkout verifies JWT plus member approval; webhook verifies the raw-body signature and refuses live events.

New SQL uses server-owned wallets, usage and entitlements with RLS and explicit function grants. Per-member locks serialize quota/credit grants and spending. Match/message restrictions close existing direct-client bypasses. Review legacy send-instant-message and manage-subscription deployments before production cutover; legacy token balances and subscriptions are not migrated or treated as new Pro. Review existing subscribers and disable incompatible old billing functions before launch.

Run npm run typecheck, npm run build, bun test tests/billing-catalog.test.ts. Deno check the two new billing function entrypoints. Database tests run the minimal schema contract in tests/billing-baseline.sql, then the new migration, then tests/billing-database.sql against an isolated local database only. This is a contract test, not a replay of production migrations. Mobile preview interaction checks pass for both annual role prices and the payment guard at 390px. Full staging-schema validation and actual Stripe checkout/webhook E2E remain blocked on credentials.

## Preview and remaining work
npm exec vite build -- --config vite.pricing.config.ts creates dist-pricing; npm exec vite preview -- --config vite.pricing.config.ts --port 52743 serves pricing-preview.html. This separate artifact uses preview.invalid and a no-network CSP, never production payments or backend. Toggle member role, free/Pro/limit, and monthly/yearly.

Production readiness still needs native purchase verification, refund/dispute policy and handling, old-billing cutover, staging integration tests, actual Stripe test payments and review of messaging consent/abuse controls. Boost ranks within fetched feed pages, not globally across the full directory. Read receipts and a full server-gated advanced-filter endpoint are not implemented. Do not describe this draft as fully production-ready.
