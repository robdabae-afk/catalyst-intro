import type { CSSProperties, ReactNode } from "react";

/*
 * Catalyst icon set. Original drawings, seeded from the swipe tab icon.
 * Grid 24, stroke 1.7, round caps/joins, card radius 2.5.
 * Signature: the "tick" (short detached stroke, like the swipe icon's side bars)
 * plus a -8deg tilt on card-shaped objects. One tick per icon, max.
 */
const T = (x1: number, y1: number, x2: number, y2: number) => <path className="tk" d={`M${x1} ${y1}L${x2} ${y2}`} />;
const tilt = "rotate(-8 12 12)";

export const ICONS = {
  // tabs
  swipe: <><rect x="6" y="3.5" width="12" height="17" rx="2.5" transform={tilt} /><path d="M3 9v8M21 7v8" /></>,
  discover: <><circle cx="11" cy="12" r="7.5" /><path d="M13.6 9.4l-1.5 4.1-4.1 1.5 1.5-4.1z" />{T(20, 3.5, 21.5, 2)}</>,
  holdings: <><rect x="3.5" y="5" width="15" height="15" rx="2.5" transform={tilt} /><path d="M7.5 15l3-3 2.5 2 3.5-4.5" />{T(21, 6, 21, 13)}</>,
  events: <><rect x="3.5" y="5" width="15" height="15" rx="2.5" transform={tilt} /><path d="M4 10.5l14.5-2M7.5 3.5l.4 3M14.5 2.5l.4 3" />{T(21, 9, 21, 16)}</>,
  profile: <><circle cx="11" cy="8.5" r="3.8" /><path d="M3.5 20c1.4-3.8 4.2-5.4 7.5-5.4s6.1 1.6 7.5 5.4" />{T(20.5, 4, 20.5, 9)}</>,
  // nav + actions
  inbox: <><path d="M4 5.5h14.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9l-5 3.5z" /><path d="M8 10h7" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L20.5 20.5" />{T(8, 7.5, 7, 8.8)}</>,
  filter: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  save: <path d="M7 3.5h10a1 1 0 011 1V21l-6-4.2L6 21V4.5a1 1 0 011-1z" />,
  saved: <path d="M7 3.5h10a1 1 0 011 1V21l-6-4.2L6 21V4.5a1 1 0 011-1z" fill="currentColor" />,
  share: <><path d="M12 14.5V3.5M7.5 8l4.5-4.5L16.5 8" /><path d="M5 12.5v6a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5v-6" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  rsvp: <><rect x="3.5" y="5" width="15" height="15" rx="2.5" transform={tilt} /><path d="M4 10.5l14.5-2M8.2 14.6l2.2 2 3.8-4.6" />{T(21, 9, 21, 16)}</>,
  location: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  ticket: <><path d="M3.5 8a1.5 1.5 0 011.5-1.5h14A1.5 1.5 0 0120.5 8v2a2 2 0 000 4v2a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 16v-2a2 2 0 000-4z" /><path d="M14.5 7v1.5M14.5 11.2v1.6M14.5 15.5V17" /></>,
  bell: <><path d="M6 16v-5a6 6 0 0112 0v5l1.8 2H4.2z" /><path d="M10 20.5a2 2 0 004 0" />{T(20, 3.5, 21.5, 5)}</>,
  settings: <><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0" /><path d="M16 5v4M9 10v4M18 15v4" /></>,
  identity: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5.8 15.5c.6-1.3 1.6-2 2.7-2s2.1.7 2.7 2M14 10h4M14 13.5h3" /></>,
  shield: <><path d="M12 3l7.5 2.8V12c0 4.3-3.2 7.8-7.5 9-4.3-1.2-7.5-4.7-7.5-9V5.8z" /><path d="M8.8 12l2.3 2.2 4.1-4.4" /></>,
  bank: <path d="M3.5 9.5L12 4l8.5 5.5M5.5 10v7.5M10 10v7.5M14 10v7.5M18.5 10v7.5M3.5 20h17" />,
  limit: <><path d="M4 18a8 8 0 0116 0" /><path d="M12 18l3.5-5" /><path d="M4 21h16" />{T(19.5, 6.5, 21, 5)}</>,
  upvote: <><path d="M12 19.5V5M6 11l6-6 6 6" /></>,
  send: <><path d="M4 11.5L20 4l-6 16-2.6-6.8z" /><path d="M11.4 13.2L20 4" /></>,
  play: <path d="M8 5l11 7-11 7z" />,
  chart: <path d="M4 19V11M10 19V5M16 19v-6M21 19H3" />,
  pass: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  invest: <><path d="M5 18.5L19 5.5" /><path d="M9.5 5.5H19v9.5" />{T(3.5, 9, 3.5, 13)}</>,
  // admin
  dashboard: <><rect x="3.5" y="3.5" width="7" height="9" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /></>,
  members: <><circle cx="9" cy="8.5" r="3.3" /><path d="M2.8 19.5c1.2-3.3 3.6-4.7 6.2-4.7s5 1.4 6.2 4.7" /><path d="M15.5 5.5a3.2 3.2 0 010 6.2M17.8 14.9c1.6.6 2.7 2 3.4 4.6" /></>,
  deals: <><rect x="6" y="3.5" width="12" height="17" rx="2.5" transform={tilt} /><path d="M9.3 9.2l5.4-.8M9.8 12.8l4-.6" /></>,
  qa: <><path d="M4 5.5h14.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9l-5 3.5z" /><path d="M9.8 9a2.2 2.2 0 114 1.3c-.7.6-1.6.9-1.6 1.9" /><path d="M12.2 14.2v.1" /></>,
  announce: <><path d="M4 10v4h3l7 4.5v-13L7 10z" /><path d="M17.5 9.5a3.5 3.5 0 010 5" />{T(20.5, 7, 21.5, 6)}</>,
  export: <><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5" /><path d="M5 17.5V19a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19v-1.5" /></>,
  edit: <><path d="M15.5 4.5l4 4L9 19H5v-4z" /><path d="M13 7l4 4" /></>,
  delete: <><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12a1.5 1.5 0 001.5 1.4h6.2a1.5 1.5 0 001.5-1.4l.9-12" /><path d="M10 11v6M14 11v6" /></>,
  publish: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.3l2.4 2.3 4.6-5" /></>,
  draft: <><circle cx="12" cy="12" r="8.5" strokeDasharray="2.6 2.6" /><path d="M12 8v4l2.5 1.5" /></>,
  waitlist: <><path d="M4 6h11M4 12h11M4 18h7" /><path d="M18 14v6M15 17h6" /></>,
  // categories
  // discover / match (same card + tick grammar as swipe)
  match: <><rect x="5" y="3.5" width="12" height="17" rx="2.5" transform={tilt} /><path d="M8.3 12.3l2.2 2.2 4.2-4.6" />{T(21, 8, 21, 15)}</>,
  pitch: <><rect x="5" y="3.5" width="12" height="17" rx="2.5" transform={tilt} /><path d="M10 9.2v5.6l4.6-2.8z" />{T(21, 8, 21, 15)}</>,
  mutual: <><circle cx="8.5" cy="9" r="3.2" /><circle cx="15.5" cy="9" r="3.2" /><path d="M2.5 19.5c1.1-3 3.3-4.3 6-4.3M21.5 19.5c-1.1-3-3.3-4.3-6-4.3M10 18.8c.6-1.6 1.6-2.6 2-2.6s1.4 1 2 2.6" /></>,
  traction: <><path d="M3.5 18.5l5-5 3.5 3 7.5-8" /><path d="M15 8.5h4.5V13" />{T(3.5, 4, 3.5, 9)}</>,
  sliders: <><rect x="4" y="3.5" width="14" height="17" rx="2.5" transform={tilt} /><path d="M8 9h7M8 15h7" /><circle cx="10" cy="9" r="1.4" fill="currentColor" /><circle cx="13.5" cy="15" r="1.4" fill="currentColor" />{T(21.5, 8, 21.5, 15)}</>,
  stage: <><path d="M4 19.5h4v-5H4zM10 19.5h4V10h-4zM16 19.5h4V4.5h-4z" /></>,
  fintech: <><rect x="3.5" y="6" width="15" height="11" rx="2.5" transform={tilt} /><path d="M6.5 10.5l11-1.5M8 14.5l3-.4" />{T(21, 9, 21, 16)}</>,
  food: <><path d="M4 11h16a8 8 0 01-16 0z" /><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></>,
  health: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  climate: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3L7 7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7" /></>,
  software: <><rect x="3" y="5" width="18" height="12" rx="2.5" /><path d="M8 21h8M9 9l-2 2 2 2M15 9l2 2-2 2" /></>,
  edu: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, label, style, className = "" }: { name: IconName; size?: number; label?: string; style?: CSSProperties; className?: string }) {
  return (
    <svg className={`i ci ${className}`} width={size} height={size} viewBox="0 0 24 24" style={style}
      fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {ICONS[name]}
    </svg>
  );
}
