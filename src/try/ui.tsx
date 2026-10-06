import { useTry } from "./store";
import { THREADS } from "./threads";
import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Deal } from "./data";
import "./try.css";

export const I = {
  inbox: <><path d="M4 5h16v11H9l-5 4z" /></>,
  send: <path d="M4 12l16-8-6 16-2-7z" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />,
  bank: <path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />,
  swipe: <><rect x="6" y="3.5" width="12" height="17" rx="2.5" transform="rotate(-8 12 12)" /><path d="M3 9v8M21 7v8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></>,
  chart: <path d="M4 19V11M10 19V5M16 19v-6M22 19H2" />,
  cal: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  user: <><circle cx="12" cy="8.5" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  mark: <path d="M6 4h12v17l-6-4-6 4z" />,
  back: <path d="M15 5l-7 7 7 7" />,
  bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 20a2 2 0 004 0" /></>,
  share: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  play: <path d="M8 5l11 7-11 7z" />,
  food: <><path d="M4 11h16a8 8 0 01-16 0z" /><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></>,
  health: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
  climate: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  software: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M9 9l-2 2 2 2M15 9l2 2-2 2" /></>,
  edu: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};
export const Ic = ({ d, size = 22, style }: { d: ReactNode; size?: number; style?: React.CSSProperties }) => (
  <svg className="i" width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>{d}</svg>
);

export function useNoindex(title: string) {
  useEffect(() => {
    document.title = `${title} · Catalyst preview`;
    let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !m;
    const prev = m?.content;
    if (!m) { m = document.createElement("meta"); m.name = "robots"; document.head.appendChild(m); }
    m.content = "noindex, nofollow";
    return () => { if (created) m?.remove(); else if (m && prev !== undefined) m.content = prev; };
  }, [title]);
}

export const Logo = () => <div className="logo">catalyst<i /></div>;

export const Art = ({ deal, className = "", style, label = true }: { deal: Deal; className?: string; style?: React.CSSProperties; label?: boolean }) => (
  <div className={`ph ph-${deal.art} ${label ? "" : "nl"} ${className}`} style={style} role="img" aria-label="Sample image" />
);

export const Mark = ({ deal, size = 44 }: { deal: Deal; size?: number }) => (
  <div className="mono-lg" style={{ width: size, height: size, fontSize: size * 0.4 }}>{deal.name[0]}</div>
);

const TABS = [
  { to: "/try/swipe", label: "Swipe", d: I.swipe },
  { to: "/try/discover", label: "Discover", d: I.search },
  { to: "/try/portfolio", label: "Portfolio", d: I.chart },
  { to: "/try/events", label: "Events", d: I.cal },
  { to: "/try/profile", label: "Profile", d: I.user },
];

export function Shell({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  useNoindex(title);
  const { pathname } = useLocation();
  return (
    <div className="cx">
      <div className="shell">
        <nav className="rail" aria-label="Main">
          <Logo />
          {TABS.map((t) => (
            <Link key={t.to} to={t.to} className={pathname.startsWith(t.to) ? "on" : ""}><Ic d={t.d} />{t.label}</Link>
          ))}
          <div className="foot">Preview. All companies are samples. Investing isn't open yet.</div>
        </nav>
        <main className="col">
          <header className="top">
            <Logo />
            <h1 className="h1" style={{ fontSize: 28 }} data-desk>{title}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {right}
              <InboxBtn />
            </div>
          </header>
          {children}
        </main>
      </div>
      <nav className="tabbar" aria-label="Tabs">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} className={pathname.startsWith(t.to) ? "on" : ""}><Ic d={t.d} />{t.label}</Link>
        ))}
      </nav>
    </div>
  );
}

export const Progress = ({ deal }: { deal: Deal }) => (
  <div className="bar"><span style={{ width: `${Math.min(100, (deal.raised / deal.goal) * 100)}%` }} /></div>
);

function InboxBtn() {
  const [s] = useTry();
  const unread = THREADS.some((t) => t.unread && !s.readThreads.includes(t.id));
  return (
    <Link to="/try/inbox" className="ic inbox-btn" aria-label={unread ? "Messages, unread" : "Messages"}>
      <Ic d={I.inbox} size={18} />{unread && <i className="dot" />}
    </Link>
  );
}

export function Av({ name, size = 44, group }: { name: string; size?: number; group?: boolean }) {
  return <span className={`lav ${group ? "grp" : ""}`} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>{name[0]}</span>;
}

export function SubTop({ title, back, right }: { title: string; back: string; right?: ReactNode }) {
  return (
    <header className="subtop">
      <Link to={back} className="ic" aria-label="Back"><Ic d={I.back} size={18} /></Link>
      <b>{title}</b>{right ?? <span style={{ width: 40 }} />}
    </header>
  );
}
