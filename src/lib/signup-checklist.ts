type Row = Record<string, any> | null | undefined;
export type SignupItem = { id: string; title: string; done: boolean; to: string; note?: string };
const filled = (v: unknown) => typeof v === "string" ? !!v.trim() && v.trim() !== "Untitled" : v != null;
const array = (v: unknown) => Array.isArray(v) && v.length > 0;
const link = (section: string, field?: string) => "/settings" + (field ? "?field=" + encodeURIComponent(field) : "") + "#section-" + section;
/** Signup completion is saved profile data, never local engagement actions or is_verified. */
export function signupChecklist(p: Row, r: Row, verification: string): SignupItem[] {
  if (!p) return [];
  const items: SignupItem[] = [
    { id: "account", title: "Account created", done: filled(p.name) && filled(p.email), to: link("basic", "Full name") },
    { id: "photo", title: "Profile photo", done: filled(p.avatar_url), to: link("photos") },
    { id: "linkedin", title: "LinkedIn profile", done: filled(p.linkedin_url), to: link("basic", "LinkedIn profile URL") },
  ];
  const add = (id: string, title: string, done: boolean, section: string, field?: string) => items.push({ id, title, done, to: link(section, field) });
  if (p.user_type === "founder") {
    add("startup", "Startup name and HQ location", filled(r?.startup_name) && filled(r?.location), "startup", "Startup name");
    add("oneliner", "One-liner", filled(r?.one_liner), "startup", "One-liner");
    add("stage", "Company stage", filled(r?.stage), "startup", "Company stage");
    add("industries", "Industries", array(r?.industry), "startup", "Industries");
    add("traction", "Traction and metrics", filled(r?.traction) || filled(r?.mrr), "startup", "Traction");
    add("team", "Team", array(r?.team_members) || r?.headcount != null, "startup", "Headcount");
  } else if (p.user_type === "investor") {
    add("type", "Investor type", filled(r?.investor_type), "investor", "Investor type");
    add("accreditation", "Accreditation status", filled(r?.accreditation_status), "investor", "Accreditation status");
    add("sectors", "Sectors of interest", array(r?.sectors_of_interest), "investor", "Sectors of interest");
    add("check", "Typical check size", filled(r?.typical_check_size), "investor", "Typical check size");
    add("thesis", "Investment thesis", filled(r?.investment_thesis), "investor", "Investment thesis");
    add("responsiveness", "Responsiveness", r?.response_rate != null || filled(r?.avg_reply_time), "investor", "Response rate (%)");
    add("portfolio", "Portfolio stats", r?.deals_last_12mo != null || filled(r?.total_invested) || r?.notable_exits != null, "investor", "Deals (12mo)");
    add("companies", "Portfolio companies", array(r?.portfolio_companies), "investor", "Portfolio companies");
  }
  items.push({ id: "identity", title: "Verify identity", done: verification === "approved", to: link("verification"), note: verification === "pending" ? "ID and selfie submitted, awaiting admin review" : verification === "rejected" ? "Please resubmit your ID and selfie" : "Government ID and selfie, approved by an admin" });
  return items;
}
