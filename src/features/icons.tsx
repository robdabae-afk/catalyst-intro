// Swipe-card icon family: a rounded card outline with a glyph, 1.6 stroke.
import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Card = ({ size, children, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="4.5" y="3" width="15" height="18" rx="3.5" />{children}</svg>
);
export const IHome = (p: P) => <Card {...p}><path d="M8.5 13l3.5-3 3.5 3v3.5h-7z" /></Card>;
export const ISearch = (p: P) => <Card {...p}><circle cx="11.5" cy="11" r="3" /><path d="M13.7 13.2l2.3 2.3" /></Card>;
export const IWatch = (p: P) => <Card {...p}><path d="M7.5 12s1.8-3 4.5-3 4.5 3 4.5 3-1.8 3-4.5 3-4.5-3-4.5-3z" /><circle cx="12" cy="12" r="1" /></Card>;
export const IBell = (p: P) => <Card {...p}><path d="M9 14.5v-2.5a3 3 0 016 0v2.5l1 1H8z" /><path d="M11 17h2" /></Card>;
export const IMe = (p: P) => <Card {...p}><circle cx="12" cy="10" r="2.2" /><path d="M8.5 16.5c.6-1.8 2-2.7 3.5-2.7s2.9.9 3.5 2.7" /></Card>;
export const ITicket = (p: P) => <Card {...p}><path d="M4.5 10h15" strokeDasharray="1.5 2" /><path d="M8 14h4M8 17h7" /></Card>;
export const ILearn = (p: P) => <Card {...p}><path d="M8 9h8M8 12h8M8 15h5" /></Card>;
export const IGift = (p: P) => <Card {...p}><path d="M8 11h8v5.5H8zM12 11v5.5M8 11c0-1.5 4-2.5 4 0 0-2.5 4-1.5 4 0" /></Card>;
export const IPitch = (p: P) => <Card {...p}><path d="M10.5 9.5v5l4-2.5z" /></Card>;
export const IUpdate = (p: P) => <Card {...p}><path d="M8 9h8M8 12h6" /><circle cx="15.5" cy="15.5" r="1.3" /></Card>;
export const ICal = (p: P) => <Card {...p}><path d="M4.5 8h15M9 3v3M15 3v3M9 12h1M14 12h1M9 15.5h1" /></Card>;
export const IQA = (p: P) => <Card {...p}><path d="M8 9.5h8v4.5h-4l-2.5 2v-2H8z" /></Card>;
export const IUserPlus = (p: P) => <Card {...p}><circle cx="11" cy="10" r="1.9" /><path d="M8 16c.5-1.6 1.6-2.4 3-2.4M15 13v4M13 15h4" /></Card>;
export const IUp = (p: P) => <Card {...p}><path d="M8 15.5l3-3 2 2 3-4M14 10.5h2v2" /></Card>;
export const ICheck = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IX = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IBack = ({ size = 20, ...p }: P) => <svg {...base(size)} {...p}><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>;
export const IArrow = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IClock = ({ size = 16, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>;
