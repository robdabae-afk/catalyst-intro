## Slide 01 (Cover) cleanup

Edit `public/catalystdeck.html`:

1. **Remove the swoop arrow** above CATALYST (delete the `<svg class="cover-arrow">` block, lines 435–438).
2. **Move the gold divider line up** closer to CATALYST — change `.cover-divider` margin from `36px auto 24px` to `14px auto 14px`.
3. **Center / un-indent the tagline** — add `text-align: center; margin: 0 auto;` to `.cover-tagline` so "The next-gen catalyst for capital" sits dead-centered under the divider.

No other slides touched.