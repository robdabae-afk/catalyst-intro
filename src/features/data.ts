// All content is SAMPLE. No real companies, stats or raises.
export type Sector = "Fintech" | "Climate" | "Hardware" | "Health" | "Consumer" | "AI";
export type Stage = "Pre-seed" | "Seed" | "Series A";

export interface Company {
  id: string; name: string; tagline: string; sector: Sector; stage: Stage; city: string;
  raising: boolean; traction: string; founder: string;
  img: string; face: string; pitch?: string;
}

const X = "/x/";
export const COMPANIES: Company[] = [
  { id: "lumen", name: "Lumen Labs", tagline: "Glasses that caption conversations in real time", sector: "Hardware", stage: "Pre-seed", city: "Brooklyn", raising: true, traction: "120 pilot users", founder: "Maya O. (sample)", img: X + "deal-lumen.jpg", face: X + "founder-lumen.jpg", pitch: X + "pitch-lumen.mp4" },
  { id: "tally", name: "Tally", tagline: "Bookkeeping that runs from a photo of a receipt", sector: "Fintech", stage: "Seed", city: "New York", raising: true, traction: "2,100 businesses on waitlist", founder: "Sample Founder B", img: X + "deal-tally.jpg", face: X + "founder-tally.jpg", pitch: X + "pitch-tally.mp4" },
  { id: "gridline", name: "Gridline", tagline: "Home batteries that sell power back to the grid at peak hours", sector: "Climate", stage: "Seed", city: "Queens", raising: true, traction: "40-home pilot", founder: "Sample Founder C", img: X + "deal-gridline.jpg", face: X + "founder-gridline.jpg" },
  { id: "pulsebox", name: "Pulsebox", tagline: "At-home vitals kit for community clinics", sector: "Health", stage: "Series A", city: "Boston", raising: true, traction: "2 clinic pilots", founder: "Sample Founder E", img: X + "deal-pulsebox.jpg", face: X + "founder-pulsebox.jpg" },
  { id: "parse", name: "Parse", tagline: "AI contract review for teams without a lawyer", sector: "AI", stage: "Pre-seed", city: "San Francisco", raising: false, traction: "300 contracts reviewed", founder: "Sample Founder F", img: X + "deal-parse.jpg", face: X + "founder-parse.jpg" },
];
export const byId = (id: string) => COMPANIES.find((c) => c.id === id);

export type NotifKind = "new_pitch" | "founder_update" | "event_reminder" | "qa_answered" | "new_follower" | "raise_milestone";
export interface Notif { id: string; company?: string; thumb?: string; kind: NotifKind; title: string; body: string; ago: string; day: "Today" | "Yesterday" | "Earlier"; to: string; read?: boolean }

export const NOTIFS: Notif[] = [
  { id: "n1", company: "lumen", thumb: "pitch", kind: "new_pitch", title: "Lumen Labs posted a new pitch", body: "Live demo: captions on the lens in under 300ms.", ago: "12m", day: "Today", to: "company/lumen" },
  { id: "n2", company: "gridline", kind: "raise_milestone", title: "Gridline added sample terms", body: "Read the terms now. Investing opens soon.", ago: "1h", day: "Today", to: "company/gridline" },
  { id: "n3", company: "tally", kind: "qa_answered", title: "Your question was answered", body: "Tally: \u201cDoes it read faded receipts?\u201d", ago: "3h", day: "Today", to: "company/tally" },
  { id: "n4", thumb: "event", kind: "event_reminder", title: "Pitch Night is tomorrow", body: "Doors 6:30 PM. Your pass is ready.", ago: "9h", day: "Today", to: "ticket" },
  { id: "n5", kind: "new_follower", title: "Sample Member J followed you", body: "Angel-curious, NYC.", ago: "1d", day: "Yesterday", to: "me", read: true },
  { id: "n6", company: "pulsebox", kind: "founder_update", title: "Pulsebox shared an update", body: "Pilot with two clinics wrapped.", ago: "1d", day: "Yesterday", to: "company/pulsebox", read: true },
  { id: "n7", company: "lumen", kind: "founder_update", title: "Lumen Labs shared an update", body: "Hiring a founding engineer.", ago: "4d", day: "Earlier", to: "company/lumen", read: true },
];

export const KIND_LABEL: Record<NotifKind, string> = {
  new_pitch: "New pitches from companies I follow", founder_update: "Founder updates", event_reminder: "Event reminders",
  qa_answered: "My Q&A answered", new_follower: "New followers", raise_milestone: "Investing opens soon updates",
};

export interface Update { id: string; company: string; title: string; body: string; tag: string; ago: string }
export const UPDATES: Update[] = [
  { id: "u1", company: "lumen", title: "Hiring a founding engineer", body: "Looking for someone who has shipped on-device speech models. Sample update.", tag: "Hiring", ago: "4d" },
  { id: "u2", company: "lumen", title: "1,200 on the waitlist", body: "Sample milestone. First 50 beta units ship to testers this winter.", tag: "Milestone", ago: "2w" },
  { id: "u3", company: "pulsebox", title: "Clinic pilot wrapped", body: "Two sample clinics finished a six-week pilot. Writeup coming.", tag: "Product", ago: "1d" },
  { id: "u4", company: "gridline", title: "Utility pilot signed", body: "Sample pilot with 40 homes in Astoria. Install starts in spring.", tag: "Milestone", ago: "3d" },
  { id: "u5", company: "tally", title: "Receipt reader v2", body: "Handles crumpled and faded paper. Sample changelog.", tag: "Product", ago: "6d" },
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
