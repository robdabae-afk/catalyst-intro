// Sample people and conversations for the preview. All names are made up.
export type Msg = { from: "me" | "them"; who?: string; text: string; time: string };
export type Thread = {
  id: string;
  name: string;
  kind: "founder" | "member" | "group";
  sub: string; // small line under the name
  members?: number;
  messages: Msg[];
  unread: boolean;
};

export const THREADS: Thread[] = [
  {
    id: "maya", name: "Maya R.", kind: "founder", sub: "Founder · Stoop Coffee Co.", unread: true,
    messages: [
      { from: "them", text: "Hey! Saw you RSVP'd for pitch night. I'm on the lineup.", time: "6:02 PM" },
      { from: "them", text: "Come say hi after, we'll have cold brew samples.", time: "6:03 PM" },
    ],
  },
  {
    id: "g-pitch", name: "Pitch night · Oct 15", kind: "group", sub: "Event group", members: 48, unread: true,
    messages: [
      { from: "them", who: "Jordan K.", text: "Anyone want to grab food before? Flatiron around 6", time: "4:40 PM" },
      { from: "them", who: "Priya S.", text: "I'm in. There's a dumpling spot on 21st", time: "4:44 PM" },
      { from: "them", who: "Catalyst team", text: "Doors at 6:45. Bring a friend who's never invested before.", time: "5:10 PM" },
    ],
  },
  {
    id: "dev", name: "Dev P.", kind: "member", sub: "Community member", unread: false,
    messages: [
      { from: "them", text: "That climate panel was good. You going to the operators coffee Saturday?", time: "Yesterday" },
      { from: "me", text: "Planning on it", time: "Yesterday" },
      { from: "them", text: "Cool, save me a seat", time: "Yesterday" },
    ],
  },
  {
    id: "g-101", name: "Investor 101 · Oct 20", kind: "group", sub: "Event group", members: 112, unread: false,
    messages: [
      { from: "them", who: "Catalyst team", text: "Slides from last time are pinned. Questions welcome here.", time: "Mon" },
      { from: "them", who: "Sam T.", text: "Is it normal to start with like $100? Feels small", time: "Mon" },
      { from: "them", who: "Alex M.", text: "Totally normal. That's how most people start", time: "Mon" },
    ],
  },
  {
    id: "lena", name: "Lena O.", kind: "founder", sub: "Founder · Gridlight", unread: false,
    messages: [
      { from: "me", text: "Loved your talk at demo day", time: "Sep 28" },
      { from: "them", text: "Thank you! Means a lot. See you at the next one", time: "Sep 28" },
    ],
  },
];

export type QA = { q: string; asker: string; a?: string; founder?: string; when: string; votes: number };
export function sampleQA(name: string, founderRole: string): QA[] {
  return [
    { q: "How long can you run on this raise?", asker: "Jordan K.", when: "2d", votes: 14,
      a: `About 18 months at our current plan. We break down the spend in the "What the money is for" section above.`, founder: `${founderRole}, ${name}` },
    { q: "What happens to my SAFE if you get acquired before a priced round?", asker: "Priya S.", when: "4d", votes: 9,
      a: "You'd get either your money back or the shares your SAFE converts into, whichever is worth more. It's spelled out in the SAFE terms in our filing.", founder: `${founderRole}, ${name}` },
    { q: "Who are your biggest competitors?", asker: "Sam T.", when: "5h", votes: 3 },
  ];
}
