
## Two issues to fix

### 1. Admin tabs overflow horizontally
`src/pages/Admin.tsx` renders the top `TabsList` as a fixed 15-column CSS grid (`gridTemplateColumns: repeat(15, minmax(0,1fr))`). On any viewport narrower than ~1400px the individual triggers get squeezed unreadable or force horizontal scrolling to reach the Users tab (where already-approved members live).

**Fix**: replace the fixed-grid `TabsList` with a wrap-friendly flex layout so triggers wrap onto multiple rows and remain fully clickable at any width.

- Change the wrapper to `flex flex-wrap gap-1 h-auto justify-start` and drop the `gridTemplateColumns` inline style.
- Keep the existing tab set and icons unchanged; no route or state changes.

### 2. Approve / Deny / Edit Suggestion actions break in real usage

Verified in `src/pages/Admin.tsx`:

- `approveUser` does a naked `INSERT` into `user_roles`. `user_roles` has a `UNIQUE (user_id, role)` constraint. When admin re-approves someone who already has the `user` role (typical after a "pending update" resubmission), the insert fails with a duplicate-key error and the user sees "Error approving user". The re-approval path is effectively broken.
- `approveUser` also never clears `has_pending_update`, `admin_edit_suggestion`, `admin_edit_message`, or `rejection_reason`. After a successful approval the profile still shows stale flags — the row keeps appearing under Pending / Needs Re-Review and the previous rejection reason lingers.
- `denyUser` updates `profiles` but never removes the existing `user` role from `user_roles`. A previously approved user who is then denied still passes `is_approved()` and keeps platform access. Denial silently doesn't take effect.
- `AdminEditSuggestion` sets `has_pending_update: true` on the target profile but doesn't clear a prior `rejection_reason`. If admin ever wants to move a rejected profile back into the edit-request flow, the profile still classifies as "rejected".

**Fix (all in existing frontend code, no schema changes):**

- `approveUser`:
  - Replace `insert` with `upsert({ user_id, role: 'user' }, { onConflict: 'user_id,role', ignoreDuplicates: true })` so re-approval is idempotent.
  - After the role write succeeds, run one `profiles` update that clears `has_pending_update`, `admin_edit_suggestion`, `admin_edit_message`, and `rejection_reason`.
- `denyUser`:
  - After the profiles update, also `DELETE FROM user_roles WHERE user_id = ? AND role = 'user'` so previously approved users actually lose access on denial. Ignore "no rows" errors.
- `AdminEditSuggestion.handleSendSuggestion`:
  - Also set `rejection_reason: null` in the update so an in-progress edit request cleanly overrides any prior rejection status.

No RLS or migration changes needed — admin policies already permit these writes (verified against `pg_policies`).

### Verification

After edits:
1. Approve a user who already has the `user` role (has_pending_update = true) → succeeds, row disappears from Pending / Needs Re-Review, flags cleared.
2. Approve a previously rejected user → succeeds, `rejection_reason` cleared, they gain access.
3. Deny a previously approved user → `user` role removed, profile flagged rejected, they lose access.
4. Send an edit suggestion to a rejected user → `rejection_reason` cleared, `has_pending_update` flips true.
5. On a 1024px-wide viewport, all admin tabs are visible without horizontal scrolling.

### Files touched

- `src/pages/Admin.tsx` — TabsList layout, `approveUser`, `denyUser`.
- `src/components/AdminEditSuggestion.tsx` — clear `rejection_reason` in the update.
