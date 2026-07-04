
# Catalyst Deck Visual Editor

Goal: an admin-only, in-browser visual editor for `/catalystdeck` that lets you edit text, swap images, move/resize elements, delete, and add new elements — without touching the hand-coded HTML/animations. Edits live in Lovable Cloud and appear for all viewers immediately.

## Approach

Keep `public/catalystdeck.html` as the design source of truth. Layer a per-element **overrides** system on top:

- Each editable element gets a stable `data-edit-id` (e.g. `slide-3.problem-quote`, `slide-6.pillar-1.title`).
- An overrides record in the DB stores, per `edit_id`: text, image url, inline style patch (transform/left/top/width/height/rotation/font-size/color), and a `hidden` flag.
- A tiny runtime script in the iframe fetches overrides on load and applies them to matching elements.
- The editor is a separate route that loads the same iframe but in "edit mode" — clicking any element selects it; a floating inspector panel edits its properties; changes save to the DB and re-apply live.
- Adding a new element = an override record that injects an absolutely-positioned text/image node into a target slide.

## Routes

- `/catalystdeck` — public view (unchanged UX). Loads overrides read-only.
- `/catalystdeck/edit` — admin-only editor. Same iframe, plus editor chrome (toolbar, slide list, inspector, history).

## Editor UI

```text
+----------------------------------------------------------+
| Toolbar: Save state · Undo · Redo · Add text · Add image |
|          Delete · Reset slide · Exit · Publish snapshot  |
+-------+----------------------------------------+---------+
| Slide |                                        | Inspec- |
| list  |         Iframe (edit mode)             | tor     |
| (thmb)|         click = select                 | text /  |
|       |         drag = move                    | image / |
|       |         handles = resize               | style / |
|       |         Δ = rotate                     | position|
+-------+----------------------------------------+---------+
```

Interactions:
- **Select**: click any tagged element inside the iframe. Selection highlights with a blue outline + 8 resize handles + rotate handle.
- **Move**: drag the element. Snaps to slide edges and to sibling element centers (5px tolerance).
- **Resize**: drag corner/side handles. Shift = keep ratio.
- **Rotate**: drag the top handle.
- **Text edit**: double-click to inline edit (contenteditable). Enter to commit, Esc to cancel.
- **Image swap**: click image → inspector shows current + "Upload replacement" (Lovable Cloud storage bucket) + URL field.
- **Style**: inspector exposes font size, weight, color, text align, letter spacing, opacity, background.
- **Delete**: Del/Backspace hides the element (`hidden: true` override).
- **Add**: toolbar "Add Text" / "Add Image" drops a new element on the current slide with a generated `edit_id`.
- **Reset**: per-element "Reset to original" and per-slide "Reset slide" clears overrides for that scope.
- **Undo/Redo**: local history stack of override diffs (memory only, no DB history table in v1).

## Data model (Lovable Cloud)

Two new tables. Both admin-write, public-read (deck is public).

`deck_overrides`
- `id uuid pk`
- `deck_slug text not null` (e.g. `catalyst`)
- `edit_id text not null` (stable element id, or generated for added elements)
- `kind text not null check in ('override','insert')` — override existing vs new element
- `slide_key text` (which slide it belongs to, for inserts and slide-scoped reset)
- `parent_selector text` (for inserts: where to append; defaults to the slide root)
- `element_type text` (for inserts: `text` | `image`)
- `text_content text`
- `image_url text`
- `style jsonb` (subset: position, size, transform, font, color, align, opacity, background)
- `hidden boolean default false`
- `z_index int default 0`
- `updated_at timestamptz default now()`
- unique(`deck_slug`, `edit_id`)

`deck_assets` (uploaded images used in the deck)
- Backed by existing Lovable Cloud storage (`deck-assets` bucket, public).

RLS:
- `select` for everyone (deck is public).
- `insert/update/delete` restricted to `has_role(auth.uid(), 'admin')`.
- `GRANT SELECT` to `anon, authenticated`; `GRANT ALL` to `authenticated` (RLS gates writes) and `service_role`.

