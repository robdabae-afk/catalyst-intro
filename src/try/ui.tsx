import { useTry } from "./store";
import { api, isSample, useP, useSession } from "@/lib/platform/client";
import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Deal } from "./data";
import "./try.css";
import { ICONS } from "../brand/icons";
import "../brand/brand.css";

// Brand icon set lives in src/brand/icons.tsx; legacy aliases kept so call sites stay stable.
export const I = { ...ICONS, x: ICONS.close, up: ICONS.upvote, mark: ICONS.save, cal: ICONS.events, user: ICONS.profile };
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
  { to: "/app/swipe", label: "Swipe", d: I.swipe },
  { to: "/app/discover", label: "Discover", d: I.discover },
  { to: "/app/holdings", label: "Portfolio", d: I.holdings },
  { to: "/app/events", label: "Events", d: I.cal },
  { to: "/app/profile", label: "Profile", d: I.user },
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
  // Real platform unread state only: no dot when signed out, backend off (sample mode) or on error.
  const { session } = useSession();
  const th = useP(["threads"], () => api.listThreads(), !!session && !isSample);
  const unread = !!session && !isSample && !!th.data?.some((t) => t.unread);
  return (
    <Link to="/app/inbox" className="ic inbox-btn" aria-label={unread ? "Messages, unread" : "Messages"}>
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
