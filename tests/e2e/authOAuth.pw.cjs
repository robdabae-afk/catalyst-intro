// Click-level check that /auth Google/Apple buttons call lovable.auth.signInWithOAuth
// with the same provider + redirect_uri as before the restyle. The lovable module is
// stubbed in the browser only for this test; no real OAuth is started.
// Run: NODE_PATH=<dir with playwright> node tests/e2e/authOAuth.pw.cjs  (from repo root)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const assert = require("assert");
const port = 41000 + Math.floor(Math.random() * 8000);
const STUB = `export const lovable={auth:{signInWithOAuth:async(provider,opts)=>{(window.__oauth||(window.__oauth=[])).push({provider,opts});return {redirected:true};}}};`;
(async () => {
  const vite = spawn("npx", ["vite", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: process.cwd(), stdio: "pipe" });
  await new Promise((r) => vite.stdout.on("data", (d) => String(d).includes("Local") && r()));
  const browser = await chromium.launch();
  let failed = 0;
  try {
    for (const [mode, url] of [["signin", "/auth"], ["signup", "/auth?mode=signup"]]) {
      for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        const page = await browser.newPage({ viewport: vp });
        await page.route("**/*.supabase.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "[]" }));
        await page.route(/\/src\/integrations\/lovable\/index\.ts/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: STUB }));
        await page.goto(`http://127.0.0.1:${port}${url}`, { waitUntil: "networkidle" });
        await page.getByRole("button", { name: /google/i }).click();
        await page.waitForFunction(() => (window.__oauth || []).length === 1);
        await page.getByRole("button", { name: /apple/i }).click();
        await page.waitForFunction(() => (window.__oauth || []).length === 2);
        const calls = await page.evaluate(() => window.__oauth);
        const origin = `http://127.0.0.1:${port}`;
        try {
          assert.deepStrictEqual(calls, [
            { provider: "google", opts: { redirect_uri: origin + "/onboarding" } },
            { provider: "apple", opts: { redirect_uri: origin + "/onboarding" } },
          ]);
          console.log("PASS", mode, vp.width, JSON.stringify(calls));
        } catch (e) { failed++; console.log("FAIL", mode, vp.width, JSON.stringify(calls)); }
        await page.close();
      }
    }
  } finally { await browser.close(); vite.kill(); }
  process.exit(failed ? 1 : 0);
})();
