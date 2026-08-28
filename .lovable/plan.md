# Priority Match data source & definition

## Current behavior
The "Priority match" count on `/app/home` is currently pulled from the `swipes` table and counts **every incoming `like`** sent to the logged-in user:

```tsx
// src/pages/Home.tsx lines 44-54
const { count } = await supabase
  .from("swipes")
  .select("*", { count: "exact", head: true })
  .eq("swiped_id", user.id)
  .eq("action", "like");
setNewMatchCount(count ?? 0);
```

For the logged-in investor test account ("PATRICK - ACTIVE TEST") this returns **5 incoming likes**, which is what the card shows.

The comment in the code calls these "mutual matches," but the query does **not** check whether the current user also liked those people back. The `/matches` page uses the correct mutual-match logic (find profiles the user liked, then check if those profiles also liked the user).

## Proposed fix
Change the Priority Match card to count only **mutual likes** — the same definition the Matches page uses. Optionally restrict the count to likes/matches created in the last 7 days so it actually represents "new" priority matches.

### What will change
1. Replace the simple `swipes` count in `src/pages/Home.tsx` with a mutual-match query.
2. Align the "new" window with `useNewMatches.ts` (last 7 days) or confirm a different window.
3. Keep the existing UI label logic (investor sees founders, founder sees investors).
4. Add a fallback empty state or hide the card when count is 0 if desired.

### Verification
- Cross-check the returned count against the `/matches` page and the `swipes` table for consistency.
- Confirm whether hidden/test profiles should be excluded from the count.