New storage bucket `deck-assets` (public) for editor image uploads.

## Runtime overlay

Inside `catalystdeck.html`, a small script at the bottom:

1. Fetches `/rest/v1/deck_overrides?deck_slug=eq.catalyst` (anon key already in code).
2. For each `override`: `document.querySelector('[data-edit-id="…"]')` → apply text/image/style/hidden.
3. For each `insert`: build a `<div>` or `<img>`, set `data-edit-id`, position absolutely inside `parent_selector`, append.
4. Subscribes to realtime changes on `deck_overrides` so the editor and the public view both live-update (nice-to-have; polling on save is fine for v1).

The public view stays exactly as it looks today unless an admin has made edits.

## Tagging pass (one-time)

Add `data-edit-id` to every currently editable element in `catalystdeck.html`: headings, body paragraphs, quote blocks, pillar titles/bodies, traction numbers, team names/roles/initials, ask amounts, buttons, images. Naming: `slide-<n>.<region>.<field>` (e.g. `slide-3.quote`, `slide-6.pillar-1.title`). No visual change; purely hooks for the editor.

## Editor implementation

New files:
- `src/pages/CatalystDeckEditor.tsx` — layout, iframe host, message bus.
- `src/deck-editor/useOverrides.ts` — fetch/save/live-apply overrides.
- `src/deck-editor/Inspector.tsx` — property panel (text, image, style, position, delete, reset).
- `src/deck-editor/SlideList.tsx` — scrollable thumbnail rail of slides (jump-to-slide).
- `src/deck-editor/EditorToolbar.tsx` — save state, undo/redo, add text/image, exit.
- `src/deck-editor/iframeBridge.ts` — postMessage protocol between editor and iframe.
- `public/catalystdeck-editor.js` — loaded only in edit mode; adds click-to-select, drag/resize/rotate, contenteditable, snapping, and messages selection + changes back to the parent.
- `public/catalystdeck-overlay.js` — loaded in both view and edit modes; applies overrides to the DOM (view mode is read-only, edit mode wires up interactions on top).

Route wiring:
- Add `/catalystdeck/edit` in `src/App.tsx`, wrapped in the existing admin guard (mirror `Admin.tsx`).
- `CatalystDeck.tsx` unchanged; `catalystdeck.html` gains the overlay script and `data-edit-id`s.

## Admin gating

Reuse `useIsAdmin` and the admin route guard already used for `/admin`. Non-admins hitting `/catalystdeck/edit` are redirected to `/catalystdeck`.

## Publish flow

Edits go live immediately (they're just DB rows applied at render). No separate publish step in v1. We can add a "draft vs published" toggle later if you want a review step.

## Out of scope for v1

- Reordering slides (deck order is baked into HTML). Add later via an `order` override on slide sections.
- Editing keyframe animations. Only static props are editable.
- Version history / rollback beyond in-session undo/redo. If you want persistent history, we add a `deck_override_history` table in a follow-up.
- Print/PDF changes — the existing print CSS already reads the DOM at print time, so overrides print correctly with no extra work.

## Milestones

1. **Schema + storage + overlay runtime** (public view unchanged, but overrides now apply if present).
2. **Tag every existing element** with `data-edit-id`.
3. **Editor route + iframe bridge + selection + inspector** (text and style editing working end to end).
4. **Drag/resize/rotate + snapping + undo/redo**.
5. **Image upload + add new text/image + delete + per-slide reset**.
6. **Admin gate + polish + QA pass on every slide**.

## Technical notes

- Iframe ↔ parent uses `postMessage` with a small typed protocol: `select`, `change`, `insert`, `delete`, `hover`, `scroll-to-slide`.
- Coordinates stored in slide-local percentages (of the 1280×720 scene box) so edits stay correct when the deck scales for different viewports and for print.
- Style overrides are a whitelist (no arbitrary CSS strings) to keep the runtime safe and predictable.
- Realtime subscription is optional; on save we already re-apply locally, and the public page re-fetches on next load.
