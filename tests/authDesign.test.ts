import { test, expect } from "bun:test";
import { readFileSync } from "fs";
const src = readFileSync("src/pages/Auth.tsx", "utf8");
test("/auth uses the features app design, not the legacy dark/gold theme", () => {
  for (const legacy of ["#C6A02C", "#0A0A0D", "#111111", "Fraunces", "backdropFilter"]) expect(src).not.toContain(legacy);
  expect(src).toContain("cf cf-ob");
  expect(src).toContain('import "@/features/features.css"');
});
test("auth logic entry points are preserved", () => {
  for (const k of ["initialAuthMode(window.location.search)", "signInWithPassword", "signUp(", "exchangeCodeForSession", "PASSWORD_RECOVERY", 'signInWithOAuth("google"', 'signInWithOAuth("apple"', "/forgot-password"]) expect(src).toContain(k);
});
