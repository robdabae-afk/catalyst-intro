import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { isLightRoute } from "../src/components/CatalystLightTheme";

const LEGACY = ["#C6A02C", "#C5A059", "#94908A", "#F6F5F2", "#2A2005", "#E7CB7E", "Fraunces", "#060606", "#0A0A0C"];
const files = ["src/pages/Settings.tsx", "src/pages/ProfileView.tsx", "src/pages/Connections.tsx", "src/pages/FounderAnalytics.tsx", "src/pages/InvestorMarketPulse.tsx", "src/pages/LatestUpdates.tsx",
  "src/components/app/RequestIntroBanner.tsx", "src/components/app/StartupUpdateCard.tsx", "src/components/verification/IdentityVerificationCapture.tsx"];
const read = (f: string) => readFileSync(f, "utf8");

test("restyled legacy surfaces carry no dark/gold palette or serif", () => {
  for (const f of files) { const s = read(f); for (const l of LEGACY) expect(`${f}:${s.includes(l)}:${l}`).toBe(`${f}:false:${l}`); }
});

test("light theme covers settings, profiles, connections, requests, concierge and finance routes", () => {
  for (const p of ["/dashboard", "/matches", "/settings", "/app/settings", "/profile/abc", "/app/profile/abc", "/connections", "/requests", "/concierge",
    "/safes", "/safe", "/safe/1", "/captable", "/investments", "/founder-analytics", "/market-pulse", "/portal", "/referrals", "/filters", "/updates", "/coffeechat", "/people/swipe", "/messages"]) expect(`${p}:${isLightRoute(p)}`).toBe(`${p}:true`);
  for (const p of ["/", "/swipe", "/feed", "/auth", "/match", "/match/inbox", "/exitfund", "/portfolio", "/people", "/inbox", "/home", "/admin", "/safety", "/profiles"]) expect(`${p}:${isLightRoute(p)}`).toBe(`${p}:false`);
});

test("theme keeps semantic error/success colours and has no viewport branching", () => {
  const css = read("src/styles/catalyst-light.css");
  expect(css).not.toMatch(/red-|green-|emerald-|destructive/);
  expect(css + read("src/components/CatalystLightTheme.tsx")).not.toMatch(/useIsMobile|matchMedia|@media/);
});

test("settings/profile logic anchors preserved", () => {
  const s = read("src/pages/Settings.tsx"), p = read("src/pages/ProfileView.tsx");
  for (const k of ["SignupChecklist", "signOut", "TokenPurchaseDialog", "IdentityVerificationCapture", "useSubscription", "AdminRevenueAdjustment"]) expect(s).toContain(k);
  expect(p).toContain("Helmet");
});

test("mobile nav: 4 primary tabs + More fits the 5-col bar, every destination reachable", () => {
  const app = read("src/features/FeaturesApp.tsx"), css = read("src/features/features.css");
  const m = app.match(/MOBILE_PRIMARY = \[([^\]]+)\]/)!;
  const primary = m[1].split(",").map((x) => x.trim().replace(/"/g, ""));
  expect(primary.length + 1).toBe(Number(css.match(/\.cf-tabs\{[^}]*repeat\((\d+),/)![1]));
  for (const l of ["Today", "Companies", "People", "Inbox", "Search", "Me", "Messages", "Directory", "Watchlist", "Portfolio", "Events", "Settings", "Learn"]) expect(app).toContain(`label: "${l}"`);
  expect(app).toContain("aria-expanded={open}");
  expect(css).toMatch(/\.cf-tabs \.cf-tab\{[^}]*min-height:48px/);
  expect(css).toMatch(/\.cf-sheet-i\{[^}]*min-height:48px/);
});
