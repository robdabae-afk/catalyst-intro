# Preserve the founder photo while tightening profile spacing

## Goal
Keep the founder photo full-width and visually large without cutting off its top or shrinking the whole image, while reducing the black gap between the location row and the company one-liner.

## Changes
1. Increase the founder hero/photo height downward from its current fixed 330px height; leave the investor profile layout unchanged.
2. Anchor the founder image to the top center so the top of the portrait remains visible when the full-width image uses cover sizing.
3. Keep the founder name, company, and location grouped at the bottom of the extended photo area.
4. Tighten only the spacing at the boundary between the location row and one-liner; do not reduce the image dimensions to create room.
5. Check the profile at the current 394×690 phone viewport to confirm the photo top is visible, the image extends farther downward, and the location-to-pitch gap is smaller without overlap.

## Technical details
- Update only the founder hero and adjacent body spacing in `ProfileView`.
- Preserve full-width `object-cover` rendering and use top-centered object positioning rather than `object-contain`.
- Validate the live rendered profile and current build status after implementation.
