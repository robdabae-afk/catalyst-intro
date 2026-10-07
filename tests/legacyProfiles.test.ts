import { describe, it } from "node:test";
import assert from "node:assert/strict";
const expect = (a: any) => ({ toBe: (b: any) => assert.equal(a, b), toEqual: (b: any) => assert.deepEqual(a, b), toMatchObject: (b: any) => { for (const k in b) assert.deepEqual(a[k], b[k]); }, not: { toContain: (b: string) => assert.ok(!a.includes(b)) } });
import { mapLegacy, isVisibleProfile, publicDeckUrl, FOUNDER_COLS, PROFILE_COLS } from "../src/features/legacyProfiles";
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
    expect(companies[0]).toMatchObject({ goal: 500000, sector: "AI", founderPhoto: "", traction: ["10 pilots"], raising: false });
    expect(people.map(p => [p.name, p.role, p.at])).toEqual([["Jo Doe", "Founder", "legacy-f1"], ["Ivy", "Investor", undefined]]);
    expect(people[1].bio).toBe("Partner at Fund");
    expect(JSON.stringify(people)).not.toContain("x@y");
  });
  it("keeps privacy filters and owner links stable across refresh ordering", () => {
    const profiles = [
      { ...base, id: "visible", name: "Visible", user_type: "founder" },
      { ...base, id: "hidden", name: "Hidden", user_type: "founder", is_hidden: true },
      { ...base, id: "test", name: "Test", user_type: "founder", is_test_account: true },
    ];
    const founders = [
      { id: "later", profile_id: "visible", startup_name: "Later", created_at: "2026-02-01" },
      { id: "oldest", profile_id: "visible", startup_name: "Real", created_at: "2025-01-01" },
      { id: "hidden-company", profile_id: "hidden", startup_name: "Hidden company" },
      { id: "test-company", profile_id: "test", startup_name: "Test company" },
    ];
    const mapped = mapLegacy(profiles, founders, []);
    assert.deepEqual(mapped, mapLegacy(profiles, [...founders].reverse(), []));
    assert.deepEqual(mapped.companies.map(c => c.id), ["legacy-oldest"]);
    assert.deepEqual(mapped.people.map(p => [p.id, p.at]), [["visible", "legacy-oldest"]]);
    assert.ok(mapped.companies.every(c => c.raising === false));
  });
  it("mirrors live shape: investor-owned Untitled excluded, real status compared exactly", () => {
    const { companies } = mapLegacy(
      [{ ...base, id: "f", name: "F", user_type: "founder" }, { ...base, id: "i", name: "I", user_type: "investor" }],
      [{ id: "a", profile_id: "f", startup_name: "NextStep", fundraising_status: "actively_raising", traction_tiles: [] },
       { id: "b", profile_id: "i", startup_name: "Untitled", fundraising_status: "actively_raising", traction_tiles: [] },
       { id: "c", profile_id: "f", startup_name: "Dupe", created_at: "2099-01-01", fundraising_status: "raising" }], []);
    expect(companies.map(c => [c.name, c.raising])).toEqual([["NextStep", false]]);
    expect(mapLegacy([{ ...base, id: "f", name: "F", user_type: "founder" }], [{ id: "x", profile_id: "f", startup_name: "S", fundraising_status: "raising" }], []).companies[0].raising).toBe(false);
  });
});

describe("legacy public company detail", () => {
  it("maps real display fields without reinterpreting the company one-liner", () => {
    const { companies } = mapLegacy([{ ...base, id: "u", name: "Founder", user_type: "founder" }], [{
      id: "f", profile_id: "u", startup_name: "Real", one_liner: "Original founder description",
      team_members: [{ name: "Ada", title: "CTO", email: "private@example.com", phone: "private-phone" }, { name: "ada", title: "Duplicate" }, { title: "No name" }],
      banner_url: "https://images.example.com/banner.jpg", logo_url: "https://images.example.com/logo.png",
      pitch_deck_url: "https://drive.google.com/file/d/public/view?usp=sharing", pitch_deck_visibility: "public",
      ein_number: "private-ein", financial_statement_urls: ["https://private.example.com/financials"], incorporation_doc_url: "https://private.example.com/incorporation"
    }], []);
    assert.deepEqual(companies[0].teamMembers, [{ name: "Ada", title: "CTO" }]);
    assert.equal(companies[0].problem, ""); assert.equal(companies[0].solution, "");
    assert.equal(companies[0].line, "Original founder description");
    assert.equal(companies[0].cover, "https://images.example.com/banner.jpg");
    assert.equal(companies[0].logo, "https://images.example.com/logo.png");
    assert.deepEqual(companies[0].docs, [{ name: "Pitch deck", kind: "deck", ready: true, url: "https://drive.google.com/file/d/public/view?usp=sharing" }]);
    for (const secret of ["private@example.com", "private-phone", "private-ein", "financials", "incorporation"]) assert.ok(!JSON.stringify(companies).includes(secret));
  });
  it("never publishes private, signed, executable or credential-bearing deck links", () => {
    const rejected = ["javascript:alert(1)", "data:text/html,x", "http://example.com/deck", "https://user:pass@example.com/deck",
      "https://x.supabase.co/storage/v1/object/sign/decks/a.pdf?token=x", "https://x.supabase.co/storage/v1/object/authenticated/decks/a.pdf",
      "https://example.com/deck?X-Amz-Signature=secret", "https://example.com/deck?access_token=secret", "https://example.com/deck?sig=secret"];
    for (const url of rejected) assert.equal(publicDeckUrl(url, "public"), "", url);
    for (const visibility of ["private", "PUBLIC", null, undefined]) assert.equal(publicDeckUrl("https://example.com/deck", visibility), "");
    assert.equal(publicDeckUrl("https://x.supabase.co/storage/v1/object/public/decks/a.pdf", "public"), "https://x.supabase.co/storage/v1/object/public/decks/a.pdf");
    for (const visibility of ["private", undefined]) {
      const m = mapLegacy([{ ...base, id: "u", name: "Founder", user_type: "founder" }], [{ id: "f", profile_id: "u", startup_name: "Real", pitch_deck_url: "https://example.com/deck", pitch_deck_visibility: visibility }], []);
      assert.deepEqual(m.companies[0].docs, []);
    }
  });
  it("selects only explicitly safe legacy fields", () => {
    assert.ok(FOUNDER_COLS.includes("pitch_deck_visibility"));
    for (const field of ["ein_number", "financial_statement_urls", "incorporation_doc_url", "company_address", "status_note"]) assert.ok(!FOUNDER_COLS.split(",").includes(field));
    for (const field of ["email", "phone", "stripe_customer_id", "legal_accepted_ip"]) assert.ok(!PROFILE_COLS.split(",").includes(field));
  });
});
