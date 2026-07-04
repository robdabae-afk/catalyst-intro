## Problem

Edits made in the editor (image positions/sizes, text positions) don't match the public deck at `/catalyst` and `/app/catalystdeck`. Photos scatter and stack; text moves.

**Root cause:** the deck has no fixed slide coordinate system. Scenes size to the viewport (`100%` width, `100vh` min-height, typography in `vw`/`vh`), so identical stored coordinates render at different pixel positions in the editor iframe (~600×650, near-square) vs the public iframe (~1063×690, wide). Absolutely-positioned images and text overrides therefore land in different spots.

## Fix

Introduce a fixed **1920×1080 slide canvas** that scales uniformly to fit any viewport. All stored positions become percentages of this canvas, so editor and public views are pixel-identical (letterboxed if aspect differs).

### 1. `public/catalystdeck.html`
- Wrap each `.scene` in a `.scene-frame` (fills viewport, centers content, `overflow: hidden`).
- `.scene` becomes fixed `1920px × 1080px`, `position: relative`, `transform-origin: top left`.
- A small script sets `transform: scale(min(vw/1920, vh/1080))` per scene on load + `ResizeObserver`.
- Convert existing `vw`/`vh` typography and spacing inside scenes to `px` (relative to 1920×1080).
- Print CSS: `@page { size: 1920px 1080px; margin: 0 }`, disable the scale transform when printing so 1 scene = 1 PDF page at full resolution.

### 2. `public/catalystdeck-editor.js`
- Drag/resize math converts pointer px → **% of the 1920×1080 canvas** (divide by canvas rect, which already accounts for the current scale).
- Persist positions/sizes as `%` against the canvas, not the viewport.
- Handles render inside the scaled canvas so they track the element under any scale.

### 3. `public/catalystdeck-overlay.js`
- On load, normalize any legacy overrides stored in `vw`/`vh` or viewport-% into canvas-% (one-time conversion using the stored viewport dimensions if present, else best-effort mapping).
- Apply overrides against the fixed canvas.

### 4. `src/pages/CatalystDeckEditor.tsx`
- No logic change; ensure the iframe simply hosts `catalystdeck.html` — scaling is handled inside the deck.

## Out of scope
- No DB schema changes. Existing `deck_overrides` rows are migrated in-memory at load.
- No redesign of slide content; only the coordinate system changes.

## Trade-off
Very tall/narrow or very wide/short viewports will show letterbox bars — standard slide-deck behavior — in exchange for exact 1:1 fidelity between editor, public page, and exported PDF.
