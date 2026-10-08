import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const preview = readFileSync("src/features/preview/WaitlistPreview.tsx", "utf8");
const css = readFileSync("src/features/preview/waitlist-preview.css", "utf8");

test("production waitlist form is byte-identical apart from its new export", () => {
  const landing = readFileSync("src/redesign/Landing.tsx", "utf8").replace("export function HeroSignup()", "function HeroSignup()");
  expect(createHash("sha256").update(landing).digest("hex")).toBe("f1d831c87bdeb3b82dec9d122344df9773b5289195c54cce748fecfc9acbce2a");
});

test("preview reuses real persistence rather than inventing a signup or access grant", () => {
  expect(preview).toContain("<HeroSignup />");
  expect(preview).not.toContain("supabase");
  expect(preview).not.toContain("localStorage");
  expect(preview).toContain("does not grant member access");
});

test("preview route is lazy and existing waitlist routes remain unchanged", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  expect(app).toContain('lazy(() => import("./features/preview/WaitlistPreview"))');
  expect(app).toContain('path="/preview/waitlist"');
  expect(app).toContain('path="/waitlist" element={<Waitlist />}');
  expect(app).toContain('path="/app/waitlist" element={<Waitlist />}');
});

test("motion is finite, reduced-motion disables it, and the form manages focus", () => {
  expect(css).not.toContain("infinite");
  expect(css).toContain("@media(prefers-reduced-motion:reduce)");
  expect(css).toContain("animation:none!important");
  expect(css).toContain(".wl-confetti{display:none}");
  expect(preview).toContain("heading.current?.focus()");
  expect(preview).toContain("cta.current?.focus()");
});
