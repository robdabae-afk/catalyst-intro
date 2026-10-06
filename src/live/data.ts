// All figures are SAMPLE data for UI preview. Not real companies or offerings.
export type Hotspot = { x: number; y: number; tag: string; title: string; fact: string };
export type LiveDeal = {
  id: string; name: string; line: string; cat: string; city: string; img: string;
  goal: number; raised: number; investors: number; cap: string; min: string; days: number;
  spark: number[]; hotspots: Hotspot[];
};

export const DEALS: LiveDeal[] = [
  {
    id: "lumen", name: "Lumen Labs", line: "Glasses that caption conversations in real time", cat: "Hardware", city: "Brooklyn, NY",
    img: "/live/deal-lumen.jpg", goal: 250000, raised: 162400, investors: 412, cap: "$6M", min: "$100", days: 18,
    spark: [2, 3, 3, 5, 4, 6, 8, 7, 9, 12, 11, 14],
    hotspots: [
      { x: 50, y: 50, tag: "PRODUCT / 01", title: "The lens", fact: "Sample: on-device speech model, captions in under 300ms." },
      { x: 78, y: 62, tag: "APP / 02", title: "Companion app", fact: "Sample: saves transcripts and translates 12 languages." },
    ],
  },
  {
    id: "gridline", name: "Gridline", line: "Home batteries that sell power back at peak hours", cat: "Climate", city: "Queens, NY",
    img: "/live/deal-gridline.jpg", goal: 400000, raised: 118000, investors: 236, cap: "$9M", min: "$150", days: 31,
    spark: [1, 2, 2, 3, 3, 4, 4, 6, 5, 7, 8, 9],
    hotspots: [
      { x: 52, y: 48, tag: "PRODUCT / 01", title: "Grow racks", fact: "Sample: vertical racks, harvested every 21 days." },
      { x: 84, y: 30, tag: "TECH / 02", title: "Sensor box", fact: "Sample: tracks light, water and temperature per shelf." },
    ],
  },
  {
    id: "tally", name: "Tally", line: "Bookkeeping that runs from a photo of a receipt", cat: "Software", city: "New York, NY",
    img: "/live/deal-tally.jpg", goal: 500000, raised: 391000, investors: 688, cap: "$12M", min: "$100", days: 7,
    spark: [3, 4, 6, 6, 8, 9, 11, 13, 12, 15, 17, 19],
    hotspots: [
      { x: 36, y: 44, tag: "PRODUCT / 01", title: "The app", fact: "Sample: snap a receipt, it files and categorizes it." },
      { x: 76, y: 56, tag: "INPUT / 02", title: "Paper in", fact: "Sample: works on crumpled and faded receipts." },
    ],
  },
];

export type LiveEvent = { id: string; title: string; when: string; where: string; img: string; cap: number; going: number };
export const EVENTS: LiveEvent[] = [
  { id: "e1", title: "Founder Night: Hardware & AI", when: "THU 7:00 PM", where: "SoHo, NY", img: "/live/ev-1.jpg", cap: 60, going: 51 },
  { id: "e2", title: "Pitch Room: Climate", when: "TUE 6:30 PM", where: "Flatiron, NY", img: "/live/ev-2.jpg", cap: 40, going: 37 },
];

export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/* ---- Discover match signal (SAMPLE) ---- */
export type MatchMeta = { founder: string; founderPhoto: string; mark: string; stage: "Pre-seed" | "Seed"; sectors: string[]; minCheck: number; traction: string; pitch?: string; pitchLen?: string; similarFollowed: number; eventsMet: number; mutuals: string[] };
export const MATCH: Record<string, MatchMeta> = {
  lumen: { founder: "p-maya", founderPhoto: "/live/founder-lumen.jpg", mark: "L", stage: "Pre-seed", sectors: ["Hardware", "Health"], minCheck: 100, traction: "1,200 waitlist", pitch: "/live/pitch-lumen.mp4", pitchLen: "0:06", similarFollowed: 2, eventsMet: 2, mutuals: ["p-lee", "p-jo", "p-dev"] },
  gridline: { founder: "p-ana", founderPhoto: "/live/founder-gridline.jpg", mark: "G", stage: "Seed", sectors: ["Climate", "Hardware"], minCheck: 150, traction: "40-home utility pilot", pitch: "/live/deal-gridline.jpg", pitchLen: "0:06", similarFollowed: 1, eventsMet: 1, mutuals: ["p-lee"] },
  tally: { founder: "p-sam", founderPhoto: "/live/founder-tally.jpg", mark: "T", stage: "Seed", sectors: ["Fintech", "Software"], minCheck: 100, traction: "2,100 businesses", pitch: "/live/pitch-tally.mp4", pitchLen: "0:06", similarFollowed: 3, eventsMet: 0, mutuals: ["p-lee", "p-jo", "p-dev", "p-maya"] },
};
export type Prefs = { sectors: string[]; stages: string[]; nyc: boolean; check: number };
export const DEFAULT_PREFS: Prefs = { sectors: ["Fintech", "Hardware"], stages: ["Pre-seed", "Seed"], nyc: true, check: 250 };
export const SECTORS = ["Fintech", "AI", "Climate", "Software", "Hardware", "Health"];
export const CHECKS = [100, 250, 500, 1000];

export type Reason = { icon: "fintech" | "food" | "climate" | "software" | "health" | "location" | "limit" | "stage" | "mutual"; text: string };
export function scoreDeal(d: LiveDeal, p: Prefs): { score: number; reasons: Reason[]; line: string } {
  const m = MATCH[d.id];
  const reasons: Reason[] = [];
  let s = 18;
  const hit = m.sectors.find((x) => p.sectors.includes(x));
  if (hit) { s += 26; reasons.push({ icon: (({ Fintech: "fintech", Food: "food", Climate: "climate", Software: "software", Health: "health", Hardware: "software", AI: "software" } as Record<string, Reason["icon"]>)[hit] ?? "software"), text: `${hit} · you follow ${m.similarFollowed || 1} similar` }); }
  const nyc = /NY/.test(d.city);
  if (p.nyc && nyc) { s += 14; reasons.push({ icon: "location", text: m.eventsMet ? `NYC founder · met at ${m.eventsMet} event${m.eventsMet > 1 ? "s" : ""}` : "NYC founder · near you" }); }
  if (p.stages.includes(m.stage)) s += 10;
  if (m.minCheck <= p.check) { s += 10; reasons.push({ icon: "limit", text: `$${m.minCheck} min · fits your $${p.check.toLocaleString("en-US")}` }); }
  s += Math.min(8, m.mutuals.length * 2);
  if (reasons.length < 2) reasons.push({ icon: "mutual", text: `${m.mutuals.length} mutual${m.mutuals.length > 1 ? "s" : ""} in your network` });
  const score = Math.min(99, s);
  const line = hit ? `Fits your ${hit.toLowerCase()} focus${p.nyc && nyc ? " in NYC" : ""} at a $${p.check.toLocaleString("en-US")} check` : `Outside your sectors, but ${m.mutuals.length} people you know follow it`;
  return { score, reasons: reasons.slice(0, 3), line };
}
