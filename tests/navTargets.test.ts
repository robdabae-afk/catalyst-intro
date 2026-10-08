import { test, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : []; });
const app = readFileSync("src/App.tsx", "utf8"), fa = readFileSync("src/features/FeaturesApp.tsx", "utf8");
test("no in-app control targets legacy /dashboard, /matches, /app/home, /home, /discover", () => {
  const bad: string[] = [];
  for (const p of walk("src")) {
    if (p === "src/App.tsx" || /\/(admin|match|exitfund|redesign)\//.test(p)) continue;
    const s = readFileSync(p, "utf8");
    const m = s.match(/(navigate\(|go\(|to=|to: |href=|path: )["'](\/app\/dashboard|\/app\/matches|\/app\/home|\/dashboard|\/matches|\/home|\/discover)["']/g);
    if (m) bad.push(p + " " + m.join(","));
  }
  expect(bad).toEqual([]);
});
test("Today tab is /feed; /home and dashboard/matches aliases redirect into the frame", () => {
  expect(fa).toContain('{ to: "feed", label: "Today"');
  expect(app).toContain('<Route path="/home" element={<Navigate replace to="/feed" />} />');
  expect(app).toContain('<Route path="/" element={<Landing />} />');
  expect(fa).toContain('<Route path="dashboard" element={<Navigate replace to="/people/swipe" />} />');
  expect(fa).toContain('<Route path="matches" element={<LegacyAlias to="/messages" />} />');
});
test("/app aliases keep search+hash (SAFE prefill)", () => {
  expect(app).toMatch(/function RootRedirect[\s\S]*loc\.search \+ loc\.hash/);
  expect(app).toContain('<Route path="/app/safe" element={<RootRedirect from="/app" />} />');
  expect(readFileSync("src/pages/Requests.tsx", "utf8")).toContain("/safe?investor_name=");
});
test("Concierge back falls back to /feed", () => {
  expect(readFileSync("src/pages/Concierge.tsx", "utf8")).toContain("navigate('/feed')");
});
