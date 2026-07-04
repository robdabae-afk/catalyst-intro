## Problem

**1. Edits look different on `/catalystdeck` vs the editor.**
The editor stores drag/resize output in absolute pixels:
- Drag saves `transform: translate(240px, 130px)` (see `catalystdeck-editor.js` `endResize`/`mouseup`).
- Resize saves `width: 640px; height: 420px` (in px, marked `!important`).

`.scene` sizes itself to the viewport (`min-height: 100vh`, `width: 100%`). The editor iframe sits in a flex layout next to a sidebar (narrower than the full window), while `/catalystdeck` and `/app/catalystdeck` render the iframe at 100vw. Same px offsets/sizes therefore land in different visual spots — the edit position/size the admin set does not match what the public sees.

**2. PDF export doesn't hold 1 slide = 1 page.**
Print CSS already pins each `.scene` to 13.333in × 7.5in with `page-break-after: always`, but:
- Inserted/resized elements are stored in px (from #1), so they overflow or get clipped by `overflow: hidden` on the print-mode scene.
- There is no explicit "Export PDF" affordance — users hit browser print manually.
- No print-time normalization for inserted images sized in px.

## Fix

### Store edits in viewport-relative units (root cause of #1 and #2)

In `public/catalystdeck-editor.js`:

- **Drag end** — before posting `style-changed`, convert `translate(px, px)` to `translate(Xvw, Yvh)` using `window.innerWidth / innerHeight` inside the iframe. Write the vw/vh string back to `el.style.transform` and send that to the parent. Result: the same visual offset regardless of viewport width.
- **Resize end (`endResize`)** — convert final `width`/`height` from px to a percentage of the parent `.scene`'s width/height (fallback to `vw`/`vh` if no scene ancestor). Write the % back with `!important` and send that as the persisted style. Aspect-locked resizes keep the ratio because both dims are converted.
- Keep live drag/resize in px for smoothness; only convert on pointerup before save.

Inserted elements already default to `%` for `left/top/width` (see `addImageElement`), so this only changes the persisted output of manual drag/resize.

### Add explicit "Export PDF" in the editor

In `src/pages/CatalystDeckEditor.tsx` toolbar, add an "Export PDF" button next to Preview that:
- Opens `/catalystdeck.html` in a new window (no `?edit=1`).
- After the overlay's `deck-overrides-applied` event fires (listen via `postMessage` or a small `?print=1` hook), calls `window.print()`.

Add a `?print=1` handler at the bottom of `public/catalystdeck-overlay.js`: after `applyAll()` resolves, if the query flag is present, wait one frame and call `window.print()`. This guarantees overrides are visible before the print dialog opens.

### Tighten print CSS in `public/catalystdeck.html`

- On `@media print`, change `.scene { overflow: hidden }` to `overflow: visible` so inserted elements sitting near the edges aren't clipped, while `page-break-after: always` + fixed `height: 7.5in` still enforces one scene per page.
- Add `img[data-inserted="1"], [data-edit-id][data-inserted="1"] { max-width: 100%; }` in print so an image stored with a % width never overflows the printed page.
- Ensure `.scene` keeps `position: relative` in print (it does) so `%`-based `left/top` on inserts anchor to the slide box, not the document.

### Data migration for existing pixel edits (optional, one-shot)

Existing rows in `deck_overrides` may already carry px `transform`/`width`/`height`. Two options — recommend (a):
  a. Leave as-is; admin can re-drag any element that looks off. Fewer moving parts.
  b. Run a one-shot script that converts stored px values to vw/vh using an assumed base viewport (1440×900). Less reliable because we don't know which viewport the admin used.

Ship (a) by default; only do (b) if the user asks.

## Files to change

- `public/catalystdeck-editor.js` — px→vw/vh on drag end, px→% on resize end.
- `public/catalystdeck-overlay.js` — `?print=1` auto-print hook after overrides apply.
- `public/catalystdeck.html` — print CSS: `overflow: visible` on `.scene`, safety cap for inserted images.
- `src/pages/CatalystDeckEditor.tsx` — "Export PDF" toolbar button opening `/catalystdeck.html?print=1`.

## Out of scope

- Rewriting the deck to a fixed 1920×1080 scaled coordinate system (larger refactor).
- Server-side PDF generation. Browser Print → Save as PDF stays the delivery path.
