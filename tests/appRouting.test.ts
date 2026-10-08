import { test, expect } from "bun:test";
import { readFileSync } from "fs";
const app = readFileSync("src/App.tsx", "utf8"), auth = readFileSync("src/pages/Auth.tsx", "utf8"), fa = readFileSync("src/features/FeaturesApp.tsx", "utf8");
test("legacy post-login screens point at the new features app", () => {
  for (const [from, to] of [["/dashboard", "/swipe"], ["/app/dashboard", "/swipe"], ["/app/home", "/feed"], ["/matches", "/inbox"], ["/app/matches", "/inbox"], ["/app/portfolio", "/portfolio"]])
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
