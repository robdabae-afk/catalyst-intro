import { test, expect } from "bun:test";
import { readFileSync } from "fs";
const app = readFileSync("src/App.tsx", "utf8"), auth = readFileSync("src/pages/Auth.tsx", "utf8"), fa = readFileSync("src/features/FeaturesApp.tsx", "utf8");
test("legacy post-login screens point at the new features app", () => {
  for (const [from, to] of [["/app/home", "/feed"], ["/app/portfolio", "/portfolio"]])
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
  expect(nav).toContain('navigate("/feed")'); 
   expect(nav).not.toContain('navigate("/app/home")');
});
test("new app links legacy DMs and settings instead of dropping them", () => {
  const me = readFileSync("src/features/screens/Me.tsx", "utf8"), emb = readFileSync("src/live/embed.tsx", "utf8");
  expect(me).toContain('to: "/matches"'); expect(me).toContain('to: "/settings"'); expect(emb).toContain('to="/matches"');
});
test("person swiping (swipes/matches tables) keeps its original route; new /swipe is companies", () => {
  expect(app).toContain('<Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />');
  expect(app).toContain('<Route path="/app/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />');
  expect(readFileSync("src/components/app/BottomNav.tsx", "utf8")).toContain('label: "People"');
  expect(readFileSync("src/features/screens/Me.tsx", "utf8")).toContain('to: "/dashboard"');
});
const read = (p: string) => readFileSync(p, "utf8");
test("data-source guard: person DMs and person swipe keep legacy tables, never app_messages", () => {
  const m = read("src/pages/Matches.tsx"), d = read("src/pages/Dashboard.tsx");
  expect(m).toContain('.from("matches")'); expect(m).toContain('.from("messages")'); expect(m).not.toContain("app_messages");
  expect(d).not.toContain("app_messages");
  expect(app).not.toMatch(/path="\/(app\/)?matches" element=\{<Navigate/);
  expect(app).not.toMatch(/path="\/(app\/)?dashboard" element=\{<Navigate/);
});
test("new shell nav exposes people swipe and person messages distinct from companies/inbox", () => {
  expect(fa).toContain('{ to: "/dashboard", label: "People"');
  expect(fa).toContain('{ to: "/matches", label: "Messages"');
  expect(fa).toContain('{ to: "swipe", label: "Companies"');
});
test("features palette applies only to person swipe + DMs", () => {
  const t = read("src/components/CatalystLightTheme.tsx");
  expect(t).toContain('const BOTH = ["/dashboard", "/matches"];');
  expect(app).toContain("<CatalystLightTheme />");
});
