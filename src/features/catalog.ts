import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/demo/mode";
import * as D from "@/demo/orig/featureData";
import * as L from "@/demo/orig/liveData";
import * as C from "@/demo/orig/company";
import * as P from "@/demo/orig/people";
import type { Company as FeatureCompany, Notif, Update } from "./data";
import type { LiveDeal, LiveEvent, MatchMeta } from "@/live/data";
import type { Company as DetailCompany } from "@/live/company";
import type { Person } from "@/live/profiles";

export const COMPANIES: FeatureCompany[] = [];
export const DEALS: LiveDeal[] = [];
export const DETAIL_COMPANIES: Record<string, DetailCompany> = {};
export const EVENTS: (LiveEvent & { start: string; end: string; venue: string; city: string; url: string; companyIds: string[] })[] = [];
export const MATCH: Record<string, MatchMeta> = {};
export const PEOPLE: Person[] = [];
export const NOTIFS: Notif[] = [];
export const UPDATES: Update[] = [];
export const THREADS: { id: string; who: string; d: LiveDeal; last: string; unread: boolean; t: string }[] = [];
export type CatalogStatus = "loading" | "ready" | "missing" | "error";
export let catalogStatus: CatalogStatus = "loading";
let revision = 0;
const listeners = new Set<() => void>();
const notify = () => { revision++; listeners.forEach(f => f()); };
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
const snapshot = () => revision;
let started = false;
const text = (v: unknown) => typeof v === "string" ? v : "";
const num = (v: unknown) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : 0;
const strs = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
// Content URLs never accept javascript/data schemes from founder submissions.
export const contentUrl = (v: unknown) => { const s = text(v).trim(); if (!s) return ""; try { const u = new URL(s, window.location.origin); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
const list = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
function loadDemo() {
  COMPANIES.splice(0, COMPANIES.length, ...D.COMPANIES);
  NOTIFS.splice(0, NOTIFS.length, ...D.NOTIFS);
  UPDATES.splice(0, UPDATES.length, ...D.UPDATES);
  DEALS.splice(0, DEALS.length, ...L.DEALS);
  PEOPLE.splice(0, PEOPLE.length, ...P.PEOPLE);
  THREADS.splice(0, THREADS.length, ...P.THREADS);
  Object.assign(MATCH, L.MATCH);
  Object.assign(DETAIL_COMPANIES, C.COMPANIES);
  const ev = D.EVENT;
  EVENTS.splice(0, EVENTS.length, ...L.EVENTS.map((e, i) => ({ ...e, start: i === 0 ? ev.start : ev.start, end: ev.end, venue: ev.venue, city: ev.city, url: "", companyIds: L.DEALS.map(d => d.id) })));
  catalogStatus = "ready";
}
export const demoQuestions = C.companyQuestions;
if (isDemoMode()) loadDemo();
export async function loadCatalog() {
  if (isDemoMode()) { loadDemo(); notify(); return; }
  const db = supabase as any;
  const [companies, events] = await Promise.all([
    db.from("app_companies").select("*").eq("status", "published").order("sort"),
    db.from("app_events").select("*").eq("status", "published").order("starts_at"),
  ]);
  const error = companies.error || events.error;
  catalogStatus = error ? ["PGRST205", "42P01"].includes(error.code) ? "missing" : "error" : "ready";
  COMPANIES.length = DEALS.length = EVENTS.length = PEOPLE.length = UPDATES.length = NOTIFS.length = 0;
  for (const k of Object.keys(DETAIL_COMPANIES)) delete DETAIL_COMPANIES[k];
  for (const k of Object.keys(MATCH)) delete MATCH[k];
  for (const row of companies.data ?? []) {
    const d = row.data ?? {}, id = row.id, team = list<Record<string, unknown>>(d.team);
    const founder = team[0] ?? {};
    const cover = contentUrl(d.coverUrl), pitch = contentUrl(d.pitchUrl);
    const eventIds = (events.data ?? []).filter((e: any) => e.company_ids?.includes(id)).map((e: any) => e.id);
    team.forEach((p, i) => { const name = text(p.name); if (name) PEOPLE.push({ id: text(p.id) || `${id}-team-${i}`, name, initials: name.split(/\s+/).map(s => s[0]).slice(0, 2).join(""), photo: contentUrl(p.photo || p.photoUrl), role: "Founder", at: id, city: text(d.city), bio: text(p.bio), backed: [], events: eventIds, followers: 0, mutual: 0 }); });
    COMPANIES.push({ id, name: text(d.name), tagline: text(d.line), sector: text(d.sector) as FeatureCompany["sector"], stage: text(d.stage) as FeatureCompany["stage"], city: text(d.city), raising: false, traction: strs(d.traction)[0] ?? "", founder: text(founder.name), img: cover, face: contentUrl(founder.photo || founder.photoUrl), pitch });
    DEALS.push({ id, name: text(d.name), line: text(d.line), cat: text(d.sector), city: text(d.city), img: cover, goal: num(d.goal), raised: 0, investors: 0, cap: text(d.valuationCap), min: num(d.minCheck) ? `$${num(d.minCheck)}` : "Not set", days: 0, spark: [], hotspots: [] });
    MATCH[id] = { founder: text(founder.id) || `${id}-team-0`, founderPhoto: contentUrl(founder.photo || founder.photoUrl), mark: text(d.name).slice(0,1), stage: text(d.stage) as MatchMeta["stage"], sectors: [text(d.sector)], minCheck: num(d.minCheck), traction: strs(d.traction)[0] ?? "", pitch, similarFollowed: 0, eventsMet: 0, mutuals: [] };
    DETAIL_COMPANIES[id] = { id, slug: id, name: text(d.name), line: text(d.line), sector: text(d.sector), city: text(d.city), about: text(d.about), problem: text(d.problem), solution: text(d.solution), stage: text(d.stage) as DetailCompany["stage"], minCheck: num(d.minCheck), valuationCap: text(d.valuationCap), goal: num(d.goal), status: "preview", isSample: false, instrument: text(d.instrument), coverUrl: cover, traction: strs(d.traction), useOfFunds: strs(d.useOfFunds), createdAt: row.created_at,
      media: [...(pitch ? [{src: pitch, kind: "video" as const, caption: "Company pitch"}] : []), ...(cover ? [{src: cover, kind: "image" as const, caption: "Company photo"}] : [])],
      metric: {label: "", unit: "", series: []}, milestones: strs(d.milestones), market: {headline: text(d.market?.headline), tam: text(d.market?.tam), sam: text(d.market?.sam), why: text(d.market?.why)}, model: {headline: text(d.model?.headline), price: text(d.model?.price), points: strs(d.model?.points)}, docs: list<DetailCompany["docs"][number]>(d.docs).map(x => ({ ...x, ready: false })), updates: list<DetailCompany["updates"][number]>(d.updates), risks: strs(d.risks), eventIds, chapters: list<DetailCompany["chapters"][number]>(d.chapters) };
    DETAIL_COMPANIES[id].updates.forEach((u, i) => UPDATES.push({id: `${id}-update-${i}`, company: id, title: text(u.title), body: text(u.body), tag: "Update", ago: text(u.when)}));
  }
  for (const e of events.data ?? []) EVENTS.push({id: e.id, title: e.title, when: new Date(e.starts_at).toLocaleString(), where: [e.venue,e.city].filter(Boolean).join(", "), img: contentUrl(e.image_url), cap: e.capacity ?? 0, going: 0, start: e.starts_at, end: e.ends_at ?? e.starts_at, venue: e.venue, city: e.city, url: contentUrl(e.url), companyIds: e.company_ids ?? []});
  notify();
}
export function useCatalog() {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { if (!started) { started = true; void loadCatalog(); } }, []);
  return { status: catalogStatus, companies: COMPANIES, events: EVENTS };
}
export const byId = (id: string) => COMPANIES.find(c => c.id === id);
