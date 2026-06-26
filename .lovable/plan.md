Tested deck at the user's 1063×690 viewport and measured every slide. Six slides overflow:

| # | Slide | Overflow |
|---|---|---|
| 01 | Cover | +451px |
| 05 | Why Now | +102px |
| 06 | How It Works | +27px |
| 07 | Flywheel | +192px |
| 09 | Business Model | +97px |
| 10 | Team | +3px (negligible) |

All other slides fit. Strategy: per the user, only trim whitespace and shrink fonts — never delete content. Edits target each slide's class block in `public/catalystdeck.html` so other slides are unaffected.

### 01 Cover
- `.cover-title` clamp `60px / 11vw / 160px` → `48px / 9vw / 120px`
- `.cover-divider` margin `36px auto 24px` → `22px auto 16px`
- `.cover-arrow` margin-bottom `20px` → `12px`, max width `540px` → `420px`

### 05 Why Now
- `.compare-row` padding `24px 0` → `14px 0` (6 rows × 10px = 60px saved)
- `.section-title` (local override on slide 05 only via inline style) → `font-size:clamp(28px,4vw,52px);margin-bottom:20px;`
- `.section-body` slide-05 inline `font-size:15px;line-height:1.55;`

### 06 How It Works
- `.pillars` `margin-top: 60px` → `28px`, `gap: 32px` → `24px`
- `.pillar` `min-height: 360px` → `280px`, padding `40px 32px` → `28px 26px`
- `.pillar-num` `margin-bottom: 36px` → `20px`
- `.pillar-arrow` `margin-top: 32px` → `18px`

### 07 Flywheel
- `.flywheel-wrap` gap `80px` → `48px`
- `.flywheel-svg` max-width `520px` → `360px`
- `.flywheel-item` padding `24px 0` → `12px 0`
- Slide-07 headline override → `font-size:clamp(22px,2.8vw,34px);` (currently `clamp(28px,3.5vw,44px)`)
- `.flywheel-list` `margin-top:30px` → `16px` (inline override on slide 07)
- `.flywheel-text` font-size `15px` → `13.5px`

### 09 Business Model
- `.model-stack` `margin-top: 40px` → `18px`
- `.model-layer` padding `28px 0` → `16px 0`
- `.model-name` font-size `24px` → `20px`
- `.model-desc` font-size `14px` → `13px`
- Section-title bottom margin on slide 09 reduced to `20px` via inline override

### Verification
After edits, re-run the Playwright measurement script at 1063×690 and confirm `scrollH ≤ winH` (≤690) for every slide; iterate any remaining overflow.

No content removed. No other slides touched.