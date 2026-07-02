
# Investor Discovery & Profile Redesign

Reworks two surfaces on `/dashboard` and `/profile/:id` for the founder-viewing-investor experience. Keeps the strict single-viewport rule on the grid and moves depth into the full profile page. Introduces a structured "Request Intro" flow to replace one-tap Express Interest for investors.

## 1. Investor discovery card (grid)

Six cards on screen, no scroll. Each card is dense but scannable — think Kalshi market tile, not a dating card.

**Card anatomy (top → bottom):**
```text
┌─────────────────────────────────────┐
│ [Avatar] Name              [Save 🔖]│
│          Firm · Role                │
│                                     │
│ "One-line investment thesis text…"  │  ← italic, 2-line clamp, primary content
│                                     │
│ 💰 $25k–$100k   ●  Seed, Series A   │  ← check size + stages
│ 🏷 Fintech · AI · +2                 │  ← sector tags (max 3 visible)
│                                     │
│ ✓ Verified  ·  12 investments  ·  ⚡Active this week │
│                                     │
│ [ Request Intro ]                   │
└─────────────────────────────────────┘
```

**Signals shown (in priority order):**
1. Name + firm/role (identity)
2. One-line thesis (the "why" — most important)
3. Check size range + preferred stages
4. Sector focus tags
5. Trust row: verified badge, portfolio count, activity recency
6. Primary CTA: **Request Intro**, secondary: save (bookmark icon)

**Activity recency rule:** show `⚡ Active this week` if the investor logged in or responded to any intro in the last 7 days; `Active this month` for 30 days; otherwise omit.

## 2. Full investor profile page

Reached by tapping the card. Replaces the current sparse profile view (shown in the uploaded screenshot). Scrolling is allowed here — this is the depth surface.

**Proposed section order:**

1. **Header** — avatar, name, firm · role, verified badge, LinkedIn link, Save + Request Intro buttons pinned
2. **Investment Thesis** — full paragraph (not just the one-liner)
3. **Investment Focus** — structured chips:
   - Check size range
   - Preferred stages
   - Sectors of interest
   - Geography (if set)
4. **Track Record** — portfolio count, notable portfolio companies (text list from `notable_portfolio`), portfolio link (external)
5. **Activity & Responsiveness** — response rate %, typical response time, last active
6. **About** — investor type (angel/VC/fund), accreditation status, years investing
7. **Request Intro** — bottom CTA card with the structured pitch form

Every section gracefully hides when the underlying field is empty (no "Investment Focus" heading floating over blank space like the current screenshot).

## 3. Request Intro flow (replaces one-tap Express Interest for investors)

Founder taps **Request Intro** → modal with a short structured pitch:
- Startup one-liner (pre-filled from founder profile, editable)
- Ask amount + stage (pre-filled, editable)
- One-paragraph "why you" (fresh text, 500 char cap)
- Attach: pitch deck toggle (uses their existing deck)
- Submit → creates a row in a new `intro_requests` table AND a `swipes` row so match logic still works if reciprocated

Investor sees the request in Inbox with Accept / Pass. Accept opens chat (same match flow as today). Pass silently declines. Existing `expressInterest` stays as the underlying primitive; the modal is just a richer wrapper.

## 4. Technical notes

- **Card component:** rewrite `src/components/discover/DiscoverCard.tsx` to render the two-variant layout (existing founder card stays; new investor variant when `targetType === "investor"`).
- **Data:** all fields already exist on `investor_profiles` (`investment_thesis`, `typical_check_size`, `preferred_stage`, `sectors_of_interest`, `investment_count`, `notable_portfolio`, `accreditation_status`, `portfolio_link`, `investor_type`). No schema changes needed for the card or profile rewrite.
- **New table** for Request Intro:
  ```sql
  CREATE TABLE public.intro_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    pitch_summary text,
    ask_amount text,
    ask_stage text,
    why_you text,
    include_deck boolean DEFAULT true,
    status text DEFAULT 'pending', -- pending | accepted | passed
    created_at timestamptz DEFAULT now(),
    responded_at timestamptz
  );
  ```
  With GRANTs + RLS (founder can insert/read own; investor can read/update where `investor_id = auth.uid()`).
- **Response rate calc:** derived — `accepted / (accepted + passed)` from `intro_requests` where investor is target, computed in a view or on-read.
- **Profile page:** rewrite `src/pages/ProfileView.tsx` (or a new `InvestorProfileView`) for the investor variant. Founder profile view stays as-is for now.

## 5. What we're not touching this round

- Founder discovery cards (only investor cards get the new layout — will mirror in a follow-up)
- The match/chat UI once an intro is accepted
- Pro gating (still 6/day on the grid)

Ready to build once you approve.
