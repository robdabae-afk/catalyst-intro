## Fix Profile Card Layout in ProfileView

**Problem:** The profile photo circle (Avatar) sits too far above the card boundary due to aggressive negative margin (`-mt-16` / `-mt-20`), making it look detached from the black card. On mobile the name is also oversized.

**Changes in `src/pages/ProfileView.tsx`:**

1. **Re-anchor the avatar inside the card**  
   - Reduce the negative top margin on the avatar flex row (currently `-mt-16` mobile / `-mt-12` desktop) to a smaller value so the circle overlaps the banner only slightly and stays visually connected to the card body.  
   - Shrink the `Avatar` from `w-32 h-32` down to `w-28 h-28` so it fits comfortably within the available header space.

2. **Shrink the name**  
   - Change the `<h1>` from `text-3xl` to `text-2xl` (2-point reduction).

3. **Fine-tune spacing**  
   - Adjust surrounding padding/margins (`pt-4`, container `-mt-20`) just enough to keep the header compact without clipping the avatar or pushing content down.

**Verification:** Check the investor profile (Vanessa Kirby) at `/profile/:id` on mobile viewport to confirm the avatar sits cleanly on the card, the name is smaller, and nothing overflows.