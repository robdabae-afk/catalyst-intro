// All content is SAMPLE. No real companies, stats or raises.
export type Sector = "Fintech" | "Climate" | "Food" | "Health" | "Consumer" | "AI";
export type Stage = "Pre-seed" | "Seed" | "Series A";

export interface Company {
  id: string; name: string; tagline: string; sector: Sector; stage: Stage; city: string;
  raising: boolean; progress: number; daysLeft: number | null; founder: string;
}

export const COMPANIES: Company[] = [
  { id: "stoop", name: "Stoop", tagline: "Block-party software for neighborhood shops", sector: "Consumer", stage: "Pre-seed", city: "New York", raising: true, progress: 62, daysLeft: 4, founder: "Sample Founder A" },
  { id: "tally", name: "Tally Fresh", tagline: "Cold-chain lockers for corner groceries", sector: "Food", stage: "Seed", city: "New York", raising: true, progress: 38, daysLeft: 19, founder: "Sample Founder B" },
  { id: "brightyard", name: "Brightyard", tagline: "Rooftop solar co-ops for renters", sector: "Climate", stage: "Seed", city: "Brooklyn", raising: true, progress: 81, daysLeft: 9, founder: "Sample Founder C" },
  { id: "ledgerly", name: "Ledgerly", tagline: "Bookkeeping that talks back", sector: "Fintech", stage: "Pre-seed", city: "Austin", raising: false, progress: 0, daysLeft: null, founder: "Sample Founder D" },
  { id: "pulsebox", name: "Pulsebox", tagline: "At-home vitals kit for clinics", sector: "Health", stage: "Series A", city: "Boston", raising: true, progress: 24, daysLeft: 31, founder: "Sample Founder E" },
  { id: "parse", name: "Parse Kitchen", tagline: "AI menu costing for small restaurants", sector: "AI", stage: "Pre-seed", city: "San Francisco", raising: false, progress: 0, daysLeft: null, founder: "Sample Founder F" },
];
export const byId = (id: string) => COMPANIES.find((c) => c.id === id);

export type NotifKind = "new_pitch" | "founder_update" | "event_reminder" | "qa_answered" | "new_follower" | "raise_milestone";
export interface Notif { id: string; kind: NotifKind; title: string; body: string; ago: string; day: "Today" | "Yesterday" | "Earlier"; to: string; read?: boolean }

export const NOTIFS: Notif[] = [
  { id: "n1", kind: "new_pitch", title: "Stoop posted a new pitch", body: "90-second walkthrough of the merchant app.", ago: "12m", day: "Today", to: "company/stoop" },
  { id: "n2", kind: "raise_milestone", title: "Brightyard hit 75% of its sample goal", body: "Illustrative milestone. Investing opens soon.", ago: "1h", day: "Today", to: "company/brightyard" },
  { id: "n3", kind: "qa_answered", title: "Your question was answered", body: "Tally Fresh: \u201cHow many lockers are live?\u201d", ago: "3h", day: "Today", to: "company/tally" },
  { id: "n4", kind: "event_reminder", title: "Pitch Night is tomorrow", body: "Doors 6:30 PM. Your pass is ready.", ago: "9h", day: "Today", to: "ticket" },
  { id: "n5", kind: "new_follower", title: "Sample Member J followed you", body: "Angel-curious, NYC.", ago: "1d", day: "Yesterday", to: "me", read: true },
  { id: "n6", kind: "founder_update", title: "Pulsebox shared an update", body: "Pilot with two clinics wrapped.", ago: "1d", day: "Yesterday", to: "company/pulsebox", read: true },
  { id: "n7", kind: "founder_update", title: "Stoop shared an update", body: "Hiring a founding engineer.", ago: "4d", day: "Earlier", to: "company/stoop", read: true },
];

export const KIND_LABEL: Record<NotifKind, string> = {
  new_pitch: "New pitches from companies I follow", founder_update: "Founder updates", event_reminder: "Event reminders",
  qa_answered: "My Q&A answered", new_follower: "New followers", raise_milestone: "Raise milestones",
};

export interface Update { id: string; company: string; title: string; body: string; tag: string; ago: string }
export const UPDATES: Update[] = [
  { id: "u1", company: "stoop", title: "Hiring a founding engineer", body: "We're looking for someone who loves small businesses and React Native. Sample update.", tag: "Hiring", ago: "4d" },
  { id: "u2", company: "stoop", title: "40 shops on the waitlist", body: "Sample milestone from our Brooklyn pilot. Thanks to everyone who walked the block with us.", tag: "Milestone", ago: "2w" },
  { id: "u3", company: "pulsebox", title: "Clinic pilot wrapped", body: "Two sample clinics finished a six-week pilot. Writeup coming.", tag: "Product", ago: "1d" },
  { id: "u4", company: "brightyard", title: "First rooftop co-op signed", body: "Sample building in Bed-Stuy. Install scheduled for spring.", tag: "Milestone", ago: "3d" },
  { id: "u5", company: "tally", title: "Locker v2 prototype", body: "Quieter compressor, bigger doors. Sample photo set below.", tag: "Product", ago: "6d" },
];

export const EVENT = { title: "Catalyst Pitch Night", venue: "Sample Venue, Lower East Side", city: "New York", start: "2026-10-13T18:30:00-04:00", end: "2026-10-13T21:00:00-04:00", holder: "You", pass: "CAT-PN-0413" };

export interface LearnCard { id: string; title: string; body: string; q: string; options: string[]; answer: number; why: string }
export const LEARN: LearnCard[] = [
  { id: "l1", title: "What is Reg CF?", body: "Regulation Crowdfunding lets startups raise money from everyday people, not just accredited investors. Every raise has to run through an SEC-registered funding portal or broker-dealer.", q: "Who runs a Reg CF raise?", options: ["Any website", "A registered funding portal or broker-dealer", "The founder's bank"], answer: 1, why: "Reg CF offerings must go through an SEC-registered intermediary." },
  { id: "l2", title: "There are limits", body: "If your income or net worth is under $124,000, you can invest the greater of $2,500 or 5% of the greater of the two, across all Reg CF deals in 12 months. Accredited investors have no limit.", q: "Limits apply per...", options: ["Deal", "12 months, across all Reg CF deals", "Lifetime"], answer: 1, why: "The cap is a 12-month total across every Reg CF investment." },
  { id: "l3", title: "You can lose it all", body: "Most startups fail. Treat any amount you put in as money you could lose completely.", q: "A good rule of thumb is...", options: ["Invest your emergency fund", "Only invest what you can afford to lose", "Startups are low risk"], answer: 1, why: "Early-stage investing is high risk." },
  { id: "l4", title: "It's illiquid", body: "Reg CF securities generally can't be resold for a year, and there may never be a market to sell them. Plan to hold for many years.", q: "Can you usually sell in the first year?", options: ["Yes, anytime", "Generally no", "Only on weekends"], answer: 1, why: "There's a one-year resale restriction with limited exceptions." },
  { id: "l5", title: "Read the Form C", body: "Every offering files a Form C with the SEC. It covers the business, risks, use of funds and financials. Read it before you commit.", q: "Where do you find a deal's risks and financials?", options: ["The Form C", "The founder's Instagram", "A group chat"], answer: 0, why: "Form C is the required disclosure document." },
];
