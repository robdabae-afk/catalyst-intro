import { isDemoMode } from "@/demo/mode";
import { onWriteError } from "./store";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAppShell } from "@/lib/platform";
import { startSync } from "./sync";
import { catalogStatus, COMPANIES, useCatalog } from "./catalog";

export const catalogLoading = () => String(typeof catalogStatus === "function" ? (catalogStatus as () => unknown)() : catalogStatus) === "loading";
import { useEffect, useState } from "react";
import { LiveSwipe, LiveCompany, LiveInbox, LiveThread, LivePeople, LiveEvents, LivePortfolio, LiveAdmin } from "@/live/embed";
import "./features.css";
import { IBack } from "./icons";
import { Icon, type IconName } from "./bicons";
import { unreadCount, useStore } from "./store";
import Home from "./screens/Home";
import Search from "./screens/Search";
import Watchlist from "./screens/Watchlist";
import Notifications from "./screens/Notifications";
import Me from "./screens/Me";
import Invite from "./screens/Invite";
import Ticket from "./screens/Ticket";
import Learn from "./screens/Learn";
import Onboarding from "./screens/Onboarding";
import Legal from "./screens/Legal";

const BASE = "";

function Tabs({ cls }: { cls: string }) {
  const [s] = useStore();
  const n = unreadCount(s);
  const items = [
    { to: "", label: "Today", I: "discover" as IconName, end: true },
    { to: "swipe", label: "Swipe", I: "swipe" as IconName },
    { to: "search", label: "Search", I: "search" as IconName },
    { to: "inbox", label: "Inbox", I: "bell" as IconName, badge: n },
    { to: "me", label: "Me", I: "profile" as IconName },
  ];
  const more = [
    { to: "watchlist", label: "Watchlist", I: "save" as IconName },
    { to: "portfolio", label: "Portfolio", I: "holdings" as IconName },
    { to: "events", label: "Events", I: "events" as IconName },
    { to: "people", label: "People", I: "mutual" as IconName },
    { to: "learn", label: "Learn", I: "edu" as IconName },
  ];
  return (
    <nav className={cls} aria-label="Main">
      {cls === "cf-side" && <div className="cf-logo"><i />catalyst</div>}
      {items.map(({ to, label, I, end, badge }) => (
        <NavLink key={label} to={`${BASE}/${to}`} end={end} className={({ isActive }) => `cf-tab${isActive ? " on" : ""}`}
          aria-label={badge ? `${label}, ${badge} unread` : label}>
          <Icon name={I} size={22} />{label}{badge ? <span className="cf-badge">{badge}</span> : null}
        </NavLink>
      ))}
      {cls === "cf-side" && <div className="cf-more">{more.map(({ to, label, I }) => (
        <NavLink key={label} to={`${BASE}/${to}`} className={({ isActive }) => `cf-tab${isActive ? " on" : ""}`}><Icon name={I} size={20} />{label}</NavLink>
      ))}</div>}
    </nav>
  );
}

export function Head({ title, right, back }: { title: string; right?: React.ReactNode; back?: boolean }) {
  const nav = useNavigate();
  return (
    <>
      {back && <button className="cf-back" onClick={() => nav(-1)}><IBack size={16} />Back</button>}
      <header className="cf-head"><h1>{title}</h1><div className="row" style={{ gap: 10 }}>{right}</div></header>
    </>
  );
}

export const path = (p: string) => `${BASE}/${p}`.replace(/\/+$/, "") || "/";

function WriteError() {
  const [m, setM] = useState<string | null>(null);
  useEffect(() => onWriteError((x) => { setM(x); window.setTimeout(() => setM(null), 3500); }), []);
  return m ? <div role="alert" style={{ position: "fixed", left: "50%", bottom: 88, transform: "translateX(-50%)", zIndex: 1000, background: "#111", color: "#fff", border: "1px solid #444", borderRadius: 12, padding: "10px 16px", fontSize: 14 }}>{m}</div> : null;
}

export default function FeaturesApp() {
  useEffect(() => { startSync(); }, []);
  useCatalog();
  const [st] = useStore();
  const loc = useLocation();
  if (loc.pathname.replace(/\/$/, "") === "/welcome") return <div className="cf cf-ob"><Onboarding /></div>;
  if (isAppShell() && !st.onboarded && !loc.pathname.startsWith("/legal")) return <Navigate to="/welcome" replace />;
  return (
    <div className="cf">
      <WriteError />
      {isDemoMode() && <div style={{ position: "fixed", top: 8, right: 8, zIndex: 1000, font: "600 11px/1 ui-monospace,monospace", letterSpacing: ".08em", background: "#fff", color: "#000", padding: "6px 8px", borderRadius: 6 }}>DEMO · SAMPLE DATA</div>}
      <div className="cf-shell">
        <Tabs cls="cf-side" />
        <main className="cf-main">
          <Routes>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="inbox" element={<LiveInbox updates={<Notifications />} />} />
            <Route path="me" element={<Me />} />
            <Route path="swipe" element={<LiveSwipe />} />
            <Route path="company/:id" element={<CompanyRoute />} />
            <Route path="inbox/t/:id" element={<LiveThread />} />
            <Route path="portfolio" element={<LivePortfolio />} />
            <Route path="events" element={<LiveEvents />} />
            <Route path="people" element={<LivePeople />} />
            <Route path="manage" element={<LiveAdmin />} />
            <Route path="invite" element={<Invite />} />
            <Route path="ticket" element={<Ticket />} />
            <Route path="learn" element={<Learn />} />
            <Route path="legal/:doc" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Tabs cls="cf-tabs" />
      </div>
    </div>
  );
}

function CompanyRoute() {
  const { id = "" } = useParams();
  useCatalog();
  if (!COMPANIES.some((c) => c.id === id)) return catalogLoading() ? <p className="dim" style={{ padding: 24 }}>Loading…</p> : <NotFound />;
  return <LiveCompany id={id} />;
}

function NotFound() {
  return <div><Head title="Not found" back /><p className="dim">This page doesn't exist or the company is no longer listed.</p></div>;
}
