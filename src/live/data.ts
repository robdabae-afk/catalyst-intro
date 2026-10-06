export type Hotspot = { x: number; y: number; tag: string; title: string; fact: string };
export type LiveDeal = {
  id: string; name: string; line: string; cat: string; city: string; img: string;
  goal: number; raised: number; investors: number; cap: string; min: string; days: number;
  spark: number[]; hotspots: Hotspot[];
};

export type LiveEvent = { id: string; title: string; when: string; where: string; img: string; cap: number; going: number };
export type MatchMeta = { founder: string; founderPhoto: string; mark: string; stage: "Pre-seed" | "Seed"; sectors: string[]; minCheck: number; traction: string; pitch?: string; pitchLen?: string; similarFollowed: number; eventsMet: number; mutuals: string[] };
export { DEALS, EVENTS, MATCH } from "@/features/catalog";
import { MATCH } from "@/features/catalog";
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export type Prefs = { sectors: string[]; stages: string[]; nyc: boolean; check: number };
export const DEFAULT_PREFS: Prefs = { sectors: [], stages: [], nyc: false, check: 0 };
export const SECTORS = ["Fintech", "AI", "Climate", "Software", "Hardware", "Health"];
export const CHECKS = [100, 250, 500, 1000];

export type Reason = { icon: "fintech" | "food" | "climate" | "software" | "health" | "location" | "limit" | "stage" | "mutual"; text: string };
export function scoreDeal(d: LiveDeal, p: Prefs): { score: number; reasons: Reason[]; line: string } {
  const m = MATCH[d.id];
  const reasons: Reason[] = [];
  if (p.sectors.includes(d.cat)) reasons.push({ icon: "stage", text: `${d.cat} matches your interests` });
  if (m && p.stages.includes(m.stage)) reasons.push({ icon: "stage", text: `${m.stage} matches your stages` });
  if (m?.minCheck && p.check && m.minCheck <= p.check) reasons.push({ icon: "limit", text: `Minimum ${usd(m.minCheck)} is within your preference` });
  return { score: 0, reasons, line: reasons.map(r => r.text).join(" · ") || "Explore this company" };
}
