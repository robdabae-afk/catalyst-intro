import { useProfileReview } from "@/hooks/useProfileReview";
import { ProfileReviewGate } from "@/components/ProfileReviewGate";
import { isDemoMode } from "@/demo/mode";
import { onWriteError } from "./store";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAppShell } from "@/lib/platform";
import { startSync } from "./sync";
import { catalogStatus, COMPANIES, useCatalog, loadCatalog } from "./catalog";

export const catalogLoading = () => String(typeof catalogStatus === "function" ? (catalogStatus as () => unknown)() : catalogStatus) === "loading";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import Dashboard from "@/pages/Dashboard";
import Matches from "@/pages/Matches";
import { AppFrameContext } from "@/components/AppFrameContext";
import LatestUpdates from "@/pages/LatestUpdates";
import Connections from "@/pages/Connections";
import CoffeeChat from "@/pages/CoffeeChat";
import SafesList from "@/pages/SafesList";
import SafeGenerator from "@/pages/SafeGenerator";
import SafeDetail from "@/pages/SafeDetail";
import CapTable from "@/pages/CapTable";
import FounderAnalytics from "@/pages/FounderAnalytics";
import InvestorMarketPulse from "@/pages/InvestorMarketPulse";
import Investments from "@/pages/Investments";
import Requests from "@/pages/Requests";
import Settings from "@/pages/Settings";
import FilterPreferences from "@/pages/FilterPreferences";
import ReferralDashboard from "@/pages/ReferralDashboard";
import InvestorPortal from "@/pages/InvestorPortal";
import Concierge from "@/pages/Concierge";
import ProfileView from "@/pages/ProfileView";
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

/** Mobile bar fits 5 slots at 390px: 4 primary tabs + More. Every desktop destination stays reachable via More. */
export const MOBILE_PRIMARY = ["Today", "Companies", "People", "Inbox"];

