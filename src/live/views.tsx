import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useRef, useState, type PointerEvent as RPE } from "react";
import { setState, useStore, watchAdd, watchToggle, toggle } from "@/features/store";

import { Icon } from "@/brand/icons";
import { SaveToggle, Burst } from "./micro";
import { ProfileFeed, ProfileSheet, Toast, type ProfRef } from "./profiles";
import { MatchList, PrefsSheet } from "./match";
import { DEFAULT_PREFS, type Prefs, type LiveDeal, type LiveEvent } from "./data";
import { DEALS, EVENTS, useCatalog } from "@/features/catalog";
import { requireAccount } from "@/features/sync";
import { SwipeAction, RsvpButton, InvestButton, IconButton } from "@/brand/Button";
import { CatIcon, LiveImage, RaiseHud } from "./parts";
import { useInView, useReducedMotion } from "./hooks";

export function Empty({ title, body, icon = "discover", action }: { title: string; body?: string; icon?: Parameters<typeof Icon>[0]["name"]; action?: ReactNode }) {
  return <div className="lv-empty"><Icon name={icon} size={30} /><strong>{title}</strong>{body && <p>{body}</p>}{action}</div>;
}
const catalogNote = (status: string) => status === "loading" ? "Loading companies…" : status === "ready" ? "New companies are reviewed before they go live. Check back soon." : "Listings aren't available right now. Try again later.";

const SignInEmpty = () => <Empty title="Sign in to discover companies" body="Company listings are visible to members." action={<Link to="/auth" className="head-link">Sign in</Link>} />;

const TH = 110;

/* ---------- SWIPE ---------- */
export function SwipeView({ onOpen, topRight }: { onOpen: (id: string) => void; topRight?: ReactNode }) {
  const { status, requiresSignIn } = useCatalog();
  if (!DEALS.length) return (
    <div className="lv-swipe">
      <header className="lv-top"><div className="lv-top-t">Discover</div>{topRight}</header>
      {requiresSignIn ? <SignInEmpty /> : <Empty title={status === "loading" ? "Loading…" : "No companies live yet"} body={catalogNote(status)} />}
    </div>
  );
  return <SwipeDeck onOpen={onOpen} topRight={topRight} />;
}
function SwipeDeck({ onOpen, topRight }: { onOpen: (id: string) => void; topRight?: ReactNode }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [fly, setFly] = useState<0 | 1 | -1>(0);
  const [log, setLog] = useState({ save: 0, pass: 0 });
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const d = DEALS[i % DEALS.length], next = DEALS[(i + 1) % DEALS.length];

  const [burst, setBurst] = useState<{ k: "save" | "pass" | null; n: number }>({ k: null, n: 0 });
  const commit = (dir: 1 | -1) => {
    if (dir > 0 && !requireAccount()) { setDx(0); setDy(0); return; }
    setFly(dir);
    setBurst((b) => ({ k: dir > 0 ? "save" : "pass", n: b.n + 1 }));
    setLog((l) => (dir > 0 ? { ...l, save: l.save + 1 } : { ...l, pass: l.pass + 1 }));
    if (dir > 0) watchAdd(d.id);
    setTimeout(() => { setI((v) => v + 1); setDx(0); setDy(0); setFly(0); }, reduced ? 0 : 320);
  };
  const down = (e: RPE) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: RPE) => { if (start.current) { setDx(e.clientX - start.current.x); setDy((e.clientY - start.current.y) * 0.3); } };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    if (Math.abs(dx) > TH) commit(dx > 0 ? 1 : -1);
    else if (Math.abs(dx) < 4) onOpen(d.id);
    else { setDx(0); setDy(0); }
  };

  const x = fly ? fly * 520 : dx;
  const p = Math.max(-1, Math.min(1, x / TH));
  const dragging = !!start.current;
  return (
    <div className="lv-swipe">
      <header className="lv-top">
        <div className="lv-top-t">Discover</div>
        {topRight}
      </header>
      <div className="lv-deck">
        <article className="lv-card under" key={"u" + i} aria-hidden style={{ transform: `scale(${0.94 + Math.abs(p) * 0.06})` }}>
          <LiveImage src={next.img} intro={false} />
        </article>
        <article
          key={i}
          className={`lv-card top${dragging ? " drag" : ""}${fly ? " fly" : ""}`}
          style={{ transform: `translate(${x}px, ${dy}px) rotate(${x / 18}deg)` }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          aria-label={`${d.name}. Drag right to save, left to pass, tap for details.`}
        >
          <LiveImage src={d.img} hotspots={d.hotspots}>
            <div className="lv-card-hud">
              <div className="lv-card-row"><span className="lv-mono lv-chip"><CatIcon cat={d.cat} /> {(d.cat || "STARTUP").toUpperCase()}</span></div>
              <div className="lv-drag lv-mono" style={{ opacity: Math.min(1, Math.abs(p) * 1.4) }}>
                <span>DX {x >= 0 ? "+" : ""}{Math.round(x)}</span>
                <span className="lv-meter"><i style={{ width: `${Math.abs(p) * 100}%` }} /></span>
                <span>{p >= 0 ? "SAVE" : "PASS"} {Math.round(Math.abs(p) * 100)}%</span>
              </div>
            </div>
            <div className="lv-stamp save" style={{ opacity: Math.max(0, p) }}><Icon name="saved" size={20} />SAVE</div>
            <div className="lv-stamp pass" style={{ opacity: Math.max(0, -p) }}><Icon name="pass" size={20} />PASS</div>
            <div className="lv-card-foot">
              <h3>{d.name}</h3>
              <p>{d.line}</p>
              <RaiseHud d={d} dark compact />
            </div>
          </LiveImage>
        </article>
      </div>
      <Burst kind={burst.k} id={burst.n} />
      <div className="lv-actions">
        <SwipeAction kind="pass" onClick={() => commit(-1)} />
        <SwipeAction kind="info" onClick={() => onOpen(d.id)} />
        <SwipeAction kind="save" big onClick={() => commit(1)} />
      </div>
      <div className="lv-tele lv-mono">
        <span>SAVED <b>{log.save}</b></span><span>PASSED <b>{log.pass}</b></span><span>QUEUE <b>{DEALS.length - (i % DEALS.length)}</b></span>
      </div>
    </div>
  );
}

