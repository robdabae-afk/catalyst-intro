// SAMPLE company detail data. Field names mirror the real platform contract so this maps to live data:
//   Deal + Question  -> src/platform/types.ts (app-ui-preview)
//   Pitch chapters   -> src/lib/platform/contract.ts PitchChapterKey (app-ui-pitchflow)
//   regCfLimit / sampleQA -> src/try/data.ts, src/try/threads.ts
import type { Deal, Question } from "@/platform/types";
import { sampleQA } from "@/try/threads";

export type PitchChapterKey = "hook" | "problem" | "demo" | "traction" | "team" | "ask";
export type PitchChapter = { key: PitchChapterKey; t: number };
export const CHAPTER_LABEL: Record<PitchChapterKey, string> = { hook: "Hook", problem: "Problem", demo: "Product", traction: "Traction", team: "Team", ask: "Ask" };

export type Metric = { label: string; unit: string; series: number[] }; // monthly, oldest first
export type Doc = { name: string; kind: "deck" | "form_c" | "financials" | "safe"; ready: boolean };
export type Update = { title: string; body: string; when: string };
export type Company = Deal & {
  problem: string; solution: string; stage: "Pre-seed" | "Seed";
  media: { src: string; kind: "image" | "video"; caption: string }[];
  metric: Metric; milestones: string[];
  market: { headline: string; tam: string; sam: string; why: string };
  model: { headline: string; price: string; points: string[] };
  docs: Doc[]; updates: Update[]; risks: string[]; eventIds: string[];
  chapters: PitchChapter[];
};

const base = { status: "preview" as const, isSample: true, instrument: "SAFE", createdAt: "2026-09-01T00:00:00Z" };
const docs = (deck: boolean): Doc[] => [
  { name: "Pitch deck", kind: "deck", ready: deck },
  { name: "Form C (SEC filing)", kind: "form_c", ready: false },
  { name: "Financial statements", kind: "financials", ready: false },
  { name: "SAFE agreement", kind: "safe", ready: false },
];
const ch = (): PitchChapter[] => [{ key: "problem", t: 0 }, { key: "demo", t: 2.4 }, { key: "traction", t: 4.8 }, { key: "team", t: 7.2 }, { key: "ask", t: 9.6 }];

