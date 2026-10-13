import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { startups, lessons } from "../src/demo/future/data";
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
test("offerings include minimum, terms, risks and learning", () => {
  expect(startups.length).toBe(3);
  for (const s of startups) {
    expect(s.cap).toBeGreaterThan(0);
    expect(s.raised).toBeLessThan(s.goal);
    expect(s.team).toBeTruthy();
  }
  expect(lessons.map((l) => l.term)).toEqual([
    "SAFE",
    "Valuation cap",
    "Dilution",
    "Reg CF",
  ]);
});
