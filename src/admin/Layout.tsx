import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, errText, isSample, useP, useSession } from "@/lib/platform/client";
import { resetSample, setSampleRole } from "@/lib/platform/sample";
import "./admin.css";

const NAV: [string, string, keyof Counts | null][] = [
  ["/admin", "Dashboard", null], ["/admin/events", "Events", "eventsUpcoming"], ["/admin/deals", "Deals", "dealsPreview"],
  ["/admin/questions", "Q&A", "questionsOpen"], ["/admin/members", "Members", "members"], ["/admin/announcements", "Announcements", null],
  ["/admin/waitlist", "Waitlist", "waitlist"], ["/admin/settings", "Settings", null],
];
type Counts = { eventsUpcoming: number; dealsPreview: number; questionsOpen: number; members: number; waitlist: number };

export function useTitle(t: string) {
  useEffect(() => {
    document.title = `${t} · Catalyst admin`;
    let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!m) { m = document.createElement("meta"); m.name = "robots"; document.head.appendChild(m); }
    m.content = "noindex,nofollow";
  }, [t]);
}

export function SampleBanner() {
  if (!isSample) return null;
  return (
    <div className="ad-banner" role="status">
      <b>DEMO</b><span>Local sample data on this device only. Not connected to the live backend. Nothing is sent or published.</span>
      <button onClick={() => { if (confirm("Reset sample data on this device?")) resetSample(); }}>Reset sample</button>
    </div>
  );
}

export function Head({ k, title, children }: { k?: string; title: string; children?: ReactNode }) {
  useTitle(title);
  return <div className="ad-head"><div>{k && <span className="lbl">{k}</span>}<h1>{title}</h1></div>{children && <div className="ad-row">{children}</div>}</div>;
}

export function Err({ e }: { e: unknown }) { return <div className="err" role="alert"><span>{errText(e)}</span></div>; }
export function Loading({ rows = 5 }: { rows?: number }) { return <div style={{ display: "grid", gap: 14, padding: "14px 0" }}>{Array.from({ length: rows }, (_, i) => <div key={i} className="skel" style={{ width: `${90 - i * 9}%` }} />)}</div>; }

let toastSet: ((s: string | null) => void) | null = null;
export const toast = (s: string) => toastSet?.(s);
function Toaster() {
  const [t, set] = useState<string | null>(null);
  useEffect(() => { toastSet = set; return () => { toastSet = null; }; }, []);
  useEffect(() => { if (t) { const h = setTimeout(() => set(null), 2400); return () => clearTimeout(h); } }, [t]);
  return t ? <div className="toast" role="status">{t}</div> : null;
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Gate({ children }: { children: ReactNode }) {
  const { loading, session } = useSession();
  const nav = useNavigate();
  useTitle("Admin");
  if (loading) return <div className="ad" style={{ display: "block" }}><div className="ad-body"><Loading /></div></div>;
  if (session?.role === "admin") return <>{children}</>;
  return (
    <div className="ad" style={{ display: "block" }}>
      <SampleBanner />
      <div style={{ maxWidth: 440, margin: "12vh auto", padding: "0 20px" }} className="fade">
        <div className="ad-logo" style={{ padding: 0, marginBottom: 28 }}>catalyst<i /><small>admin</small></div>
        <h1 style={{ fontSize: 30, letterSpacing: "-.035em", margin: "0 0 10px" }}>{session ? "Admins only" : "Sign in to admin"}</h1>
        <p className="note" style={{ fontSize: 14, marginBottom: 24 }}>
          {session ? `${session.email} doesn't have the admin role. Ask an existing admin to grant it in Members.` : "Use your Catalyst account. Admin access is set per account by an existing admin."}
        </p>
        <div className="ad-row">
          {!isSample && <Link className="b k" to="/app/login?next=/admin">{session ? "Switch account" : "Sign in"}</Link>}
          {isSample && (
            <button className="b k" onClick={() => { setSampleRole("admin"); nav("/admin"); }}>Open local sample admin</button>
          )}
        </div>
        {isSample && <p className="note" style={{ marginTop: 14 }}>Local sample only. This switch exists only when the live backend is off and never grants access to real data.</p>}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const stats = useP(["adminStats"], () => api.adminStats());
  const { session } = useSession();
  const c = stats.data as Counts | undefined;
  const links = (cls: string) => NAV.map(([to, label, key]) => (
    <NavLink key={to} to={to} end={to === "/admin"} className={({ isActive }) => (isActive ? "on" : "") + cls}>
      <span>{label}</span>{key && c && <span className="num">{c[key]}</span>}
    </NavLink>
  ));
  return (
    <Gate>
      <div className="ad">
        <aside className="ad-side">
          <Link to="/admin" className="ad-logo">catalyst<i /><small>admin</small></Link>
          <nav className="ad-nav" aria-label="Admin">{links("")}</nav>
          <div className="foot">
            <span className="mono" style={{ fontSize: 11 }}>{session?.email}</span>
            <div className="ad-row"><Link className="lnk" to="/app/discover">Member app</Link><button className="lnk" onClick={() => api.signOut()}>Sign out</button></div>
          </div>
        </aside>
        <main className="ad-main">
          <div className="mtop"><Link to="/admin" className="ad-logo" style={{ padding: 0 }}>catalyst<i /><small>admin</small></Link><button className="lnk" onClick={() => api.signOut()}>Sign out</button></div>
          <SampleBanner />
          <nav className="mtabs" aria-label="Admin sections">{links("")}</nav>
          <Outlet />
        </main>
        <Toaster />
      </div>
    </Gate>
  );
}
