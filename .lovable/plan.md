
## Replace top branding on /app landing with uploaded Catalyst logo

### Changes
1. **Upload the logo as a Lovable Asset** from `/mnt/user-uploads/CATALYSTnew.png` → `src/assets/catalyst-logo.png.asset.json` (CDN-hosted, no binary in repo).
2. **Edit `src/pages/app/AppLanding.tsx`**:
   - Remove the `<Zap />` icon block and the "Catalyst" text wordmark at the top of the page.
   - Replace with a single `<img>` rendering the uploaded logo, imported from the asset pointer JSON.
   - Size it to roughly ~200px wide, centered, with the logo's native black background blending seamlessly into the page's `#0A0A0A` canvas (no card, no border, no rounded surface behind it — just the bare image).
   - Keep the tagline text ("Vetted founders meet investors. Match. Chat. Close your round.") directly under the logo.
3. **Color match**: Since the uploaded PNG has a near-pure black background (#000) and the page is `#0A0A0A`, update the AppLanding page background to pure black (`#000`) just for this page so the logo's background is indistinguishable from the page. The rest of the app's theme stays untouched.
4. Drop the now-unused `Zap` import.

### Out of scope
- No changes to signup steps, auth screen, routing, or any other page.
- No changes to global tokens in `index.css` — color match is scoped to the AppLanding container only.
