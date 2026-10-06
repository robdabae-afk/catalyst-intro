import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import "./features.css";
import { IBell, IHome, IMe, ISearch, IWatch, IBack } from "./icons";
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

const BASE = "/app/x";

function Tabs({ cls }: { cls: string }) {
  const [s] = useStore();
  const n = unreadCount(s);
  const items = [
    { to: "", label: "Home", I: IHome, end: true },
    { to: "search", label: "Search", I: ISearch },
    { to: "watchlist", label: "Watchlist", I: IWatch },
    { to: "inbox", label: "Inbox", I: IBell, badge: n },
    { to: "me", label: "Me", I: IMe },
  ];
  return (
    <nav className={cls} aria-label="Main">
      {cls === "cf-side" && <div className="cf-logo"><i />catalyst</div>}
      {items.map(({ to, label, I, end, badge }) => (
        <NavLink key={label} to={`${BASE}/${to}`} end={end} className={({ isActive }) => `cf-tab${isActive ? " on" : ""}`}
          aria-label={badge ? `${label}, ${badge} unread` : label}>
          <I />{label}{badge ? <span className="cf-badge">{badge}</span> : null}
        </NavLink>
      ))}
      {cls === "cf-side" && <div className="cf-side-foot"><b>Investing opens soon.</b><br /><span className="dim">Portal registration pending. Everything here is sample content.</span></div>}
    </nav>
  );
}

export function Head({ title, right, back }: { title: string; right?: React.ReactNode; back?: boolean }) {
  const nav = useNavigate();
  return (
    <>
      {back && <button className="cf-back" onClick={() => nav(-1)}><IBack size={16} />Back</button>}
      <header className="cf-head"><h1>{title}</h1>{right}</header>
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
            <Route path="inbox" element={<Notifications />} />
            <Route path="me" element={<Me />} />
            <Route path="company/:id" element={<Company />} />
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
