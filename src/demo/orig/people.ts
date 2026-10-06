import type { Person } from "@/live/profiles";
import { DEALS } from "./liveData";
export const PEOPLE: Person[] = [
  { id: "p-maya", name: "Maya O.", initials: "MO", photo: "/live/founder-lumen.jpg", role: "Founder", at: "lumen", city: "Brooklyn", bio: "Sample founder. Ex-AR engineer, building captions for everyone.", backed: [], events: ["e1"], followers: 1240, mutual: 8 },
  { id: "p-dev", name: "Dev K.", initials: "DK", role: "Founder", at: "lumen", city: "Brooklyn", bio: "Sample cofounder. Leads the speech model.", backed: ["tally"], events: ["e1", "e2"], followers: 610, mutual: 3 },
  { id: "p-ana", name: "Ana R.", initials: "AR", photo: "/live/founder-gridline.jpg", role: "Founder", at: "gridline", city: "Queens", bio: "Sample founder. Ex-utility engineer building home batteries.", backed: [], events: ["e2"], followers: 980, mutual: 5 },
  { id: "p-sam", name: "Sam T.", initials: "ST", photo: "/live/founder-tally.jpg", role: "Founder", at: "tally", city: "Manhattan", bio: "Sample founder. Ex-accountant, hates receipts.", backed: ["lumen"], events: ["e1"], followers: 1530, mutual: 11 },
  { id: "p-lee", name: "Lee W.", initials: "LW", role: "Investor", city: "Manhattan", bio: "Sample investor. Backs consumer and climate.", backed: ["lumen", "gridline"], events: ["e1", "e2"], followers: 2200, mutual: 14 },
  { id: "p-jo", name: "Jordan R.", initials: "JR", role: "Member", city: "Brooklyn", bio: "Sample member. First startup check was $100.", backed: ["lumen"], events: ["e1"], followers: 140, mutual: 6 },
];
export const THREADS = [
  { id: "t1", who: "Lumen Labs", d: DEALS[0], last: "Thanks for the question on battery life!", unread: true, t: "2M" },
  { id: "t2", who: "Gridline", d: DEALS[1], last: "Install walkthrough is open to investors.", unread: true, t: "1H" },
  { id: "t3", who: "Tally", d: DEALS[2], last: "We just shipped receipt scanning v2.", unread: false, t: "1D" },
];
