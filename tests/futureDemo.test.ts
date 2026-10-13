import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { startups } from "../src/demo/future/data";
test("demo is selected before production routing", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  expect(app).toContain("isDemoMode() ? <Suspense");
  expect(app).toContain('import("./demo/future/FutureDemo")');
});
test("future demo is isolated from payments, auth and backend writes", () => {
  const code = readFileSync("src/demo/future/FutureDemo.tsx", "utf8");
  for (const text of [
    "supabase",
    "fetch(",
    "stripe",
    "AuthGuard",
    "localStorage",
  ])
    expect(code).not.toContain(text);
  expect(code).toContain('basename="/demo"');
  expect(code).toContain("not an offer to sell securities.");
});
test("offerings include required disclosure categories", () => {
  expect(startups.length).toBe(3);
  for (const s of startups) {
    expect(s.cap).toBeGreaterThan(0);
    expect(s.raised).toBeLessThan(s.goal);
    expect(s.team).toBeTruthy();
  }
  for (const s of startups) {
    expect(s.target).toBeLessThan(s.goal);
    expect(s.deadline).toBeTruthy();
    expect(s.financials.length).toBeGreaterThan(7);
    expect(s.risk).toBeTruthy();
    expect(s.use).toBeTruthy();
  }
});
test("minimal navigation has no community, chat or learning routes", () => {
  const code = readFileSync("src/demo/future/FutureDemo.tsx", "utf8");
  for (const path of [
    'path="/people"',
    'path="/learn"',
    "MessageCircle",
    "function People",
    "function Learn",
  ])
    expect(code).not.toContain(path);
  for (const disclosure of [
    "Company & business",
    "Team, officers & ownership",
    "Offering terms & deadline",
    "Use of proceeds",
    "Financials & financial condition",
    "Risks",
    "Capital structure & prior financing",
    "Most asked by investors",
  ])
    expect(code).toContain(disclosure);
});
