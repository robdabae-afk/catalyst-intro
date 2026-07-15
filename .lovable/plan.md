
## Goal

Give admins a true "Review Mode" for approving/disapproving founders and investors. Instead of the current text-only `AdminProfilePreview` dialog, admins get a dedicated section in `/admin` that shows each profile exactly as users see it — mini discovery card and full profile — from both audience perspectives.

## Where this lives

- **New dedicated section in `/admin`** ( `src/pages/Admin.tsx` ): a top-level "Profile Reviews" tab/panel alongside existing admin panels. This becomes the canonical place to approve, reject, or request edits.
- The existing inline Approve/Reject buttons in the users list stay, but the "Preview" button opens the new Review Mode (replacing today's `AdminProfilePreview`).

## UX

### `/admin` → "Profile Reviews" section
- Sub-tabs: **Pending** (default), **Needs Edits (pending updates)**, **Recently Reviewed**.
- Each row: avatar, name, user type, submitted-at, `has_pending_update` flag, quick Approve / Request Edits / Reject buttons, and an **Open Review Mode** button.
- Counts on the tab labels (Pending N).

### Review Mode dialog (large, `max-w-6xl`, scrollable)
Header: avatar, name, email, user type, submitted-at, pending-update flag.

Tabs:
1. **Discovery Card** — real `DiscoverCard` (and/or `SwipeCard`) rendered with this user's data, styled as it appears in the feed. Includes a **perspective toggle**: "As a founder sees" / "As an investor sees" — both perspectives always available regardless of the reviewed user's role, since framing and gated fields differ by audience.
2. **Full Profile** — same JSX as `/profile/:id`. Same perspective toggle so admins see how each audience experiences the full page (unlock states, gated fields).
3. **Raw Data** — collapsed by default; the current text-field dump for quick scanning.

Sticky footer: **Approve**, **Request Edits** (opens existing edit-suggestion flow), **Reject**. Uses the existing handlers in `Admin.tsx` (`approveUser`, edit suggestion, reject). Approval logic is unchanged.

## Technical approach

1. **New panel** `src/components/AdminProfileReviewsPanel.tsx`
   - Fetches profiles grouped by status (pending / pending-update / recently reviewed).
   - Renders the sub-tabs and per-row quick actions.
   - Opens `AdminReviewMode` on demand.

2. **New dialog** `src/components/AdminReviewMode.tsx`
   - Props: `userId`, `userType`, `open`, `onOpenChange`, `onApprove`, `onReject`, `onRequestEdits`.
   - Loads `profiles` + `founder_profiles` / `investor_profiles` once.
   - Contains Discovery Card / Full Profile / Raw Data tabs plus the perspective toggle.

3. **Reuse real user-facing components** (read-only)
   - Discovery Card tab renders `src/components/discover/DiscoverCard.tsx` and `src/components/SwipeCard.tsx` (whichever matches the feed variant) with a new `previewMode` prop that disables interactive handlers and forces unlocked visuals.
   - Full Profile tab renders the inner content of `src/pages/ProfileView.tsx`. Extract that inner render into `ProfileViewContent({ userId, viewerPerspective })`; `ProfileView.tsx` becomes a thin route wrapper. Both `/profile/:id` and Review Mode use the identical component so the two views cannot drift.
   - `viewerPerspective: 'founder' | 'investor'` drives audience-specific gating so the toggle actually changes what admins see.

4. **`src/pages/Admin.tsx` wiring**
   - Add a "Profile Reviews" section that mounts `AdminProfileReviewsPanel`.
   - Replace `AdminProfilePreview` usage with `AdminReviewMode`, wiring approve / reject / request-edits to existing handlers.
   - Leave `AdminProfilePreview.tsx` in place; Raw Data tab can embed or supersede it.

5. **No backend / schema / RLS changes.** All required data is already readable by admins.

## Out of scope

- No changes to approval logic, notifications, or approve/reject SQL paths.
- No new admin permissions.
- No redesign of `DiscoverCard`, `SwipeCard`, or `ProfileView` — only prop additions and extracting `ProfileView`'s inner render.

## Files touched

- `src/components/AdminProfileReviewsPanel.tsx` (new)
- `src/components/AdminReviewMode.tsx` (new)
- `src/pages/Admin.tsx` (add section, swap dialog, wire callbacks)
- `src/pages/ProfileView.tsx` (extract `ProfileViewContent`, accept `viewerPerspective`)
- `src/components/discover/DiscoverCard.tsx` and `src/components/SwipeCard.tsx` (add `previewMode` + `viewerPerspective` props)
