import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { DEALS } from "./data";
import { DealView, DiscoverView, EventsView, SwipeView } from "./views";
import { AdminView, InboxView, NotificationsView, OnboardingView, PortfolioView, ProfileView, ThreadView } from "./screens";
import "@/brand/brand.css";
import "./live.css";

type Tab = "swipe" | "discover" | "portfolio" | "events" | "profile" | "inbox" | "notifications" | "onboarding" | "admin";
const TABS: [Tab, IconName, string][] = [["swipe", "swipe", "Swipe"], ["discover", "discover", "Discover"], ["portfolio", "holdings", "Portfolio"], ["events", "events", "Events"], ["profile", "profile", "Profile"]];
const EXTRA: [Tab, IconName, string][] = [["inbox", "inbox", "Inbox"], ["notifications", "bell", "Alerts"], ["onboarding", "identity", "Onboarding"], ["admin", "dashboard", "Admin"]];

function useWide() {
  const q = "(min-width: 1100px)";
  const [w, set] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => set(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return w;
}

export default function LivePage() {
  const wide = useWide();
  const params = new URLSearchParams(location.search);
  const [tab, setTab] = useState<Tab>((params.get("v") as Tab) || "swipe");
  const [deal, setDeal] = useState<string | null>(params.get("deal"));
  const [deskDeal, setDeskDeal] = useState(DEALS[0].id);
  const [thread, setThread] = useState<string | null>(params.get("thread"));
  const [deskThread, setDeskThread] = useState("t1");

  useEffect(() => { document.title = "Catalyst · Live UI (sample)"; }, []);

  if (wide) {
    return (
      <div className="lv lv-desk">
        <header className="lv-desk-h">
          <div><span className="lv-mono">CATALYST / LIVE UI</span><h1>Still images, alive.</h1></div>
          <p className="lv-mono dim">ALL DEALS + NUMBERS ARE SAMPLE · MOVE YOUR POINTER · DRAG THE CARD · TAP ◎</p>
        </header>
        <div className="lv-phones">
          <Phone label="01 · SWIPE"><SwipeView onOpen={setDeskDeal} /></Phone>
          <Phone label="02 · DEAL"><DealView id={deskDeal} /></Phone>
          <Phone label="03 · DISCOVER"><DiscoverView onOpen={setDeskDeal} /></Phone>
          <Phone label="04 · EVENTS"><EventsView /></Phone>
          <Phone label="05 · PORTFOLIO"><PortfolioView /></Phone>
          <Phone label="06 · INBOX"><InboxView onOpen={setDeskThread} /></Phone>
          <Phone label="07 · THREAD"><ThreadView key={deskThread} id={deskThread} /></Phone>
          <Phone label="08 · NOTIFICATIONS"><NotificationsView /></Phone>
          <Phone label="09 · PROFILE"><ProfileView /></Phone>
          <Phone label="10 · ONBOARDING"><OnboardingView /></Phone>
          <Phone label="11 · ADMIN"><AdminView /></Phone>
          <Phone label="12 · COMPANY PROFILE"><DiscoverView onOpen={setDeskDeal} initial={{ kind: "co", id: "lumen" }} /></Phone>
          <Phone label="13 · PERSON PROFILE"><DiscoverView onOpen={setDeskDeal} initial={{ kind: "person", id: "p-lee" }} /></Phone>
          <Phone label="14 · MATCH PREFERENCES"><DiscoverView onOpen={setDeskDeal} prefsOpen /></Phone>
        </div>
      </div>
    );
  }
  return (
    <div className="lv lv-mob">
      {!deal && !thread && (
        <div className="lv-extra" role="toolbar" aria-label="More screens">
          {EXTRA.map(([t, ic, l]) => <button key={t} type="button" aria-pressed={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}><Icon name={ic} size={16} /><span>{l}</span></button>)}
        </div>
      )}
      {deal ? (
        <div className="lv-screen"><DealView id={deal} onBack={() => setDeal(null)} /></div>
      ) : thread ? (
        <div className="lv-screen"><ThreadView id={thread} onBack={() => setThread(null)} /></div>
      ) : (
        <div className="lv-screen">
          {tab === "swipe" && <SwipeView onOpen={setDeal} />}
          {tab === "discover" && <DiscoverView onOpen={setDeal} />}
          {tab === "events" && <EventsView />}
          {tab === "portfolio" && <PortfolioView />}
          {tab === "profile" && <ProfileView />}
          {tab === "inbox" && <InboxView onOpen={setThread} />}
          {tab === "notifications" && <NotificationsView />}
          {tab === "onboarding" && <OnboardingView />}
          {tab === "admin" && <AdminView />}
        </div>
      )}
      {!deal && !thread && (
        <nav className="lv-tabs" aria-label="Sections">
          {TABS.map(([t, ic, l]) => (
            <button key={t} type="button" aria-current={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}><span key={tab === t ? "on" : "off"} className="lv-tabic"><Icon name={ic} size={22} /></span><i className="lv-tabbar" aria-hidden /><span>{l}</span></button>
          ))}
        </nav>
      )}
    </div>
  );
}

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="lv-phone">
      <figcaption className="lv-mono dim">{label}</figcaption>
      <div className="lv-frame"><div className="lv-notch" /><div className="lv-scr"><div className="lv-scr-in">{children}</div></div></div>
    </figure>
  );
}
