# Show the full profile layout even when fields are empty

Right now the profile page hides every section whose data is missing (`{fp?.one_liner && ...}`, `{fp?.traction && ...}`, funding/team/industry blocks, and the investor equivalents). For someone like Lauren Roth, who signed up but never finished onboarding, that leaves an almost entirely black card.

Goal: keep the structure and design visible always, with clear empty placeholders, while keeping the existing "complete your profile" prompting untouched.

## What changes

**Founder profile sections (ProfileView)**
- Always render: headline block (name, startup/company, stage, location), one-liner, traction, key stats (MRR, raised, stage, backed by), funding round, industries, team/headcount, pitch deck row.
- Missing single values render as a muted placeholder dash (`—`) in the same slot instead of the row disappearing.
- Missing free-text blocks (one-liner, traction) render muted italic placeholder copy, e.g. "No one-liner yet" / "No traction shared yet".
- Missing list blocks (industries, team, portfolio) render the section header plus a single muted "Not added yet" line.
- `startup_name` placeholder values like "Untitled" are treated as empty so they show the placeholder rather than the literal word.

**Investor profile sections (ProfileView)**
- Same treatment for thesis, check size, preferred stage, sectors, responsiveness, portfolio, and track record rows.

**Discover / swipe cards**
- Keep the card's visual skeleton: name + role always, and muted placeholder text where the one-liner / stage / industry chips would be, so a card is never a blank black rectangle.

**Own profile vs. someone else's**
- When viewing your own incomplete profile, placeholders become tappable and route to the matching onboarding/settings step (existing prompting behavior stays as-is on top of this).

## Technical notes

- Add small shared helpers in `src/pages/ProfileView.tsx`: `EmptyValue` (muted dash) and `PlaceholderText` (muted italic copy), plus a `val(x)` normalizer that maps `null`, `""`, and `"Untitled"` to undefined.
- Replace the `{cond && (<Section/>)}` guards with unconditional sections that pass either the value or the placeholder; keep existing styling tokens (`#94908A` muted color, same font sizes) so nothing looks off-theme.
- Apply the same normalizer in `src/components/discover/DiscoverCard.tsx` and `src/components/SwipeCard.tsx` for the subtitle/chips area only — no changes to swipe/queue logic.
- No database or RLS changes; presentation only.
