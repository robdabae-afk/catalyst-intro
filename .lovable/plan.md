## Fix print/PDF output for the Catalyst deck

**Problem:** The current print CSS (`public/catalystdeck.html` lines ~322–360) inherits the web layout: every `.scene` uses `min-height: 100vh` + `padding: 8vh 6vw`, and typography uses `clamp(..vw..)` sized against the browser viewport. When the browser prints, "viewport" becomes the paper, but `page-break-inside: avoid` on oversized slides causes clipping instead of resizing, so content near the bottom/edges of taller slides (team grid, ask breakdown, market tiers, etc.) is cut off. Aspect ratio also mismatches — the deck is designed 16:9 but prints to A4 landscape (roughly 1.41:1), so horizontal padding eats the sides.

**Approach:** Add a proper print stylesheet that treats each `.scene` as a fixed 16:9 page, so what you see on-screen is what lands on the PDF page, with nothing clipped.

### Changes (single file: `public/catalystdeck.html`, inside the existing `@media print` block)

1. **Fixed page size matching the design ratio**
   - `@page { size: 13.333in 7.5in; margin: 0; }` (standard 1280×720 slide at 96dpi, 16:9)
   - Users select "Landscape" automatically because the page is wider than tall.

2. **Pin every `.scene` to that page**
   - `width: 13.333in; height: 7.5in; min-height: 0;`
   - `padding: 0.5in 0.6in;` (replace `vh/vw` padding so it doesn't collapse)
   - Keep `page-break-after: always`, drop `page-break-inside: avoid` (no longer needed once each slide fits the page exactly, and it's what causes clipping when content would otherwise overflow).
   - `overflow: hidden;` as a safety net.

3. **Print-scoped typography that doesn't depend on viewport units**
   - Override the big `clamp(..vw..)` values used by cover title, section eyebrows, pillar bodies, stats, traction numbers, team grid, ask block, market tiers, etc., with fixed `pt`/`px` sizes tuned to the 13.333in × 7.5in page.
   - Reduce oversized headers (cover title, big stat numbers) so they don't push content off the slide.
   - Tighten `line-height` on long-body slides (Problem, Solution, Model, Team bios) so paragraphs fit.

4. **Grid/flex tightening for print**
   - Slightly reduce gaps on `.pillar-grid`, `.team-grid`, `.market-tiers`, `.ask-use-grid`, `.flywheel` for print only, so the wider aspect (vs A4) doesn't matter and nothing wraps unexpectedly.

5. **Keep existing color overrides** (gold/grey palette) — already correct.

6. **Chrome-specific hint:** add `-webkit-print-color-adjust: exact` (already present) and a small note in the deck footer / README isn't needed — but we'll make sure background colors survive in Chrome/Safari/Firefox.

### Verification

- Run the dev server, open `/catalystdeck` in the preview, use Chrome's "Print → Save as PDF" with default settings (no scaling, no headers/footers).
- Open the generated PDF and check every slide: cover, problem, solution, pillars, market, model, traction, team, ask, close.
- Iterate on any slide that still overflows by tightening its print-scoped font-size or gap.

### Out of scope

- No changes to the on-screen web layout.
- No changes to the React `CatalystDeck.tsx` iframe wrapper.
- No new "Download PDF" button — this fixes the browser's native Print → PDF flow, which is what recipients actually use.
