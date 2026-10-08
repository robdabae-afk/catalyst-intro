import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signupChecklist } from "../src/lib/signup-checklist";
const profile = { name: "Jo", email: "jo@example.test", avatar_url: "photo", linkedin_url: "linkedin", user_type: "founder", is_verified: true };
describe("signup checklist", () => {
 it("requires real admin identity approval, not a badge or submission", () => {
  for (const status of ["pending", "rejected", "unverified"]) assert.equal(signupChecklist(profile, {}, status).find(i => i.id === "identity")?.done, false);
  assert.equal(signupChecklist(profile, {}, "approved").find(i => i.id === "identity")?.done, true);
 });
 it("derives founder completion from saved data and rejects placeholder names", () => {
  assert.equal(signupChecklist(profile, { startup_name: "Untitled", location: "NY" }, "pending").find(i => i.id === "startup")?.done, false);
  const items = signupChecklist(profile, { startup_name: "Co", location: "NY", one_liner: "Hello", stage: "seed", industry: ["AI"], traction: "10 customers", headcount: 0 }, "approved");
  assert.ok(items.every(i => i.done));
  assert.ok(items.find(i => i.id === "oneliner")?.to.includes("field=One-liner#section-startup"));
 });
 it("uses investor data and routes to the appropriate setting", () => {
  const items = signupChecklist({ ...profile, user_type: "investor" }, { investor_type: "Angel", accreditation_status: "Non-Accredited", sectors_of_interest: ["AI"], typical_check_size: "0-100k", investment_thesis: "AI", response_rate: 0, deals_last_12mo: 0, portfolio_companies: [{ name: "Co" }] }, "approved");
  assert.ok(items.every(i => i.done));
  assert.ok(items.find(i => i.id === "thesis")?.to.endsWith("#section-investor"));
  assert.ok(!items.some(i => i.id === "startup"));
 });
 it("does not fabricate completion for a missing profile or blank data", () => {
  assert.deepEqual(signupChecklist(null, null, "approved"), []);
  assert.equal(signupChecklist({ ...profile, name: " " }, {}, "unverified")[0].done, false);
 });
});
