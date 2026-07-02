Plan to fix the whitespace on profile pages:

1. **Compress the empty banner area**
   - Reduce the mobile banner height dramatically.
   - If no real banner image exists, use a compact dark header/toolbar instead of a large empty gradient block.
   - Keep Back and Share visible without creating a tall blank section.

2. **Rebuild the profile header card for mobile density**
   - Keep the avatar fully inside the shaded card border.
   - Use a tighter horizontal layout on phone: avatar on the left, name/type/details on the right.
   - Remove the large empty right-side area by preventing the header card from reserving unnecessary vertical space.

3. **Tighten spacing between sections**
   - Reduce top margin below the banner, card padding, and gaps between profile detail cards on mobile.
   - Keep desktop spacing more generous where it still looks professional.

4. **Preserve the existing visual direction**
   - Maintain the black/silver Catalyst styling and semantic design tokens.
   - Avoid white-on-white/black-on-black issues.

Technical scope:
- Update `src/pages/ProfileView.tsx` only.
- Use responsive Tailwind classes so the fix targets mobile first while preserving desktop layout.
- No backend/data changes.