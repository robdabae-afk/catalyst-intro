# Pre-revenue traction tiles

## Goal
When a founder has not reported revenue, the Traction grid stops showing MRR, Growth (MoM) and Paying Customers, and instead shows metrics that prove the traction they actually have. Founders choose which metrics appear.

## How pre-revenue is detected
Founders already declare this: the "MRR / revenue" field in signup and Settings has a "Pre-revenue" option. A founder is pre-revenue when that field is empty or set to "Pre-revenue". No new toggle.

## New pre-revenue metrics (founder picks 2)
Founders pick exactly two of these to display:

- **Waitlist / signups** — total signups or waitlist size
- **Active users** — weekly or monthly active users
- **Pilots / LOIs** — paid or unpaid pilots, letters of intent, design partners
- **Product status** — In development / Private beta / Public beta / Launched

## The pre-revenue grid (4 tiles)
1. The two metrics the founder picked
2. **User growth (MoM)** — its own field, separate from revenue growth
3. **Months in Operation** — already automatic from the company start date

If a founder picks fewer than two, the grid falls back to whichever metrics have values, then to Product status.

## Founder override
A pre-revenue founder can choose any four tiles from the full pre-revenue set (the four metrics above, user growth, months in operation, team size/headcount, stage). MRR, Paying Customers and revenue Growth (MoM) are never selectable while pre-revenue — those appear only once revenue is reported.

Post-revenue founders keep today's grid: MRR, Growth (MoM), Customers, Months in Operation.

The free-text traction narrative and the Pre-revenue / Post-revenue and Full-time team badges stay exactly as they are.

## Where founders enter this
- **Settings → founder section**: fields for waitlist/signups, active users, pilots/LOIs, product status, user growth (MoM), plus a picker for which tiles to display (max 4, revenue tiles disabled while pre-revenue).
- **Signup (founder step 4)**: the same metric fields plus product status, kept short — tile selection defaults automatically and can be refined later in Settings.

## Technical notes
- Migration on `founder_profiles` (all nullable, additive): `waitlist_signups integer`, `active_users text`, `pilots_lois integer`, `product_status text`, `user_growth_mom text`, `traction_tiles text[] default '{}'`.
- Update the `handle_new_user` trigger to read the new keys from signup metadata.
- `src/pages/ProfileView.tsx`: derive `isPostRevenue` as today; build the tile list from `traction_tiles` filtered against an allowed-keys list for the current revenue mode, falling back to defaults. Reuse the existing `TractionStat` component and `monthsInOperation` helper.
- `src/pages/Settings.tsx`: new state, load, save, and inputs; tile picker enforces the 4-tile cap and disables revenue tiles when pre-revenue.
- `src/pages/app/AppSignupForm.tsx`: new founder fields written into signup metadata.
- Regenerate database types after the migration.

## Value colors
Applies to the metric value only, never the tile label:

- **Growth (MoM)** — revenue growth and user growth both show the number in green `#5EC98E` when growth is above 10%; otherwise the default value color.
- **Months in Operation** — green `#5EC98E` when greater than 6 months; otherwise default.
- **Active Users** — always green `#5EC98E`.

Growth values are parsed from the entered text (leading `+`/`-` and `%` tolerated) to compare against 10%; unparseable values stay the default color.
