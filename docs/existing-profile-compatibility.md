# Existing profile compatibility

The production catalog keeps published app_companies and app_events and reads existing profiles, founder_profiles and investor_profiles for authenticated sessions. This is a read-only compatibility layer, not a data migration. Existing accounts continue to use the same database and authentication identities.

Only approved, visible, non-flagged, non-test profiles are mapped. Safe column projections exclude email, phone, Stripe identifiers, addresses and financial documents. Existing database RLS remains authoritative. Public visitors do not gain access to private profile tables. Catalog companies are previews, not investment offerings; no raised amounts, investors or returns are invented.

The account synchronizer hydrates an existing member's avatar, role, interests and founder one-liner or investor thesis before applying saved app preferences. It does not write, migrate or reseed the original profile.

Verification on October 7, 2026 used an existing administrator test account and the real backend. Existing tables returned 219 profiles, 208 founder records and 32 investor records; published app catalogs were empty. After visibility filters, seven valid founder companies and eight people rendered. Main /search, /people and /me were checked in an isolated browser with all backend writes blocked before injecting the existing session. The existing investor thesis populated the bio editor even though app_prefs was empty. This verifies administrator access, not ordinary-investor RLS.

The custom domain was serving an older bundle with static sample routes. Legacy authenticated matches and an existing founder profile rendered there, so a blanket database outage was not reproduced. Publishing the corrected main build is a separate deployment step. No SQL migration, backfill, visibility change or RLS relaxation is required by this code repair.
