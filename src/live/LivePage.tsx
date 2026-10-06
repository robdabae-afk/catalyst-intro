import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { DEALS } from "./data";
import { useCatalog } from "@/features/catalog";
import { useAdmin } from "./db";
import { DealView, DiscoverView, EventsView, SwipeView } from "./views";
import { AdminView, InboxView, NotificationsView, OnboardingView, PortfolioView, ProfileView, ThreadView } from "./screens";
import "@/brand/brand.css";
import "./live.css";

type Tab = "swipe" | "discover" | "portfolio" | "events" | "profile" | "inbox" | "notifications" | "onboarding" | "admin";
const TABS: [Tab, IconName, string][] = [["swipe", "swipe", "Swipe"], ["discover", "discover", "Discover"], ["portfolio", "holdings", "Portfolio"], ["events", "events", "Events"], ["profile", "profile", "Profile"]];

function useWide() {
  const q = "(min-width: 1100px)";
  const [w, set] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const f = () => set(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return w;
}

export default function LivePage() {
  useCatalog();
  const wide = useWide();
  const admin = !!useAdmin();
  const params = new URLSearchParams(location.search);
  const [tab, setTab] = useState<Tab>((params.get("v") as Tab) || "swipe");
  const [deal, setDeal] = useState<string | null>(params.get("deal"));
  const [deskDeal, setDeskDeal] = useState(DEALS[0]?.id ?? "");
  const [thread, setThread] = useState<string | null>(params.get("thread"));
  const [deskThread, setDeskThread] = useState(DEALS[0]?.id ?? "");

  useEffect(() => { document.title = "Catalyst"; }, []);

  if (wide) {
    return (
      <div className="lv lv-desk">
        <header className="lv-desk-h">
          <div><span className="lv-desk-k">Catalyst</span><h1>Still images, alive.</h1></div>
          <p className="dim">Drag the card to swipe.</p>
        </header>
        <div className="lv-phones">
          <Phone label="Swipe"><SwipeView onOpen={setDeskDeal} /></Phone>
          {deskDeal && <Phone label="Deal"><DealView id={deskDeal} /></Phone>}
          <Phone label="Discover"><DiscoverView onOpen={setDeskDeal} /></Phone>
          <Phone label="Events"><EventsView /></Phone>
          <Phone label="Portfolio"><PortfolioView /></Phone>
          <Phone label="Inbox"><InboxView onOpen={setDeskThread} /></Phone>
          {deskThread && <Phone label="Thread"><ThreadView key={deskThread} id={deskThread} /></Phone>}
          <Phone label="Notifications"><NotificationsView /></Phone>
          <Phone label="Profile"><ProfileView isAdmin={admin} /></Phone>
          <Phone label="Onboarding"><OnboardingView /></Phone>
          <Phone label="Admin"><AdminView /></Phone>
          <Phone label="Match preferences"><DiscoverView onOpen={setDeskDeal} prefsOpen /></Phone>
        </div>
      </div>
    );
  }
  return (
    <div className={`lv lv-mob${!deal && !thread ? (["inbox", "notifications", "admin"].includes(tab) ? " hback" : " hic") : ""}`}>
      {!deal && !thread && ["swipe", "discover", "portfolio", "events", "profile"].includes(tab) && (
        <div className="lv-hicons">
          <button type="button" aria-label="Inbox" onClick={() => setTab("inbox")}><Icon name="inbox" size={19} /></button>
          <button type="button" aria-label="Notifications" onClick={() => setTab("notifications")}><Icon name="bell" size={19} /></button>
        </div>
      )}
      {!deal && !thread && ["inbox", "notifications", "admin"].includes(tab) && (
        <button type="button" className="lv-hback" aria-label="Back" onClick={() => setTab(tab === "admin" ? "profile" : "swipe")}><Icon name="back" size={19} /></button>
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
          {tab === "profile" && <ProfileView isAdmin={admin} onAdmin={() => setTab("admin")} />}
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
      <figcaption className="lv-cap">{label}</figcaption>
      <div className="lv-frame"><div className="lv-notch" /><div className="lv-scr"><div className="lv-scr-in">{children}</div></div></div>
    </figure>
  );
}