export const COMPANIES: Record<string, Company> = {
  lumen: {
    ...base, id: "lumen", slug: "lumen-labs", name: "Lumen Labs", line: "Glasses that caption conversations in real time", sector: "Hardware", city: "Brooklyn, NY",
    about: "Lumen Labs makes lightweight glasses that show live captions of whoever you're talking to.", stage: "Pre-seed",
    problem: "Group conversations move too fast for people with hearing loss. Most just nod along.",
    solution: "Captions appear on the lens in under a second, so you can follow the room without looking at a phone.",
    minCheck: 100, valuationCap: "$6M", goal: 250000, coverUrl: "/live/deal-lumen.jpg",
    traction: ["1,200 on the waitlist", "40 beta testers", "Prototype v3 shipped"],
    useOfFunds: ["40% · First production run", "35% · Speech model team", "25% · Beta program + certification"],
    media: [{ src: "/live/pitch-lumen.mp4", kind: "video", caption: "Prototype v3, captions on lens" }, { src: "/live/deal-lumen.jpg", kind: "image", caption: "Frame + companion app" }],
    metric: { label: "Waitlist", unit: "signups", series: [60, 110, 180, 260, 340, 430, 520, 640, 760, 900, 1050, 1200] },
    milestones: ["Mar · first working prototype", "Jun · beta with 40 testers", "Sep · prototype v3"],
    market: { headline: "Hearing-loss wearables are moving from medical to everyday.", tam: "$9B", sam: "$1.2B", why: "Over-the-counter hearing rules opened retail. Phones made people used to captions." },
    model: { headline: "Sell the glasses, then a monthly plan.", price: "$399 + $12/mo", points: ["Hardware at a small margin", "Subscription for translation + saved transcripts", "Clinic referral partnerships"] },
    docs: docs(true), updates: [{ title: "Prototype v3 is in testers' hands", body: "Battery now lasts a full workday. Captions lag dropped to 280ms.", when: "4d" }, { title: "Waitlist passed 1,000", body: "Mostly from two hearing-loss communities that shared us.", when: "3w" }],
    risks: ["Hardware is expensive and slow to fix once shipped.", "Big tech could add captions to their own glasses.", "May need FDA or FCC sign-off depending on claims.", "Early startups often fail. You could lose all of your investment."],
    eventIds: ["e1"], chapters: ch(),
  },
  gridline: {
    ...base, id: "gridline", slug: "gridline", name: "Gridline", line: "Home batteries that sell power back at peak hours", sector: "Climate", city: "Queens, NY",
    about: "Gridline installs smart home batteries and runs software that sells stored power back to the utility when demand peaks.", stage: "Seed",
    problem: "Peak-hour power is the dirtiest and most expensive power on the grid.",
    solution: "A wall battery charges overnight, then software sells power back at peak hours and splits the payout with the homeowner.",
    minCheck: 150, valuationCap: "$9M", goal: 400000, coverUrl: "/live/deal-gridline.jpg",
    traction: ["40-home utility pilot", "1 utility partner", "$18K pilot revenue (sample)"],
    useOfFunds: ["50% · Battery inventory", "30% · Grid software team", "20% · Installs + permits"],
    media: [{ src: "/live/deal-gridline.jpg", kind: "image", caption: "Battery unit in an Astoria home" }],
    metric: { label: "Homes live", unit: "homes", series: [1, 2, 3, 5, 8, 11, 15, 19, 24, 29, 35, 40] },
    milestones: ["Jan · first install", "May · utility pilot signed", "Aug · 40th home live"],
    market: { headline: "Utilities pay a premium for power at peak hours.", tam: "$14B", sam: "$600M", why: "Peak demand keeps rising and new power plants take a decade to build." },
    model: { headline: "Battery lease plus a cut of grid payouts.", price: "~$40/mo lease", points: ["Monthly battery lease", "Share of peak-hour grid payouts", "Fleet software for utilities"] },
    docs: docs(true), updates: [{ title: "Utility pilot signed", body: "Sample pilot with 40 homes in Astoria. Install starts in spring.", when: "1w" }],
    risks: ["Utility programs and rates can change.", "Battery hardware costs swing a lot.", "Competition from large solar and battery companies.", "Early startups often fail. You could lose all of your investment."],
    eventIds: ["e1"], chapters: ch(),
  },
  tally: {
    ...base, id: "tally", slug: "tally", name: "Tally", line: "Bookkeeping that runs from a photo of a receipt", sector: "Software", city: "New York, NY",
    about: "Tally turns receipt photos into finished books for small businesses.", stage: "Seed",
    problem: "Small businesses lose hours every week to paper receipts.",
    solution: "Snap a receipt and Tally files, categorizes and reconciles it automatically.",
    minCheck: 100, valuationCap: "$12M", goal: 500000, coverUrl: "/live/deal-tally.jpg",
    traction: ["2,100 businesses", "$31K MRR (sample)", "4.8 App Store rating (sample)"],
    useOfFunds: ["45% · Engineering", "35% · Growth", "20% · Accountant partnerships"],
    media: [{ src: "/live/deal-tally.jpg", kind: "image", caption: "Receipt in, books out" }],
    metric: { label: "Businesses", unit: "accounts", series: [120, 210, 330, 470, 610, 780, 950, 1150, 1380, 1620, 1860, 2100] },
    milestones: ["Feb · launch", "Jun · 1,000 businesses", "Sep · receipt scanning v2"],
    market: { headline: "33M US small businesses still do books by hand.", tam: "$20B", sam: "$2.5B", why: "Phone cameras plus AI made data entry free." },
    model: { headline: "Monthly subscription per business.", price: "$15/mo", points: ["Self-serve monthly plans", "Accountant seats", "Payroll add-on (planned)"] },
    docs: docs(true), updates: [{ title: "Receipt scanning v2 shipped", body: "Works on crumpled and faded receipts now.", when: "1d" }],
    risks: ["Crowded market with big incumbents.", "Depends on app store and bank data access.", "Early startups often fail. You could lose all of your investment."],
    eventIds: ["e1"], chapters: ch(),
  },
};

/** Q&A in the platform Question shape, seeded from the main repo's sampleQA. */
export function companyQuestions(c: Company, founderName: string): (Question & { votes: number; when: string; answeredBy?: string })[] {
  return sampleQA(c.name, "Founder").map((x, i) => ({
    id: `${c.id}-q${i}`, dealId: c.id, userId: `sample-${i}`, memberName: x.asker, body: x.q,
    answer: x.a ?? null, answeredAt: x.a ? "2026-10-01T00:00:00Z" : undefined, hidden: false, createdAt: "2026-10-01T00:00:00Z",
    votes: x.votes, when: x.when, answeredBy: x.a ? `${founderName}, Founder` : undefined,
  }));
}

export const SECTIONS = [
  ["overview", "Overview"], ["product", "Product"], ["traction", "Traction"], ["team", "Team"], ["market", "Market"],
  ["model", "Business model"], ["raise", "The raise"], ["docs", "Documents"], ["updates", "Updates"], ["qa", "Q&A"],
  ["risks", "Risks"], ["events", "Events"], ["limit", "Your limit"],
] as const;
export type SectionId = (typeof SECTIONS)[number][0];
