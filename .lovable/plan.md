Current timing identified in `src/pages/app/AppLanding.tsx`:

- Logo intro travel: `1.4s`
- Logo opacity/blur resolves by `25%` of that = about `0.35s`
- Logo holds center until `55%` = about `0.77s`, then moves to header by `1.4s`
- Content starts appearing at `1.15s`, while the logo is still moving
- Idle float starts at `1.6s`

Plan:

1. Extend the main logo intro from `1.4s` to `3.2s` so it is clearly visible.
2. Adjust keyframe pacing so the logo:
   - appears and de-blurs more deliberately,
   - holds at center long enough to notice,
   - then travels to the header slot.
3. Push content reveal delays later so tagline, trust card, and buttons do not compete with the logo animation.
4. Start the idle float only after the longer intro completes.
5. Keep reduced-motion behavior unchanged.

Proposed new timing:

- Logo intro: `3.2s`
- Center reveal/de-blur: first `0.6s`
- Center hold: until about `1.8s`
- Travel to header: `1.8s–3.2s`
- Content reveal: begins around `2.7s–3.1s`
- Float: starts at `3.35s`