function Tabs({ cls }: { cls: string }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  const [s] = useStore();
  const n = unreadCount(s);
  const items = [
    { to: "", label: "Today", I: "discover" as IconName, end: true },
    { to: "swipe", label: "Companies", I: "swipe" as IconName },
    { to: "people/swipe", label: "People", I: "mutual" as IconName },
    { to: "search", label: "Search", I: "search" as IconName },
    { to: "inbox", label: "Inbox", I: "bell" as IconName, badge: n },
    { to: "me", label: "Me", I: "profile" as IconName },
  ];
  const more = [
    { to: "watchlist", label: "Watchlist", I: "save" as IconName },
    { to: "portfolio", label: "Portfolio", I: "holdings" as IconName },
    { to: "events", label: "Events", I: "events" as IconName },
    { to: "people", label: "Directory", I: "mutual" as IconName },
    { to: "messages", label: "Messages", I: "send" as IconName },
    { to: "/settings", label: "Settings", I: "settings" as IconName },
    { to: "learn", label: "Learn", I: "edu" as IconName },
  ];
  const rest = [...items.filter((i) => !MOBILE_PRIMARY.includes(i.label)), ...more];
  const href = (to: string) => (to.startsWith("/") ? to : `${BASE}/${to}`);
  return (<>
    <nav className={cls} aria-label="Main">
      {cls === "cf-side" && <div className="cf-logo"><i />catalyst</div>}
      {items.filter((i) => cls !== "cf-tabs" || MOBILE_PRIMARY.includes(i.label)).map(({ to, label, I, end, badge }) => (
        <NavLink key={label} to={to.startsWith("/") ? to : `${BASE}/${to}`} end={end} className={({ isActive }) => `cf-tab${isActive ? " on" : ""}`}
          aria-label={badge ? `${label}, ${badge} unread` : label}>
          <Icon name={I} size={22} />{label}{badge ? <span className="cf-badge">{badge}</span> : null}
        </NavLink>
      ))}
      {cls === "cf-tabs" && (() => {
        const under = (h: string) => loc.pathname === h || loc.pathname.startsWith(h + "/");
        const primaryOn = items.some((i) => MOBILE_PRIMARY.includes(i.label) && (i.end ? loc.pathname === href(i.to) || loc.pathname === "/" : under(href(i.to))));
        const moreOn = !primaryOn && rest.some(({ to }) => { const h = href(to); return loc.pathname === h || loc.pathname.startsWith(h + "/"); });
        return (<>
          <button type="button" className={`cf-tab${moreOn || open ? " on" : ""}`} aria-haspopup="true" aria-expanded={open} aria-controls="cf-more-sheet" onClick={() => setOpen((o) => !o)}>
            <Icon name="more" size={22} />More
          </button>
        </>);
      })()}
      {cls === "cf-side" && <div className="cf-more">{more.map(({ to, label, I }) => (
        <NavLink key={label} to={to.startsWith("/") ? to : `${BASE}/${to}`} className={({ isActive }) => `cf-tab${isActive ? " on" : ""}`}><Icon name={I} size={20} />{label}</NavLink>
      ))}</div>}
    </nav>
    {cls === "cf-tabs" && <>
          {open && <div className="cf-sheet-bg" onClick={() => setOpen(false)} aria-hidden="true" />}
          {open && <div id="cf-more-sheet" className="cf-sheet" role="menu" aria-label="More">
            {rest.map(({ to, label, I }) => (
              <NavLink key={label} role="menuitem" to={href(to)} className={({ isActive }) => `cf-sheet-i${isActive ? " on" : ""}`}><Icon name={I} size={20} />{label}</NavLink>
            ))}
          </div>}
    </>}
  </>);
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

/** Old /matches links: same query/hash, new frame route. */
function LegacyAlias({ to }: { to: string }) {
  const loc = useLocation();
  return <Navigate replace to={to + loc.search + loc.hash} />;
}

export default function FeaturesApp() {
  const review = useProfileReview();
  useEffect(() => { if (!review.loading) void loadCatalog(); }, [review.approved, review.loading]);
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
          <AppFrameContext.Provider value={true}>
          <Routes>
            <Route index element={<ProfileReviewGate><Home /></ProfileReviewGate>} />
            <Route path="feed" element={<ProfileReviewGate><Home /></ProfileReviewGate>} />
            <Route path="search" element={<ProfileReviewGate><Search /></ProfileReviewGate>} />
            <Route path="watchlist" element={<ProfileReviewGate><Watchlist /></ProfileReviewGate>} />
            <Route path="inbox" element={<ProfileReviewGate><LiveInbox updates={<Notifications />} /></ProfileReviewGate>} />
            <Route path="me" element={<Me />} />
            <Route path="swipe" element={<ProfileReviewGate><LiveSwipe /></ProfileReviewGate>} />
            <Route path="company/:id" element={<ProfileReviewGate><CompanyRoute /></ProfileReviewGate>} />
            <Route path="inbox/t/:id" element={<ProfileReviewGate><LiveThread /></ProfileReviewGate>} />
            <Route path="portfolio" element={<LivePortfolio />} />
            <Route path="events" element={<LiveEvents />} />
            <Route path="people/swipe" element={<AuthGuard><Dashboard embedded /></AuthGuard>} />
            <Route path="messages" element={<AuthGuard><Matches embedded /></AuthGuard>} />
            <Route path="people" element={<ProfileReviewGate><LivePeople /></ProfileReviewGate>} />
            <Route path="manage" element={<LiveAdmin />} />
            <Route path="invite" element={<Invite />} />
            <Route path="ticket" element={<Ticket />} />
            <Route path="learn" element={<Learn />} />
            <Route path="legal/:doc" element={<Legal />} />
            {/* Legacy member pages, rendered inside this frame; their own navs hide via AppFrameContext. */}
            <Route path="dashboard" element={<Navigate replace to="/people/swipe" />} />
            <Route path="updates" element={<AuthGuard><LatestUpdates /></AuthGuard>} />
            <Route path="matches" element={<LegacyAlias to="/messages" />} />
            <Route path="connections" element={<AuthGuard><Connections /></AuthGuard>} />
            <Route path="coffeechat" element={<AuthGuard><CoffeeChat /></AuthGuard>} />
            <Route path="safes" element={<AuthGuard><SafesList /></AuthGuard>} />
            <Route path="safe" element={<AuthGuard><SafeGenerator /></AuthGuard>} />
            <Route path="safe/:id" element={<AuthGuard><SafeDetail /></AuthGuard>} />
            <Route path="captable" element={<AuthGuard><CapTable /></AuthGuard>} />
            <Route path="founder-analytics" element={<AuthGuard><FounderAnalytics /></AuthGuard>} />
            <Route path="market-pulse" element={<AuthGuard><InvestorMarketPulse /></AuthGuard>} />
            <Route path="investments" element={<AuthGuard><Investments /></AuthGuard>} />
            <Route path="requests" element={<AuthGuard><Requests /></AuthGuard>} />
            <Route path="settings" element={<AuthGuard allowNonAdmin><Settings /></AuthGuard>} />
            <Route path="filters" element={<AuthGuard><FilterPreferences /></AuthGuard>} />
            <Route path="referrals" element={<AuthGuard><ReferralDashboard /></AuthGuard>} />
            <Route path="portal" element={<AuthGuard><InvestorPortal /></AuthGuard>} />
            <Route path="concierge" element={<AuthGuard><Concierge /></AuthGuard>} />
            <Route path="profile/:id" element={<ProfileReviewGate><ProfileView /></ProfileReviewGate>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AppFrameContext.Provider>
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
