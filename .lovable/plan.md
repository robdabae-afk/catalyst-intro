## Root cause

Image upload in the deck editor is uploading to the `avatars` storage bucket at path `deck/catalyst/{uuid}.ext`. The `avatars` bucket's INSERT policy requires the first folder in the path to equal the uploader's user id (`auth.uid() = storage.foldername(name)[1]`). Because we start the path with `deck/…` instead of `{userId}/…`, storage rejects the upload with the RLS error you're seeing. Nothing in `deck_overrides` is actually at fault — the failure happens on the file upload step, and the toast message just bubbles up the same wording.

## Fix

Create a dedicated public storage bucket for deck assets so uploads aren't shoehorned into the user-scoped `avatars` bucket. Deck images are shared, not per-user, so they belong in their own bucket with admin-only writes.

**Storage**
- New public bucket `deck-assets` (public read so anyone viewing `/catalystdeck` can load the images).
- RLS policies on `storage.objects` for this bucket:
  - `SELECT`: public (anyone can read).
  - `INSERT` / `UPDATE` / `DELETE`: authenticated admins only, via `has_role(auth.uid(), 'admin')`.

**Editor code (`src/pages/CatalystDeckEditor.tsx`)**
- Change `uploadImage` to upload into `deck-assets` at path `catalyst/{uuid}.{ext}` and use `getPublicUrl` from that bucket.
- Keep the existing `handleImageUpload` (swap on selected image) and `addImageElement` (toolbar "Add image") wired to the same helper — both now succeed.
- Keep the toast improvements from the last change so a real failure still surfaces clearly.

Existing images that were successfully saved to `avatars/deck/...` in the past (if any) keep working since the `avatars` bucket allows public read; only new uploads switch to `deck-assets`.

## Out of scope

- No changes to the `deck_overrides` table or its policies — those are correct.
- No migration of previously uploaded files.
