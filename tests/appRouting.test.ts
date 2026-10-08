import { test, expect } from "bun:test";
import { readFileSync } from "fs";
const app = readFileSync("src/App.tsx", "utf8"), auth = readFileSync("src/pages/Auth.tsx", "utf8"), fa = readFileSync("src/features/FeaturesApp.tsx", "utf8");
test("legacy post-login screens point at the new features app", () => {
  for (const [from, to] of [["/dashboard", "/swipe"], ["/app/dashboard", "/swipe"], ["/app/home", "/feed"], ["/app/portfolio", "/portfolio"]])
    expect(app).toContain(`<Route path="${from}" element={<Navigate replace to="${to}" />} />`);
});
test("sign-in lands in the new app, never the legacy dashboard", () => {
  expect(auth).not.toContain('navigate("/dashboard")');
  expect(auth).toContain('navigate("/feed")');
});
test("approval gate still wraps redirected destinations", () => {
  for (const r of ['path="swipe" element={<ProfileReviewGate>', 'path="feed" element={<ProfileReviewGate>', 'path="inbox" element={<ProfileReviewGate>', 'path="inbox/t/:id" element={<ProfileReviewGate>']) expect(fa).toContain(r);
});
test("no viewport-based routing", () => {
  expect(app).not.toMatch(/useIsMobile|matchMedia|innerWidth/);
});
test("legacy person-to-person messages stay reachable (new inbox uses app_messages, a different table)", () => {
  expect(app).toContain('<Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />');
});
test("legacy nav points at new screens where they exist", () => {
  const nav = readFileSync("src/components/app/BottomNav.tsx", "utf8");
  expect(nav).toContain('navigate("/feed")'); expect(nav).toContain('navigate("/swipe")');
  expect(nav).not.toContain('navigate("/dashboard")'); expect(nav).not.toContain('navigate("/app/home")');
});
test("new app links legacy DMs and settings instead of dropping them", () => {
  const me = readFileSync("src/features/screens/Me.tsx", "utf8"), emb = readFileSync("src/live/embed.tsx", "utf8");
  expect(me).toContain('to: "/matches"'); expect(me).toContain('to: "/settings"'); expect(emb).toContain('to="/matches"');
});
