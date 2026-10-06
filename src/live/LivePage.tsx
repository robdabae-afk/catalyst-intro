import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { DEALS } from "./data";
import { DealView, DiscoverView, EventsView, SwipeView } from "./views";
import "@/brand/brand.css";
import "./live.css";

type Tab = "swipe" | "discover" | "events";
const TABS: [Tab, IconName, string][] = [["swipe", "swipe", "Swipe"], ["discover", "discover", "Discover"], ["events", "events", "Events"]];

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
        </div>
      </div>
    );
  }
  return (
    <div className="lv lv-mob">
      {deal ? (
        <div className="lv-screen"><DealView id={deal} onBack={() => setDeal(null)} /></div>
      ) : (
        <div className="lv-screen">
          {tab === "swipe" && <SwipeView onOpen={setDeal} />}
          {tab === "discover" && <DiscoverView onOpen={setDeal} />}
          {tab === "events" && <EventsView />}
        </div>
      )}
      {!deal && (
        <nav className="lv-tabs" aria-label="Sections">
          {TABS.map(([t, ic, l]) => (
            <button key={t} type="button" aria-current={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}><Icon name={ic} size={22} /><span>{l}</span></button>
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
      <div className="lv-frame"><div className="lv-notch" /><div className="lv-scr">{children}</div></div>
    </figure>
  );
}
