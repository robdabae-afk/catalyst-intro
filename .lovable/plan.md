## Fix Page 7 (Flywheel) overflow

The right-column heading "More founders attract more investors..." on slide 07 is too large at the current viewport, pushing the eyebrow "The compounding loop" and the paragraph out of the visible scene area.

### Changes (public/catalystdeck.html, slide `#flywheel`)

1. Reduce the right-column `<h2 class="section-title">` font size from `clamp(28px, 3.5vw, 44px)` to roughly `clamp(18px, 2vw, 26px)` and tighten line-height so the paragraph fits in the column without wrapping into 6+ lines.
2. Slightly reduce the spacing above the flywheel list (`margin-top: 30px` → `20px`) so the 4-step list still fits below the paragraph.
3. Verify the section-eyebrow stays visible at the top of the right column at standard laptop heights (~690px).

No other slides or content are touched; copy stays identical.