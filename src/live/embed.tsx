import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/brand/icons";
import "@/brand/brand.css";
import "./live.css";
import { DEALS } from "./data";
import { COMPANIES } from "./company";
import { CompanyDetail } from "./detail";
import { PitchPlayer } from "./pitch";
import { setState } from "@/features/store";
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
  return <Frame full><SwipeView onOpen={(id) => nav(`${BASE}/company/${id}`)} topRight={<Link to={`${BASE}/watchlist`} className="lv-topic" aria-label="Watchlist"><Icon name="saved" size={18} /></Link>} /></Frame>;
}

export function LiveCompany({ id }: { id: string }) {
  const nav = useNavigate();
  const [pitch, setPitch] = useState<string | null>(null);
  const [prof, setProf] = useState<ProfRef | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toast = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 2200); };
  const name = (d: string) => DEALS.find((x) => x.id === d)?.name ?? "Company";
  const save = (d: string) => { setState((st) => ({ ...st, watch: { ...st.watch, [d]: st.watch[d] ?? { raise: true, closing: true, update: true } } })); setPitch(null); toast(`${name(d)} added to watchlist · sample`); };
  const pass = (d: string) => { const ids = DEALS.map((x) => x.id); const nx = ids[(ids.indexOf(d) + 1) % ids.length]; toast(`Passed on ${name(d)} · sample`); setPitch(nx === d ? null : nx); };
  const back = () => (window.history.length > 1 ? nav(-1) : nav(BASE));
  return (
    <div className="lv lv-embed-co">
      <CompanyDetail id={id} onClose={back} onProfile={setProf} onPitch={setPitch} />
      {pitch && <PitchPlayer id={pitch} ids={DEALS.map((d) => d.id)} onClose={() => setPitch(null)} onNext={setPitch} onProfile={setProf}
        onSave={save} onPass={pass} />}
      {prof && <ProfileSheet r={prof} onClose={() => setProf(null)} onOpen={setProf} toast={toast} />}
      {msg && <div className="lv-toast" role="status">{msg}</div>}
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
