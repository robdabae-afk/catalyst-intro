import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon } from "@/brand/icons";
import "@/brand/brand.css";
import "./live.css";
import { COMPANIES as CATALOG, DEALS, useCatalog } from "@/features/catalog";
import { requireAccount } from "@/features/sync";
import { supabase } from "@/integrations/supabase/client";
import { CompanyDetail } from "./detail";
import { PitchPlayer } from "./pitch";
import { setState } from "@/features/store";
import { ProfileSheet, type ProfRef } from "./profiles";
import { DiscoverView, EventsView, SwipeView } from "./views";
import { AdminView, InboxView, PortfolioView, ThreadView } from "./screens";

/* Production screens mounted inside the Catalyst app shell at the site root. */
const BASE = "";

function Frame({ children, full }: { children: ReactNode; full?: boolean }) {
  return <div className={`lv lv-mob lv-embed${full ? " full" : ""}`}><div className="lv-screen">{children}</div></div>;
}

export const isLiveDeal = (id: string) => CATALOG.some((c) => c.id === id);

export function LiveSwipe() {
  useCatalog();
  const nav = useNavigate();
  return <Frame full><SwipeView onOpen={(id) => nav(`${BASE}/company/${id}`)} topRight={<Link to={`${BASE}/watchlist`} className="lv-topic" aria-label="Watchlist"><Icon name="saved" size={18} /></Link>} /></Frame>;
}

export function LiveCompany({ id }: { id: string }) {
  useCatalog();
  const nav = useNavigate();
  const [pitch, setPitch] = useState<string | null>(null);
  const [prof, setProf] = useState<ProfRef | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toast = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 2200); };
  const name = (d: string) => DEALS.find((x) => x.id === d)?.name ?? "Company";
  const save = (d: string) => { if (!requireAccount()) return; setState((st) => ({ ...st, watch: { ...st.watch, [d]: st.watch[d] ?? { raise: true, closing: true, update: true } } })); setPitch(null); toast(`${name(d)} added to watchlist`); };
  const pass = (d: string) => { const ids = DEALS.map((x) => x.id); const nx = ids[(ids.indexOf(d) + 1) % ids.length]; toast(`Passed on ${name(d)}`); setPitch(nx === d ? null : nx); };
  const back = () => (window.history.length > 1 ? nav(-1) : nav("/"));
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
  const [sp, setSp] = useSearchParams();
  const tab: "updates" | "messages" = sp.get("t") === "messages" ? "messages" : "updates";
  const setTab = (t: "updates" | "messages") => setSp(t === "messages" ? { t: "messages" } : {});
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
  const { id = "" } = useParams();
  useCatalog();
  const nav = useNavigate();
  return <Frame full><ThreadView id={id} onBack={() => nav(`${BASE}/inbox?t=messages`)} /></Frame>;
}

export function LivePeople() {
  useCatalog();
  const nav = useNavigate();
  return <Frame><DiscoverView onOpen={(id) => nav(`${BASE}/company/${id}`)} /></Frame>;
}
export function LiveEvents() { useCatalog(); return <Frame><EventsView /></Frame>; }
export function LivePortfolio() { useCatalog(); return <Frame><PortfolioView /></Frame>; }
/** Admin = server-side app_is_admin() (same check the RLS policies use). */
export function useIsAdmin() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return live && setOk(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("app_is_admin");
      if (live) setOk(!error && data === true);
    })().catch(() => live && setOk(false));
    return () => { live = false; };
  }, []);
  return ok;
}

export function LiveAdmin() {
  useCatalog();
  const ok = useIsAdmin();
  if (ok === null) return <p className="dim" style={{ padding: 24 }}>Checking access…</p>;
  return ok ? <Frame><AdminView /></Frame> : <p className="dim" style={{ padding: 24 }}>Admin only.</p>;
}
