## Diagnosis

I reproduced the mismatch by capturing both the web-rendered deck and a generated PDF render. The issue is real: the PDF is not preserving the same layout tree as the web view.

Observed example:
- Web slide 6: three pillar cards stay in one horizontal row.
- PDF slide 6: the same cards reflow into a vertical mobile-style stack.
- Web slide 10: the ask breakdown stays in three columns.
- PDF slide 10: the breakdown stacks vertically and text positions shift.

Root cause:
- The current export relies on `window.print()` and `@media print` CSS.
- During print/PDF rendering, the browser evaluates responsive media queries and print sizing differently than the live web viewport.
- That lets mobile/tablet rules and print font/layout calculations override the deck’s intended 1920×1080 web layout.
- Charts are affected for the same reason: print rendering recalculates layout, SVG/container sizing, fonts, and page flow instead of preserving the already-rendered web pixels.

## Five possible plans considered

### Plan 1 — Patch print CSS only
Force every print breakpoint back to desktop layout and tighten `@page`, `.scene`, and grid rules.

Success estimate: 70–85%.

Why not choose it: it may fix today’s specific slides, but future edits, uploaded images, charts, and browser print quirks can still drift.

### Plan 2 — Use section-by-section PDF capture
Mark each slide section, capture sections separately, and assemble pages.

Success estimate: 80–90%.

Why not choose it: sections can still be scaled/repositioned differently, and charts/text can land slightly differently than the full web slide.

### Plan 3 — Generate a second simplified PDF-only deck layout
Create a separate PDF template that manually matches the deck.

Success estimate: 85–92%.

Why not choose it: two layouts will drift over time; every deck edit would need to be reflected in both web and PDF templates.

### Plan 4 — Server/headless-browser PDF service
Use a backend/headless browser to render the deck and export PDFs.

Success estimate: 95–99%.

Why not choose it here: this app is currently client-side, and adding a full browser rendering service is heavier than needed.

### Plan 5 — Chosen: rasterize each exact web slide into one full-page PDF image
Render each slide at the canonical 1920×1080 canvas, wait for fonts/images/charts/overrides, capture each complete slide as a high-resolution image, then place exactly one image on exactly one PDF page.

Success estimate: above 99.9% for placement fidelity.

Why this wins:
- PDF no longer reflows text.
- PDF no longer recalculates charts.
- PDF no longer applies mobile breakpoints.
- Each web slide becomes one sealed page image.
- If it looks correct on the web canvas, the PDF page uses that same visual snapshot.

## Implementation plan

1. Add a dedicated export mode to `public/catalystdeck.html`.
   - Use a query param like `?export=1` or `?print=1`.
   - Force the deck into native 1920×1080 slide rendering.
   - Disable scroll snap, nav UI, animations, hover transforms, and editor chrome.
   - Force all `.reveal` elements visible and all counters to final values before capture.

2. Replace the current `window.print()` export behavior.
   - The editor’s “Export PDF” button should open/run the deterministic export path instead of relying on browser print CSS.
   - Keep normal web browsing unchanged.

3. Add a client-side PDF export script.
   - Wait for `document.fonts.ready`.
   - Wait for all images to load or fail safely.
   - Wait for deck overrides from the backend to finish applying.
   - Capture each `.scene` as a 1920×1080 image.
   - Create a landscape PDF with one 16:9 page per captured slide.
   - Place each slide image full-bleed on its page.

4. Add export-specific CSS guards.
   - Override all responsive breakpoints during export so the capture source is always desktop 1920×1080.
   - Ensure inserted photos use fixed canvas-relative positioning.
   - Ensure SVG/charts render in their final web dimensions before capture.

5. Keep native print CSS only as a fallback.
   - It can remain for manual browser printing, but the app’s official export should use the rasterized slide-to-PDF path.

6. Verify with visual QA.
   - Generate fresh web screenshots for representative slides: cover, traction, how-it-works, market/model, team, ask, and any chart slide.
   - Generate the exported PDF.
   - Convert PDF pages to images.
   - Compare web screenshot vs PDF page image side by side.
   - Fix any mismatch until the only differences are minor anti-aliasing/compression differences.

## Final target behavior

- One `.scene` = one PDF page.
- No element can be split across pages.
- Text cannot reflow in the PDF.
- Charts cannot resize differently in the PDF.
- Uploaded images keep the same location and size.
- The exported PDF visually matches the web slide canvas.