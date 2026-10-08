import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { isLightRoute } from "../src/components/CatalystLightTheme";
const LEGACY = ["#C6A02C", "#C5A059", "#94908A", "#F6F5F2", "#2A2005", "Fraunces"];
const files = ["src/pages/Dashboard.tsx", "src/pages/Matches.tsx", "src/pages/Settings.tsx", "src/pages/ProfileView.tsx", "src/pages/Home.tsx", "src/pages/Connections.tsx", "src/pages/Onboarding.tsx", "src/components/app/BottomNav.tsx", "src/components/app/MenuDrawer.tsx", "src/components/LeadCaptureDialog.tsx", "src/components/SwipeCard.tsx"];
test("legacy app surfaces carry no dark/gold palette or serif", () => {
  for (const f of files) { const s = readFileSync(f, "utf8"); for (const l of LEGACY) expect(`${f}:${s.includes(l)}:${l}`).toBe(`${f}:false:${l}`); }
});
test("light theme covers the post-login legacy routes on every viewport", () => {
  for (const p of ["/dashboard", "/matches", "/settings", "/profile/abc", "/app/home", "/app/portfolio", "/connections", "/requests"]) expect(isLightRoute(p)).toBe(true);
  for (const p of ["/", "/swipe", "/auth", "/match", "/exitfund", "/portfolio"]) expect(isLightRoute(p)).toBe(false);
});
test("theme has no viewport branching", () => {
  const s = readFileSync("src/components/CatalystLightTheme.tsx", "utf8") + readFileSync("src/styles/catalyst-light.css", "utf8");
  expect(s).not.toMatch(/useIsMobile|matchMedia|@media/);
});
test("Discover/Matches logic preserved", () => {
  const d = readFileSync("src/pages/Dashboard.tsx", "utf8"), m = readFileSync("src/pages/Matches.tsx", "utf8");
  expect(d).toContain("expressInterest(currentProfile.id)");
  expect(m).toContain("DesktopLayout");
});
