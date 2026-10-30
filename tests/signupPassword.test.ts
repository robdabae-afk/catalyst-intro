import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("src/pages/app/AppSignupForm.tsx", "utf8");
describe("app signup password step", () => {
 it("requires the minimum length before continuing", () => assert.match(src, /password\.length >= MIN_PASSWORD_LENGTH/));
 it("input declares minLength and hint", () => {
  assert.match(src, /minLength=\{MIN_PASSWORD_LENGTH\}/);
  assert.match(src, /At least \$\{MIN_PASSWORD_LENGTH\} characters/);
 });
});
