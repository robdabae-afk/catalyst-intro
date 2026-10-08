import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { initialAuthMode } from "../src/lib/auth-mode";
const files = (d: string): string[] => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : []; });
describe("/auth default mode", () => {
 it("opens sign-in unless signup is explicit", () => {
  for (const s of ["", "?from=app", "?redirect=/onboarding", "?mode=signin", "?recovery=true"]) assert.equal(initialAuthMode(s), "signin");
  assert.equal(initialAuthMode("?mode=signup"), "signup");
 });
 it("Auth page uses the helper", () => assert.match(readFileSync("src/pages/Auth.tsx", "utf8"), /initialAuthMode\(window\.location\.search\)/));
 it("signup CTAs never route to bare /auth", () => {
  const bad: string[] = [];
  for (const f of files("src")) readFileSync(f, "utf8").split("\n").forEach((l, i) => {
   if (/["'`]\/(app\/)?auth(\?(?!mode=signup)[^"'`]*)?["'`]/.test(l) && /(Create (your )?account|Join|Sign up|Get started)/i.test(l)) bad.push(f + ":" + (i + 1));
  });
  assert.deepEqual(bad, []);
 });
});
