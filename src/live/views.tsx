import { useRef, useState, type PointerEvent as RPE } from "react";

import { Icon } from "@/brand/icons";
import { SaveToggle, Burst } from "./micro";
import { ProfileFeed, ProfileSheet, Toast, type ProfRef } from "./profiles";
import { MatchList, PrefsSheet } from "./match";
import { DEFAULT_PREFS, type Prefs } from "./data";
import { SwipeAction, RsvpButton, InvestButton, IconButton } from "@/brand/Button";
import { DEALS, EVENTS, type LiveDeal, type LiveEvent } from "./data";
import { CatIcon, LiveImage, RaiseHud, SampleTag, Sparkline, useClock } from "./parts";
import { useCountUp, useInView, useReducedMotion } from "./hooks";

const TH = 110;

/* ---------- SWIPE ---------- */
export function SwipeView({ onOpen }: { onOpen: (id: string) => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [fly, setFly] = useState<0 | 1 | -1>(0);
  const [log, setLog] = useState({ save: 0, pass: 0 });
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const clock = useClock();
  const d = DEALS[i % DEALS.length], next = DEALS[(i + 1) % DEALS.length];

  const [burst, setBurst] = useState<{ k: "save" | "pass" | null; n: number }>({ k: null, n: 0 });
  const commit = (dir: 1 | -1) => {
    setFly(dir);
    setBurst((b) => ({ k: dir > 0 ? "save" : "pass", n: b.n + 1 }));
    setLog((l) => (dir > 0 ? { ...l, save: l.save + 1 } : { ...l, pass: l.pass + 1 }));
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
        <div className="lv-mono">DISCOVER / SWIPE</div>
        <div className="lv-mono dim">{clock}</div>
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
          aria-label={`${d.name}, sample deal. Drag right to save, left to pass, tap for details.`}
        >
          <LiveImage src={d.img} hotspots={d.hotspots}>
            <div className="lv-card-hud">
              <div className="lv-card-row"><SampleTag /><span className="lv-mono lv-chip"><CatIcon cat={d.cat} /> {d.cat.toUpperCase()}</span></div>
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
        <span>SAVED <b>{log.save}</b></span><span>PASSED <b>{log.pass}</b></span><span>QUEUE <b>{DEALS.length - (i % DEALS.length)}</b></span><span className="dim">SAMPLE</span>
      </div>
    </div>
  );
}

/* ---------- DEAL PAGE ---------- */
function Waveform() {
  return <div className="lv-wave" aria-hidden>{Array.from({ length: 36 }, (_, k) => <i key={k} style={{ animationDelay: `${(k * 73) % 900}ms` }} />)}</div>;
}

export function DealView({ id, onBack, wide }: { id: string; onBack?: () => void; wide?: boolean }) {
  const d = DEALS.find((x) => x.id === id) ?? DEALS[0];
  const [saved, setSaved] = useState(false);
  const clock = useClock();
  return (
    <div className={`lv-deal${wide ? " wide" : ""}`}>
      <LiveImage key={d.id} src={d.img} hotspots={d.hotspots} className="lv-hero">
        <div className="lv-hero-top">
          {onBack ? <IconButton icon="back" label="Back" className="lv-glass" onClick={onBack} /> : <span />}
          <SampleTag />
          <SaveToggle on={saved} onChange={setSaved} className="lv-glass" />
        </div>
        <div className="lv-hero-tele lv-mono"><span>REC · {clock}</span><span>TAP ◎ TO INSPECT</span></div>
      </LiveImage>
      <div className="lv-deal-body">
        <div className="lv-mono dim"><CatIcon cat={d.cat} /> {d.cat.toUpperCase()} · {d.city.toUpperCase()}</div>
        <h1>{d.name}</h1>
        <p className="lv-lede">{d.line}</p>
        <RaiseHud d={d} />
        <div className="lv-panel">
          <div className="lv-panel-h lv-mono"><span><span className="lv-live" /> ACTIVITY · SAMPLE</span><span className="dim">LIVE</span></div>
          <Waveform />
          <ul className="lv-feed lv-mono">
            <li><span>NEW INVESTOR</span><b>+{d.min}</b></li>
            <li><span>SAVED BY</span><b>{Math.round(d.investors * 1.7)}</b></li>
            <li><span>Q&amp;A OPEN</span><b>12</b></li>
          </ul>
        </div>
        <div className="lv-cta">
          <InvestButton size="lg" block disabled>Invest · coming soon</InvestButton>
          <p className="lv-fine">Sample deal for UI preview. Catalyst is not yet offering investments. Reg CF offerings will run through a registered funding portal.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- DISCOVER GRID ---------- */
export function DiscoverView({ onOpen, initial = null, prefsOpen = false }: { onOpen: (id: string) => void; initial?: ProfRef | null; prefsOpen?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [prof, setProf] = useState<ProfRef | null>(initial);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [showPrefs, setShowPrefs] = useState(prefsOpen);
  const [toast, setToast] = useState<{ t: string; n: number } | null>(null);
  const say = (t: string) => setToast((o) => ({ t, n: (o?.n ?? 0) + 1 }));
  return (
    <div className="lv-disc">
      <header className="lv-top"><div className="lv-mono">DISCOVER</div><div className="lv-mono dim">{DEALS.length} SAMPLE DEALS</div></header>
      <MatchList prefs={prefs} onOpenDeal={onOpen} onProfile={setProf} onPrefs={() => setShowPrefs(true)} toast={say} />
      <div className="lv-sec-h lv-mono">BROWSE ALL</div>
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
  const pct = Math.round((d.raised / d.goal) * 100);
  return (
    <button type="button" className={`lv-tile${big ? " big" : ""}`} style={{ transitionDelay: `${k * 70}ms` }} onClick={() => onOpen(d.id)}>
      <LiveImage src={d.img} intro={false}>
        <span className="lv-tile-ret" aria-hidden><b className="tl" /><b className="tr" /><b className="bl" /><b className="br" /></span>
        <div className="lv-tile-hud">
          <span className="lv-mono lv-tag">{big ? `SAMPLE · ${d.cat.toUpperCase()}` : "SAMPLE"}</span>
          <div>
            <strong>{d.name}</strong>
            <div className="lv-tile-bar"><i style={{ width: `${pct}%` }} /></div>
            <div className="lv-mono lv-tile-m"><span>{pct}%</span><span>{d.days}D</span><Sparkline data={d.spark} go w={44} h={14} /></div>
          </div>
        </div>
      </LiveImage>
    </button>
  );
}

/* ---------- EVENTS ---------- */
export function EventsView() {
  return (
    <div className="lv-evs">
      <header className="lv-top"><div className="lv-mono">EVENTS / NYC</div><div className="lv-mono dim">CATALYST COMMUNITY</div></header>
      {EVENTS.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}
function EventCard({ e }: { e: LiveEvent }) {
  const reduced = useReducedMotion();
  const [going, setGoing] = useState(e.going);
  const [me, setMe] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>();
  const left = e.cap - going;
  const shown = Math.round(useCountUp(left, seen, reduced, 900));
  return (
    <div ref={ref} className="lv-ev">
      <LiveImage src={e.img} intro={false} className="lv-ev-img">
        <div className="lv-ev-hud">
          <span className="lv-mono lv-tag">{e.when}</span>
          <span className={`lv-spots lv-mono${left <= 5 ? " low" : ""}`}><span className="lv-live" /><b key={left} className="lv-flip">{shown}</b> SPOTS LEFT</span>
        </div>
      </LiveImage>
      <div className="lv-ev-body">
        <div>
          <h3>{e.title}</h3>
          <div className="lv-mono dim"><Icon name="location" size={13} /> {e.where.toUpperCase()} · {going}/{e.cap}</div>
          <div className="lv-cap"><i style={{ width: `${(going / e.cap) * 100}%` }} /></div>
        </div>
        <span className={`lv-rsvp${me ? "" : " pulse"}`}>
          <RsvpButton size="md" state={me ? "going" : left > 0 ? "open" : "full"} onClick={() => { if (me) { setMe(false); setGoing(going - 1); } else if (left > 0) { setMe(true); setGoing(going + 1); } }} />
        </span>
      </div>
    </div>
  );
}

