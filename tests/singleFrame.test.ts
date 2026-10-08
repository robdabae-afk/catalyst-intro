import { test, expect } from "bun:test";
import { readFileSync } from "fs";
const read = (p: string) => readFileSync(p, "utf8");
const app = read("src/App.tsx"), fa = read("src/features/FeaturesApp.tsx");
const MEMBER = ["updates","connections","coffeechat","safes","safe","safe/:id","captable","founder-analytics","market-pulse","investments","requests","settings","filters","referrals","portal","concierge","profile/:id"];

test("member pages render inside the single app frame, not as top-level legacy routes", () => {
  for (const r of MEMBER) {
    expect(app).not.toMatch(new RegExp('<Route path="/' + r.replace(/[/:]/g, (c) => "\\" + c) + '" element'));
    expect(fa).toContain('<Route path="' + r + '" element={');
    expect(app).toContain('<Route path="/app/' + r + '" element={<RootRedirect from="/app" />} />');
  }
});
test("auth gates kept exactly per route", () => {
  for (const r of MEMBER.filter((r) => !["settings", "profile/:id"].includes(r))) expect(fa).toMatch(new RegExp('<Route path="' + r.replace("/", "\\/") + '" element=\\{<AuthGuard><'));
  expect(fa).toContain('<Route path="settings" element={<AuthGuard allowNonAdmin><Settings /></AuthGuard>} />');
  expect(fa).toContain('<Route path="profile/:id" element={<ProfileReviewGate><ProfileView /></ProfileReviewGate>} />');
  expect(app).toContain("{adminRoutes}");
});
test("frame flags nested pages so legacy navs hide (no double nav)", () => {
  expect(fa).toContain("<AppFrameContext.Provider value={true}>");
  for (const p of ["src/components/app/BottomNav.tsx","src/components/AppNavigation.tsx","src/components/BottomNavigation.tsx"]) expect(read(p)).toContain("useInAppFrame() ? null");
  for (const p of ["src/pages/Dashboard.tsx","src/pages/Matches.tsx"]) { const s = read(p); expect(s).toContain("const embedded = useInAppFrame() || embeddedProp;"); expect(s).toContain("{!embedded && <MenuDrawer"); }
  expect(read("src/pages/Matches.tsx")).toContain("if (!isMobile && !embedded)");
});
test("auth pages stay outside the frame", () => {
  for (const r of ["/auth", "/signup", "/forgot-password", "/onboarding"]) expect(app).toContain('<Route path="' + r + '" element');
});
