## Plan: Make hidden profiles disappear from discovery reliably

### What I found
- The admin Visible/Hidden button does update `profiles.is_hidden`.
- The current `/dashboard` discovery grid already asks for the opposite user type and excludes test accounts.
- The likely mismatch is backend visibility logic: admins have a separate “view all profiles” rule, so if the signed-in account is also an admin, hidden profiles can still be returned by discovery queries.
- There are also older desktop swipe/feed paths that query `profiles` directly and may rely on backend filtering rather than explicitly filtering `is_hidden`.

### Fix
1. **Add explicit client-side discovery filters**
   - In `/dashboard` discovery feed queries, add `.eq("is_hidden", false)` so the feed never intentionally asks for hidden users.
   - In the older desktop swipe query path, add the same `is_hidden = false` filter for live discovery mode.

2. **Tighten backend discovery visibility**
   - Update profile SELECT policies so general discovery access requires `is_hidden = false`.
   - Preserve admin ability to manage/view users in the admin dashboard, but avoid admin “view all” accidentally making hidden users appear in normal discovery contexts if possible.

3. **Verify the current data state**
   - Confirm how many founders/investors are still marked visible.
   - If old profile cards are from profiles that are still visible, report those remaining visible accounts clearly.

4. **Validate**
   - Re-query as a non-admin discovery user where possible and confirm hidden profiles are not returned.
   - Check the admin toggle still updates hidden/unhidden status.

### Technical notes
- Current visible counts show 10 visible founders including one test founder, and 1 visible investor. If you expected almost everyone hidden, some profiles are still intentionally visible in the database.
- The safest immediate app fix is adding `is_hidden = false` directly to the discovery queries, because it works even when the current user has admin privileges.