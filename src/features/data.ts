export type Sector = "Fintech" | "Climate" | "Hardware" | "Health" | "Consumer" | "AI";
export type Stage = "Pre-seed" | "Seed" | "Series A";

export interface Company {
  id: string; name: string; tagline: string; sector: Sector; stage: Stage; city: string;
  raising: boolean; traction: string; founder: string;
  img: string; face: string; pitch?: string;
}

export type NotifKind = "new_pitch" | "founder_update" | "event_reminder" | "qa_answered" | "new_follower" | "raise_milestone";
export interface Notif { id: string; company?: string; thumb?: string; kind: NotifKind; title: string; body: string; ago: string; day: "Today" | "Yesterday" | "Earlier"; to: string; read?: boolean }

export const KIND_LABEL: Record<NotifKind, string> = {
  new_pitch: "New pitches from companies I follow", founder_update: "Founder updates", event_reminder: "Event reminders",
  qa_answered: "My Q&A answered", new_follower: "New followers", raise_milestone: "Investing opens soon updates",
};

export interface Update { id: string; company: string; title: string; body: string; tag: string; ago: string }
export { COMPANIES, NOTIFS, UPDATES, EVENTS, byId } from "./catalog";
export interface LearnCard { id: string; title: string; body: string; q: string; options: string[]; answer: number; why: string }
export const LEARN: LearnCard[] = [
  { id: "l1", title: "What is Reg CF?", body: "Regulation Crowdfunding lets startups raise money from everyday people, not just accredited investors. Every raise has to run through an SEC-registered funding portal or broker-dealer.", q: "Who runs a Reg CF raise?", options: ["Any website", "A registered funding portal or broker-dealer", "The founder's bank"], answer: 1, why: "Reg CF offerings must go through an SEC-registered intermediary." },
  { id: "l2", title: "There are limits", body: "If your income or net worth is under $124,000, you can invest the greater of $2,500 or 5% of the greater of the two, across all Reg CF deals in 12 months. Accredited investors have no limit.", q: "Limits apply per...", options: ["Deal", "12 months, across all Reg CF deals", "Lifetime"], answer: 1, why: "The cap is a 12-month total across every Reg CF investment." },
  { id: "l3", title: "You can lose it all", body: "Most startups fail. Treat any amount you put in as money you could lose completely.", q: "A good rule of thumb is...", options: ["Invest your emergency fund", "Only invest what you can afford to lose", "Startups are low risk"], answer: 1, why: "Early-stage investing is high risk." },
  { id: "l4", title: "It's illiquid", body: "Reg CF securities generally can't be resold for a year, and there may never be a market to sell them. Plan to hold for many years.", q: "Can you usually sell in the first year?", options: ["Yes, anytime", "Generally no", "Only on weekends"], answer: 1, why: "There's a one-year resale restriction with limited exceptions." },
  { id: "l5", title: "Read the Form C", body: "Every offering files a Form C with the SEC. It covers the business, risks, use of funds and financials. Read it before you commit.", q: "Where do you find a deal's risks and financials?", options: ["The Form C", "The founder's Instagram", "A group chat"], answer: 0, why: "Form C is the required disclosure document." },
];
