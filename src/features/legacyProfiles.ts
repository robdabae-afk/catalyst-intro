// Read-only compatibility path: maps existing approved profiles into the app catalog.
// Never writes. Never selects email/phone/stripe/admin fields. RLS decides what is visible.
import type { Person } from "@/live/profiles";

export const PROFILE_COLS = "id,name,user_type,avatar_url,linkedin_url,approved,is_hidden,is_flagged,is_test_account,is_test_mode,created_at";
export const FOUNDER_COLS = "id,profile_id,startup_name,one_liner,industry,location,stage,logo_url,banner_url,video_url,traction,raise_amount,raise_type,valuation_cap_target,fundraising_status,team_members,created_at";
export const INVESTOR_COLS = "profile_id,firm_name,position,location,investment_thesis,sectors_of_interest,preferred_stage";

type Row = Record<string, any>;
const t = (v: unknown) => typeof v === "string" ? v.trim() : "";
const safeUrl = (v: unknown) => { const s = t(v); if (!s) return ""; try { const u = new URL(s); return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""; } catch { return ""; } };
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join("").toUpperCase();

/** Visible = approved, not hidden, not flagged, not a test account/mode. */
export const isVisibleProfile = (p: Row) => p?.approved === true && p.is_hidden !== true && p.is_flagged !== true && p.is_test_account !== true && p.is_test_mode !== true && !!t(p.name);

const STAGES: Record<string, string> = { "pre-seed": "Pre-seed", seed: "Seed", "series-a": "Series A", "series-b": "Series B" };
export const legacyId = (founderRowId: string) => `legacy-${founderRowId}`;

export function mapLegacy(profiles: Row[], founders: Row[], investors: Row[]) {
  const visible = new Map(profiles.filter(isVisibleProfile).map(p => [p.id, p]));
  const inv = new Map(investors.map(i => [i.profile_id, i]));
  const companyByOwner = new Map<string, string>();
  // One company per owner, stable: oldest created_at then id. Source rows untouched.
  const ordered = [...founders].sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) || String(a.id).localeCompare(String(b.id)));
  const owned = new Set<string>();
  const companies = ordered.filter(f => visible.get(f.profile_id)?.user_type === "founder" && t(f.startup_name) && t(f.startup_name).toLowerCase() !== "untitled" && !owned.has(f.profile_id) && !!owned.add(f.profile_id)).map(f => {
    const owner = visible.get(f.profile_id)!; const id = legacyId(f.id);
    companyByOwner.set(f.profile_id, id);
    return { id, ownerId: f.profile_id as string, name: t(f.startup_name), line: t(f.one_liner), sector: (Array.isArray(f.industry) ? t(f.industry[0]) : ""), sectors: Array.isArray(f.industry) ? f.industry.filter((x: unknown) => typeof x === "string") as string[] : [],
      city: t(f.location), stage: STAGES[t(f.stage)] ?? "", cover: safeUrl(f.banner_url) || safeUrl(f.logo_url), logo: safeUrl(f.logo_url), pitch: safeUrl(f.video_url),
      // traction_tiles holds metric keys (mrr etc), not values; only free-text traction is shown.
      traction: t(f.traction) ? [t(f.traction)] : [],
      // Only founder-entered targets; never fabricate raised/investors.
      goal: Number(f.raise_amount) > 0 ? Number(f.raise_amount) : 0, instrument: t(f.raise_type), valuationCap: Number(f.valuation_cap_target) > 0 ? `$${Number(f.valuation_cap_target).toLocaleString()}` : "",
      // Every live row is "actively_raising" (possible default, checked 10/7); intended meaning unknown, so not claimed.
      raising: false, founderName: t(owner.name), founderPhoto: safeUrl(owner.avatar_url), createdAt: f.created_at ?? owner.created_at };
  });
  const people: Person[] = [...visible.values()].map(p => {
    const i = inv.get(p.id); const role: Person["role"] = p.user_type === "founder" ? "Founder" : p.user_type === "investor" ? "Investor" : "Member";
    const bio = role === "Investor" ? [t(i?.position) && t(i?.firm_name) ? `${t(i?.position)} at ${t(i?.firm_name)}` : t(i?.firm_name), t(i?.investment_thesis)].filter(Boolean).join(". ") : "";
    return { id: p.id, name: t(p.name), initials: initials(t(p.name)), photo: safeUrl(p.avatar_url) || undefined, role, at: companyByOwner.get(p.id), city: t(i?.location) || companies.find(c => c.ownerId === p.id)?.city || "", bio, backed: [], events: [], followers: 0, mutual: 0 };
  });
  return { companies, people };
}
