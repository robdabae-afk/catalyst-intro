import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { LiveSwipe, LiveCompany, LiveInbox, LiveThread, LivePeople, LiveEvents, LivePortfolio, LiveAdmin, isLiveDeal } from "@/live/embed";
import "./features.css";
import { IBack } from "./icons";
import { Icon, type IconName } from "./bicons";
import { unreadCount, useStore } from "./store";
import Home from "./screens/Home";
import Search from "./screens/Search";
import Watchlist from "./screens/Watchlist";
import Notifications from "./screens/Notifications";
import Me from "./screens/Me";
import Company from "./screens/Company";
import Invite from "./screens/Invite";
import Ticket from "./screens/Ticket";
import Learn from "./screens/Learn";

const BASE = "/app/live";

function Tabs({ cls }: { cls: string }) {
  const [s] = useStore();
  const n = unreadCount(s);
  const items = [
    { to: "", label: "Today", I: "discover" as IconName, end: true },
    { to: "swipe", label: "Swipe", I: "swipe" as IconName },
    { to: "search", label: "Search", I: "search" as IconName },
    { to: "inbox", label: "Inbox", I: "bell" as IconName, badge: n + 2 },
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
      <header className="cf-head"><h1>{title}</h1><div className="row" style={{ gap: 10 }}>{right}<span className="cf-smp">Sample</span></div></header>
    </>
  );
}

export const path = (p: string) => `${BASE}/${p}`;

export default function FeaturesApp() {
  return (
    <div className="cf">
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
            <Route path="admin" element={<LiveAdmin />} />
            <Route path="*" element={<Home />} />
            <Route path="invite" element={<Invite />} />
            <Route path="ticket" element={<Ticket />} />
            <Route path="learn" element={<Learn />} />
          </Routes>
        </main>
        <Tabs cls="cf-tabs" />
      </div>
    </div>
  );
}

function CompanyRoute() {
  const id = location.pathname.split("/").pop() || "";
  return isLiveDeal(id) ? <LiveCompany id={id} /> : <Company />;
}
