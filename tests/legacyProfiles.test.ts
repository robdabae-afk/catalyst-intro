import { describe, it } from "node:test";
import assert from "node:assert/strict";
const expect = (a: any) => ({ toBe: (b: any) => assert.equal(a, b), toEqual: (b: any) => assert.deepEqual(a, b), toMatchObject: (b: any) => { for (const k in b) assert.deepEqual(a[k], b[k]); }, not: { toContain: (b: string) => assert.ok(!a.includes(b)) } });
import { mapLegacy, isVisibleProfile } from "../src/features/legacyProfiles";
const base = { approved: true, is_hidden: false, is_flagged: false, is_test_account: false, is_test_mode: false };
describe("legacy profile mapping", () => {
  it("filters unapproved, hidden, flagged and test profiles", () => {
    expect(isVisibleProfile({ ...base, name: "A" })).toBe(true);
    for (const k of ["approved"]) expect(isVisibleProfile({ ...base, name: "A", [k]: false })).toBe(false);
    for (const k of ["is_hidden", "is_flagged", "is_test_account", "is_test_mode"]) expect(isVisibleProfile({ ...base, name: "A", [k]: true })).toBe(false);
  });
  it("maps founders to companies without inventing stats and strips unsafe urls", () => {
    const { companies, people } = mapLegacy(
      [{ ...base, id: "u1", name: "Jo Doe", user_type: "founder", avatar_url: "javascript:x", email: "x@y" }, { ...base, id: "u2", name: "Ivy", user_type: "investor" }, { ...base, approved: false, id: "u3", name: "No", user_type: "founder" }],
      [{ id: "f1", profile_id: "u1", startup_name: "Acme", one_liner: "x", industry: ["AI"], raise_amount: 500000, created_at: "2025-12-14", traction: "10 pilots", traction_tiles: ["mrr"], fundraising_status: "actively_raising" }, { id: "f3", profile_id: "u3", startup_name: "Hidden" }, { id: "f2", profile_id: "u2", startup_name: "InvestorCo" }, { id: "f4", profile_id: "u1", startup_name: "Untitled" }, { id: "f5", profile_id: "u1", startup_name: "Acme Later", created_at: "2026-02-01", fundraising_status: "actively_raising" }],
      [{ profile_id: "u2", firm_name: "Fund", position: "Partner" }]);
    expect(companies.map(c => c.id)).toEqual(["legacy-f1"]);
    expect(companies[0]).toMatchObject({ goal: 500000, sector: "AI", founderPhoto: "", traction: ["10 pilots"], raising: true });
    expect(people.map(p => [p.name, p.role, p.at])).toEqual([["Jo Doe", "Founder", "legacy-f1"], ["Ivy", "Investor", undefined]]);
    expect(people[1].bio).toBe("Partner at Fund");
    expect(JSON.stringify(people)).not.toContain("x@y");
  });
  it("mirrors live shape: investor-owned Untitled excluded, real status compared exactly", () => {
    const { companies } = mapLegacy(
      [{ ...base, id: "f", name: "F", user_type: "founder" }, { ...base, id: "i", name: "I", user_type: "investor" }],
      [{ id: "a", profile_id: "f", startup_name: "NextStep", fundraising_status: "actively_raising", traction_tiles: [] },
       { id: "b", profile_id: "i", startup_name: "Untitled", fundraising_status: "actively_raising", traction_tiles: [] },
       { id: "c", profile_id: "f", startup_name: "Dupe", created_at: "2099-01-01", fundraising_status: "raising" }], []);
    expect(companies.map(c => [c.name, c.raising])).toEqual([["NextStep", true]]);
    expect(mapLegacy([{ ...base, id: "f", name: "F", user_type: "founder" }], [{ id: "x", profile_id: "f", startup_name: "S", fundraising_status: "raising" }], []).companies[0].raising).toBe(false);
  });
});
