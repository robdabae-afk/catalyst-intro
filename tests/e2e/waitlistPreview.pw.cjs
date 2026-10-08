// Local visual + interaction QA. All backend traffic is intercepted; no live writes.
// NODE_PATH=/tmp/pw/node_modules node tests/e2e/waitlistPreview.pw.cjs
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const port = 43000 + Math.floor(Math.random() * 6000);
(async () => {
  const vite = spawn("node", ["node_modules/vite/bin/vite.js", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { stdio: "pipe" });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      vite.stdout.on("data", data => String(data).includes("Local") && resolve());
      vite.on("exit", code => reject(new Error("Vite exited " + code)));
    });
    browser = await chromium.launch();
    fs.mkdirSync("/tmp/shots", { recursive: true });
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 844 } });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const writes = [];
      let mode = "error";
      await page.route("**/*.supabase.co/**", async route => {
        if (route.request().method() === "POST" && route.request().url().includes("waitlist_signups")) {
          writes.push(route.request().postDataJSON());
          return route.fulfill({ status: mode === "error" ? 500 : mode === "duplicate" ? 409 : 201, contentType: "application/json", body: mode === "error" ? JSON.stringify({code:"XX000", message:"fixture failure"}) : mode === "duplicate" ? JSON.stringify({code:"23505", message:"duplicate"}) : "[]" });
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      });
      const url = "http://127.0.0.1:" + port + "/preview/waitlist?ref=FRIEND42";
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(4400); // All entrance motion finishes in under five seconds.
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const geometry = await page.evaluate(() => {
        const h = document.querySelector(".wl-copy h1");
        const pill = document.querySelector(".wl-mascot svg rect:nth-of-type(2)").getBoundingClientRect();
        const topCard = document.querySelector(".wl-note-top").getBoundingClientRect();
        const bottomCard = document.querySelector(".wl-note-bottom").getBoundingClientRect();
        const svg = document.querySelector(".wl-mascot svg");
        const foot = svg.createSVGPoint();
        foot.x = 249; foot.y = 326;
        return {
          leading: parseFloat(getComputedStyle(h).lineHeight) / parseFloat(getComputedStyle(h).fontSize),
          pillClear: topCard.bottom < pill.top,
          feetClear: bottomCard.top > foot.matrixTransform(svg.getScreenCTM()).y,
        };
      });
      assert.ok(geometry.leading >= 1.1, "Headline descenders need breathing room");
      assert.ok(geometry.pillClear, "Top card must not cover the access pill");
      assert.ok(geometry.feetClear, "Bottom card must not hide either foot");
      const label = width === 1440 ? "desktop" : width === 390 ? "mobile" : "small-mobile";
      await page.screenshot({ path: "/tmp/shots/waitlist-" + label + ".png", fullPage: true });
      await page.getByRole("button", {name:"Join the waitlist"}).click();
      await page.waitForFunction(() => document.activeElement.id === "wl-heading");
      await page.getByRole("button", {name:"Join", exact:true}).click();
      assert.equal(writes.length, 0);
      await page.getByRole("textbox", {name:"Full name"}).fill("  Alex Example  ");
      await page.getByRole("textbox", {name:"Email", exact:true}).fill("alex@example.com");
      await page.getByRole("checkbox").check();
      await page.screenshot({path:"/tmp/shots/waitlist-" + label + "-form.png", fullPage:true});
      await page.getByRole("button", {name:"Join", exact:true}).click();
      await page.getByText("Something went wrong. Please try again.").waitFor();
      assert.deepEqual(writes[0], {name:"Alex Example",email:"alex@example.com",user_type:"investor"});
      mode = width === 390 ? "duplicate" : "success";
      await page.getByRole("button", {name:"Join",exact:true}).click();
      await page.waitForURL("**/signup/form?**");
      const q = new URL(page.url()).searchParams;
      assert.equal(q.get("ref"), "FRIEND42");
      assert.equal(q.get("name"), "Alex Example");
      assert.equal(q.get("role"), "investor");
      await page.goto(url, {waitUntil:"networkidle"});
      await page.getByRole("button", {name:"Join the waitlist"}).click();
      await page.getByRole("button", {name:"Back",exact:true}).click();
      await page.waitForFunction(() => document.activeElement.textContent.includes("Join the waitlist"));
      await page.emulateMedia({reducedMotion:"reduce"});
      assert.equal(await page.locator(".wl-mascot").evaluate(el => getComputedStyle(el).animationName), "none");
      assert.equal(await page.locator(".wl-confetti").evaluate(el => getComputedStyle(el).display), "none");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      console.log("PASS", width, "layout, focus, validation, backend error,", mode, "referral, reduced motion");
      await page.close();
    }
  } finally { await browser?.close(); vite.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
