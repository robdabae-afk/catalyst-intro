Scope: only slide 10 (Team) in `public/catalystdeck.html`. Leave global `.section-title` untouched so other slides aren't affected.

Changes:
1. Add a local style override on the team headline only — drop it ~2 sizes from the global `clamp(36px, 5.5vw, 72px)` to roughly `clamp(28px, 3.8vw, 52px)`, and trim its bottom margin from 40px → ~16px so the headline sits closer to the photos.
2. Tighten the team grid's top spacing: reduce `.team-grid` `margin-top` from 28px → ~12px so the photos pull up under the shorter headline, freeing vertical space at the bottom (where the scroll/print hint was overlapping Rob's bio).

No changes to photos, bios, name/role sizes, or other slides.