import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapLegacy } from "../src/features/legacyProfiles";
import { collectDiscoverPage } from "../src/lib/discover-pagination";
const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
describe("admin-only browsing", () => {
  it("maps pending, hidden and test people/companies only in admin mode", () => {
    const profiles = [
      { id: "p", name: "Pending", user_type: "founder", approved: false },
      { id: "t", name: "Test", user_type: "investor", approved: true, is_hidden: true, is_flagged: true, is_test_account: true, is_test_mode: true },
    ];
    const founders = [{ id: "f", profile_id: "p", startup_name: "Pending Co" }];
    assert.equal(mapLegacy(profiles, founders, []).people.length, 0);
    const admin = mapLegacy(profiles, founders, [], true);
    assert.deepEqual(admin.people.map(p => p.id), ["p", "t"]);
    assert.equal(admin.companies[0].name, "Pending Co");
    assert.equal(profiles[0].approved, false);
    const allRows = mapLegacy(profiles, [...founders,
      { id: "f2", profile_id: "p", startup_name: "Second company" },
      { id: "f3", profile_id: "t", startup_name: "Untitled" }], [], true);
    assert.equal(allRows.companies.length, 3);
  });
  it("checks a session-bound server role without client email or chosen user id", () => {
    const helper = source('src/lib/browse-access.ts');
    assert.match(helper, /rpc\("browse_is_admin"\)/);
    assert.doesNotMatch(helper, /robdabae|\.email|localStorage/);
    const sql = source('supabase/migrations/20261008110000_admin_browse_all.sql');
    assert.match(sql, /has_role\(auth.uid\(\), 'admin'::public.app_role\)/);
    assert.match(sql, /REVOKE ALL.*FROM PUBLIC, anon/);
    assert.doesNotMatch(sql, /UPDATE public.profiles|INSERT INTO.*user_roles/i);
  });
  it("admin queries omit ordinary predicates but keep their nonadmin paths", () => {
    const feed = source('src/hooks/useDiscoverFeed.ts');
    assert.match(feed, /if \(!isAdmin\) \{[\s\S]*?eq\("user_type", targetType\)[\s\S]*?eq\("approved", true\)/);
    assert.match(feed, /if \(!isAdmin\) rows = rows.filter/);
    assert.match(feed, /!isAdmin && targetType === "founder"/);
    const catalog = source('src/features/catalog.ts');
    assert.match(catalog, /adminViewer \? db.from\("profiles"\).select\(PROFILE_COLS\)/);
    assert.match(catalog, /mapLegacy\(pr.data \?\? \[\], fr.data \?\? \[\], ir.data \?\? \[\], adminViewer\)/);
    assert.match(catalog, /adminViewer[\s\S]*?from\("app_companies"\).select\("\*"\).order\("sort"\)/);
    assert.match(source('src/pages/Dashboard.tsx'), /hasMore && cardIndex >= profiles.length\) void loadMore\(\)/);
  });
});
describe("discover pagination", () => {
  it("does not stop at 2 eligible cards in the first raw window", async () => {
    const read: number[] = [];
    const result = await collectDiscoverPage(0, 24, async page => {
      read.push(page);
      return { rows: page === 0 ? [1, 2] : [3, 4, 5], count: 29 };
    });
    assert.deepEqual(read, [0, 1]);
    assert.deepEqual(result, { rows: [1, 2, 3, 4, 5], hasMore: false, lastPage: 1 });
  });
  it("continues past wholly excluded windows and resumes at the next raw page", async () => {
    const result = await collectDiscoverPage(0, 24, async page => ({ rows: page < 2 ? [] : Array.from({length:24}, (_, i) => i), count: 80 }));
    assert.equal(result.lastPage, 2);
    assert.equal(result.hasMore, true);
    const next = await collectDiscoverPage(result.lastPage + 1, 24, async page => ({ rows: [page], count: 80 }));
    assert.deepEqual(next.rows, [3]);
    assert.equal(next.hasMore, false);
  });
});
