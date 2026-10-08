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
for (const [file, keys] of [
  ["src/pages/ForgotPassword.tsx", ["resetPasswordForEmail(", "/auth?recovery=true", 'htmlFor="reset-email"']],
  ["src/pages/Waitlist.tsx", ['navigate("/app/signup")', 'navigate("/auth")']],
] as const) {
  test(`${file} uses the features auth design and keeps its logic`, () => {
    const s = readFileSync(file, "utf8");
    for (const legacy of ["bg-black", "bg-background", "text-[#", "<Card", "backdrop-blur"]) expect(s).not.toContain(legacy);
    expect(s).toContain("cf cf-ob");
    expect(s).toContain('import "@/features/auth.css"');
    for (const k of keys) expect(s).toContain(k);
  });
}
test("OAuth buttons keep the pre-restyle handlers, providers and redirect", () => {
  const handler = (name: string, provider: string) => {
    const body = src.slice(src.indexOf(`const ${name} = async`), src.indexOf("};", src.indexOf(`const ${name} = async`)));
    expect(body).toContain(`lovable.auth.signInWithOAuth("${provider}", {`);
    expect(body).toContain("redirect_uri: `${window.location.origin}/onboarding`");
    expect(body).toContain("if (result.error) throw result.error;");
  };
  handler("handleGoogleLogin", "google");
  handler("handleAppleLogin", "apple");
  const g = src.match(/<button[^>]*onClick=\{(\w+)\}[^>]*>[\s\S]*?<\/button>/g)!.filter((b) => /google/i.test(b) || /apple/i.test(b));
  expect(g.find((b) => /Google/.test(b))).toContain("onClick={handleGoogleLogin}");
  expect(g.find((b) => /Apple/.test(b))).toContain("onClick={handleAppleLogin}");
  expect(src).toContain('import { lovable } from "@/integrations/lovable/index"');
});