/* ---------- DEAL PAGE ---------- */

export function DealView({ id, onBack, wide }: { id: string; onBack?: () => void; wide?: boolean }) {
  useCatalog();
  const d = DEALS.find((x) => x.id === id);
  const [st] = useStore();
  if (!d) return <div className="lv-deal">{onBack && <IconButton icon="back" label="Back" onClick={onBack} />}<Empty title="Company not found" body="It may not be published yet." /></div>;
  const saved = !!st.watch[d.id];
  return (
    <div className={`lv-deal${wide ? " wide" : ""}`}>
      <LiveImage key={d.id} src={d.img} hotspots={d.hotspots} className="lv-hero">
        <div className="lv-hero-top">
          {onBack ? <IconButton icon="back" label="Back" className="lv-glass" onClick={onBack} /> : <span />}
          <span />
          <SaveToggle on={saved} onChange={() => { if (requireAccount()) watchToggle(d.id); }} className="lv-glass" />
        </div>
      </LiveImage>
      <div className="lv-deal-body">
        <div className="lv-mono dim"><CatIcon cat={d.cat} /> {[d.cat, d.city].filter(Boolean).join(" · ").toUpperCase()}</div>
        <h1>{d.name}</h1>
        <p className="lv-lede">{d.line}</p>
        <RaiseHud d={d} />
        <div className="lv-cta">
          <InvestButton size="lg" block disabled>Invest · coming soon</InvestButton>
          <p className="lv-fine">Catalyst is not yet offering investments. Reg CF offerings will run through a registered funding portal once registration is complete.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- DISCOVER GRID ---------- */
export function DiscoverView({ onOpen, initial = null, prefsOpen = false }: { onOpen: (id: string) => void; initial?: ProfRef | null; prefsOpen?: boolean }) {
  const { status, requiresSignIn } = useCatalog();
  const [ref, seen] = useInView<HTMLDivElement>();
  const [prof, setProf] = useState<ProfRef | null>(initial);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [showPrefs, setShowPrefs] = useState(prefsOpen);
  const [toast, setToast] = useState<{ t: string; n: number } | null>(null);
  const say = (t: string) => setToast((o) => ({ t, n: (o?.n ?? 0) + 1 }));
  return (
    <div className="lv-disc">
      <header className="lv-top"><div className="lv-mono">DISCOVER</div><div className="lv-mono dim">{DEALS.length} {DEALS.length === 1 ? "COMPANY" : "COMPANIES"}</div></header>
      {!DEALS.length && (requiresSignIn ? <SignInEmpty /> : <Empty title={status === "loading" ? "Loading…" : "No companies live yet"} body={catalogNote(status)} />)}
      {!!DEALS.length && <MatchList prefs={prefs} onOpenDeal={onOpen} onProfile={setProf} onPrefs={() => setShowPrefs(true)} toast={say} />}
      {!!DEALS.length && <div className="lv-sec-h lv-mono">BROWSE ALL</div>}
      <div ref={ref} className={`lv-grid${seen ? " in" : ""}`}>
        {DEALS.map((d, k) => <Tile key={k} d={d} k={k} onOpen={onOpen} big={k === 0} />)}
      </div>
      <ProfileFeed onOpen={setProf} toast={say} />
      {prof && <ProfileSheet key={prof.kind + prof.id} r={prof} onClose={() => setProf(null)} onOpen={setProf} toast={say} />}
      {showPrefs && <PrefsSheet prefs={prefs} onChange={setPrefs} onClose={() => setShowPrefs(false)} />}
      <Toast msg={toast} />
    </div>
  );
}
function Tile({ d, k, onOpen, big }: { d: LiveDeal; k: number; onOpen: (id: string) => void; big?: boolean }) {
  return (
    <button type="button" className={`lv-tile${big ? " big" : ""}`} style={{ transitionDelay: `${k * 70}ms` }} onClick={() => onOpen(d.id)}>
      <LiveImage src={d.img} intro={false}>
        <span className="lv-tile-ret" aria-hidden><b className="tl" /><b className="tr" /><b className="bl" /><b className="br" /></span>
        <div className="lv-tile-hud">
          {d.cat && <span className="lv-mono lv-tag">{d.cat.toUpperCase()}</span>}
          <div>
            <strong>{d.name}</strong>
            <div className="lv-mono lv-tile-m"><span>OPENS SOON</span></div>
          </div>
        </div>
      </LiveImage>
    </button>
  );
}

/* ---------- EVENTS ---------- */
export function EventsView() {
  const { status } = useCatalog();
  return (
    <div className="lv-evs">
      <header className="lv-top"><div className="lv-mono">EVENTS / NYC</div><div className="lv-mono dim">CATALYST COMMUNITY</div></header>
      {!EVENTS.length && <Empty icon="events" title={status === "loading" ? "Loading…" : "No upcoming events"} body={status === "loading" ? undefined : "New events show up here as soon as they're announced."} />}
      {EVENTS.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}
function EventCard({ e }: { e: LiveEvent }) {
  const reduced = useReducedMotion();
  const [st] = useStore(); const me = st.rsvps.includes(e.id);
  const setMe = () => { if (requireAccount()) setState((s) => ({ ...s, rsvps: toggle(s.rsvps, e.id) })); };
  const url = (e as LiveEvent & { url?: string }).url;
  const [ref] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="lv-ev">
      <LiveImage src={e.img} intro={false} className="lv-ev-img">
        <div className="lv-ev-hud">
          <span className="lv-mono lv-tag">{e.when}</span>
        </div>
      </LiveImage>
      <div className="lv-ev-body">
        <div>
          <h3>{e.title}</h3>
          {e.where && <div className="lv-mono dim"><Icon name="location" size={13} /> {e.where.toUpperCase()}</div>}
          {url && <a className="lv-mono dim" href={url} target="_blank" rel="noopener noreferrer">EVENT PAGE</a>}
        </div>
        <span className={`lv-rsvp${me ? "" : " pulse"}`}>
          <RsvpButton size="md" state={me ? "going" : "open"} onClick={setMe} />
        </span>
      </div>
    </div>
  );
}

