# Move traction narrative into the Traction card

## Goal
Move the founder's free-form traction narrative from its current standalone slot below the one-liner into the "Traction" section card, displayed under a "Traction details" subtitle.

## Why
The narrative traction text currently floats between the one-liner and the Traction card. Grouping it inside the Traction card keeps related information together and matches the user's reference layout.

## Implementation
- File: `src/pages/ProfileView.tsx`
- Remove the standalone traction paragraph rendered between the one-liner and the Traction SectionCard.
- Inside the existing `<SectionCard label="Traction">`, add a "Traction details" subtitle and render the traction value (or a "No traction details yet" placeholder) above the MRR/Backed by/Raised/Stage stat grid.

## Visual outcome
- One-liner remains directly below the hero.
- The "Traction" card now contains:
  - Header: "TRACTION" + "Pre-revenue"/"Post-revenue" badge
  - Subtitle: "Traction details"
  - Paragraph: the free-form traction text, or placeholder
  - Grid: MRR, Backed by, Raised, Stage
