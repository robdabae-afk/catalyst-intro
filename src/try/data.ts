// All companies below are fictional samples for the product preview.
export type Deal = {
  id: string;
  name: string;
  line: string;
  sector: "Food" | "Health" | "Climate" | "Software" | "Education";
  city: string;
  art: "coffee" | "clinic" | "solar" | "sole" | "grid" | "book";
  min: number;
  cap: string;
  type: string;
  raised: number;
  goal: number;
  daysLeft: number;
  backers: number;
  traction: string[];
  about: string;
  use: string[];
  team: { role: string; note: string }[];
};

export const DEALS: Deal[] = [
  {
    id: "bodega-box", name: "Bodega Box", line: "Late-night groceries in 15 minutes, run by corner stores.",
    sector: "Food", city: "Brooklyn", art: "sole", min: 100, cap: "$6M", type: "SAFE",
    raised: 144000, goal: 300000, daysLeft: 12, backers: 318,
    traction: ["62 partner stores · Sep '26", "$28K monthly orders · Aug '26"],
    about: "Corner stores already stock what people need at midnight. Bodega Box gives them an ordering app and a courier network so they can deliver in 15 minutes without a warehouse.",
    use: ["Courier pay and insurance", "Onboarding 100 more stores", "Two engineers"],
    team: [{ role: "Founder & CEO", note: "Ran operations for a regional delivery app" }, { role: "CTO", note: "Built point-of-sale software for small grocers" }],
  },
  {
    id: "stoop-coffee", name: "Stoop Coffee Co.", line: "Neighborhood coffee carts in every NYC borough.",
    sector: "Food", city: "NYC", art: "coffee", min: 100, cap: "$6M", type: "SAFE",
    raised: 186000, goal: 300000, daysLeft: 18, backers: 412,
    traction: ["$41K monthly sales · Aug '26", "9 carts · Sep '26"],
    about: "Stoop runs small coffee carts on residential blocks, open 6am to 2pm. Low rent, loyal regulars, and a cart pays for itself in about eight months.",
    use: ["12 new carts", "A shared roasting space in Queens", "Hiring cart leads"],
    team: [{ role: "Founder", note: "Ten years in specialty coffee" }, { role: "COO", note: "Former food truck fleet manager" }],
  },
  {
    id: "halo-clinic", name: "Halo Clinic", line: "Walk-in physical therapy for $40 a visit.",
    sector: "Health", city: "Jersey City", art: "clinic", min: 150, cap: "$5M", type: "SAFE",
    raised: 92000, goal: 250000, daysLeft: 9, backers: 201,
    traction: ["1,900 visits · Q3 '26", "2 locations"],
    about: "Most people skip physical therapy because of insurance hassle. Halo charges one flat price, takes walk-ins, and keeps visits to 30 minutes.",
    use: ["Third location", "Booking app", "Clinician hiring"],
    team: [{ role: "Founder", note: "Licensed physical therapist" }, { role: "Ops lead", note: "Opened clinics for an urgent care chain" }],
  },
  {
    id: "gridlight", name: "Gridlight", line: "Rooftop solar for renters, paid monthly.",
    sector: "Climate", city: "Newark", art: "solar", min: 100, cap: "$8M", type: "SAFE",
    raised: 210000, goal: 500000, daysLeft: 24, backers: 377,
    traction: ["14 buildings signed", "640 renter subscribers"],
    about: "Landlords lease their roofs, Gridlight installs panels, and tenants subscribe to cheaper power on their normal bill. No one has to own a house to go solar.",
    use: ["Installs on 20 buildings", "Utility billing integration"],
    team: [{ role: "CEO", note: "Former community solar developer" }, { role: "CTO", note: "Energy software engineer" }],
  },
  {
    id: "ledgerly", name: "Ledgerly", line: "Bookkeeping that runs itself for food trucks and salons.",
    sector: "Software", city: "Philadelphia", art: "grid", min: 100, cap: "$10M", type: "SAFE",
    raised: 58000, goal: 400000, daysLeft: 31, backers: 96,
    traction: ["1,150 paying shops", "$19K MRR · Sep '26"],
    about: "Ledgerly connects to a shop's card reader and bank, sorts every transaction, and sends a one-page summary each week. Tax time becomes a download.",
    use: ["Sales team", "Payroll feature"],
    team: [{ role: "CEO", note: "Grew up working in the family salon" }, { role: "CTO", note: "Former fintech engineer" }],
  },
  {
    id: "night-school", name: "Night School", line: "Evening trade courses taught by working electricians.",
    sector: "Education", city: "Bronx", art: "book", min: 100, cap: "$4M", type: "SAFE",
    raised: 33000, goal: 150000, daysLeft: 27, backers: 74,
    traction: ["3 cohorts done", "81% job placement"],
    about: "Twelve-week evening courses that get adults ready for apprenticeship exams, taught by people who do the work every day.",
    use: ["Second classroom", "Tool library"],
    team: [{ role: "Founder", note: "Master electrician" }, { role: "Programs", note: "Former community college advisor" }],
  },
];

export const SECTORS = ["All", "Food", "Health", "Climate", "Software", "Education"] as const;

export type EventItem = { id: string; title: string; date: string; place: string; photo: string; blurb: string };
// Real Catalyst community photos. Only used in event/community blocks.
export const EVENTS: EventItem[] = [
  { id: "e1", title: "Founder pitch night", date: "Thu · Oct 15 · 7pm", place: "Flatiron, NYC", photo: "/preview/img/S0002.jpg", blurb: "Five founders, five minutes each, open Q&A." },
  { id: "e2", title: "First-time investor 101", date: "Tue · Oct 20 · 6:30pm", place: "SoHo, NYC", photo: "/preview/img/S0003.jpg", blurb: "How startup investing works, in plain English." },
  { id: "e3", title: "Coffee with operators", date: "Sat · Oct 24 · 10am", place: "Williamsburg", photo: "/preview/img/S0009.jpg", blurb: "Small tables, real conversations." },
  { id: "e4", title: "Demo day watch party", date: "Wed · Oct 28 · 7pm", place: "Midtown, NYC", photo: "/preview/img/S0199.jpg", blurb: "Watch, vote, and meet the teams after." },
];
export const COMMUNITY_PHOTO = "/preview/img/S0202.jpg";
export const COMMUNITY_SIZE = "28,000";

export const money = (n: number) =>
  n >= 1000000 ? `$${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** Reg CF 12-month limit estimate (non-accredited). */
export function regCfLimit(income: number, netWorth: number) {
  const LIMIT = 124000;
  const greater = Math.max(income, netWorth);
  if (income >= LIMIT && netWorth >= LIMIT) return Math.min(LIMIT, greater * 0.1);
  return Math.max(2500, greater * 0.05);
}
