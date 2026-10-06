import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@/brand/brand.css";
import "./live.css";
import { DEALS } from "./data";
import { COMPANIES } from "./company";
import { CompanyDetail } from "./detail";
import { PitchPlayer } from "./pitch";
import { ProfileSheet, type ProfRef } from "./profiles";
import { DiscoverView, EventsView, SwipeView } from "./views";
import { AdminView, InboxView, PortfolioView, ThreadView } from "./screens";

/* Live (sample) screens mounted inside the unified Catalyst shell at /app/live. */
const BASE = "/app/live";

function Frame({ children, full }: { children: ReactNode; full?: boolean }) {
  return <div className={`lv lv-mob lv-embed${full ? " full" : ""}`}><div className="lv-screen">{children}</div></div>;
}

export const isLiveDeal = (id: string) => !!COMPANIES[id];

export function LiveSwipe() {
  const nav = useNavigate();
  return <Frame full><SwipeView onOpen={(id) => nav(`${BASE}/company/${id}`)} /></Frame>;
}

export function LiveCompany({ id }: { id: string }) {
  const nav = useNavigate();
  const [pitch, setPitch] = useState<string | null>(null);
  const [prof, setProf] = useState<ProfRef | null>(null);
  const back = () => (window.history.length > 1 ? nav(-1) : nav(BASE));
  return (
    <div className="lv lv-embed-co">
      <CompanyDetail id={id} onClose={back} onProfile={setProf} onPitch={setPitch} />
      {pitch && <PitchPlayer id={pitch} ids={DEALS.map((d) => d.id)} onClose={() => setPitch(null)} onNext={setPitch} onProfile={setProf}
        onSave={() => setPitch(null)} onPass={() => setPitch(null)} />}
      {prof && <ProfileSheet r={prof} onClose={() => setProf(null)} onOpen={setProf} toast={() => {}} />}
    </div>
  );
}

export function LiveInbox({ updates }: { updates: ReactNode }) {
  const nav = useNavigate();
  const [tab, setTab] = useState<"updates" | "messages">(() => (new URLSearchParams(location.search).get("t") === "messages" ? "messages" : "updates"));
  return (
    <div>
      <div className="cf-seg" role="tablist" aria-label="Inbox">
        <button role="tab" aria-selected={tab === "updates"} className={tab === "updates" ? "on" : ""} onClick={() => setTab("updates")}>Updates</button>
        <button role="tab" aria-selected={tab === "messages"} className={tab === "messages" ? "on" : ""} onClick={() => setTab("messages")}>Messages</button>
      </div>
      {tab === "updates" ? updates : <Frame><InboxView onOpen={(id) => nav(`${BASE}/inbox/t/${id}`)} /></Frame>}
    </div>
  );
}

export function LiveThread() {
  const { id = "t1" } = useParams();
  const nav = useNavigate();
  return <Frame full><ThreadView id={id} onBack={() => nav(`${BASE}/inbox?t=messages`)} /></Frame>;
}

export function LivePeople() {
  const nav = useNavigate();
  return <Frame><DiscoverView onOpen={(id) => nav(`${BASE}/company/${id}`)} /></Frame>;
}
export const LiveEvents = () => <Frame><EventsView /></Frame>;
export const LivePortfolio = () => <Frame><PortfolioView /></Frame>;
export function LiveAdmin() {
  const ok = new URLSearchParams(location.search).get("role") === "admin" || sessionStorage.getItem("cat-role") === "admin";
  if (ok) sessionStorage.setItem("cat-role", "admin");
  return ok ? <Frame><AdminView /></Frame> : <p className="dim" style={{ padding: 24 }}>Admin only.</p>;
}
