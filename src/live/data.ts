// All figures are SAMPLE data for UI preview. Not real companies or offerings.
export type Hotspot = { x: number; y: number; tag: string; title: string; fact: string };
export type LiveDeal = {
  id: string; name: string; line: string; cat: string; city: string; img: string;
  goal: number; raised: number; investors: number; cap: string; min: string; days: number;
  spark: number[]; hotspots: Hotspot[];
};

export const DEALS: LiveDeal[] = [
  {
    id: "stoop", name: "Stoop Coffee Co", line: "Canned cold brew from a Brooklyn stoop", cat: "Food", city: "Brooklyn, NY",
    img: "/live/deal-stoop.jpg", goal: 250000, raised: 162400, investors: 412, cap: "$6M", min: "$100", days: 18,
    spark: [2, 3, 3, 5, 4, 6, 8, 7, 9, 12, 11, 14],
    hotspots: [
      { x: 66, y: 56, tag: "PRODUCT / 01", title: "The can", fact: "Sample: 12oz nitro cold brew, sold in 40 bodegas." },
      { x: 30, y: 40, tag: "MARKET / 02", title: "Where it sells", fact: "Sample: corner stores first, then campus cafés." },
    ],
  },
  {
    id: "brightyard", name: "Brightyard Farms", line: "Rooftop greens grown 2 miles from you", cat: "Climate", city: "Queens, NY",
    img: "/live/deal-brightyard.jpg", goal: 400000, raised: 118000, investors: 236, cap: "$9M", min: "$150", days: 31,
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
  { id: "e1", title: "Founder Night: Food & Bev", when: "THU 7:00 PM", where: "SoHo, NY", img: "/live/ev-1.jpg", cap: 60, going: 51 },
  { id: "e2", title: "Pitch Room: Climate", when: "TUE 6:30 PM", where: "Flatiron, NY", img: "/live/ev-2.jpg", cap: 40, going: 37 },
];

export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
