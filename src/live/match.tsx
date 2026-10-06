import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from "react";
import { Icon } from "@/brand/icons";
import { Button, Chip, IconButton, MatchRing, PitchBadge, SwipeAction } from "@/brand/Button";
import { CHECKS, DEALS, DEFAULT_PREFS, MATCH, SECTORS, scoreDeal, type LiveDeal, type Prefs } from "./data";
import { LiveImage, SampleTag } from "./parts";
import { PitchPlayer } from "./pitch";
import { CompanyDetail } from "./detail";
import type { SectionId } from "./company";
import { useInView, useReducedMotion } from "./hooks";
import { Avatar, PEOPLE, type ProfRef } from "./profiles";

/* Discover match cards. All companies, people, scores and figures are SAMPLE. */

const FLING = 110;
const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

/** Spring-driven horizontal drag with tilt. Writes transforms straight to the node. */
function useSpringDrag(onFling: (dir: 1 | -1) => void, reduced: boolean) {
  const node = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0, v: 0, raf: 0, sx: 0, sy: 0, id: -1, drag: false, armed: false, lock: "" as "" | "x" | "y" });
  const [p, setP] = useState(0);
  const paint = () => {
    const s = st.current, el = node.current; if (!el) return;
    el.style.transform = `translate3d(${s.x}px,0,0) rotate(${s.x / 16}deg)`;
    setP(Math.max(-1, Math.min(1, s.x / FLING)));
  };
  const springTo = (target: number, done?: () => void) => {
    const s = st.current; cancelAnimationFrame(s.raf);
    if (reduced) { s.x = target; s.v = 0; paint(); done?.(); return; }
    let last = performance.now();
    const k = target === 0 ? 240 : 120, c = target === 0 ? 17 : 8;
    const step = (t: number) => {
      const dt = Math.min(0.032, (t - last) / 1000); last = t;
      const a = -k * (s.x - target) - c * s.v; s.v += a * dt; s.x += s.v * dt; paint();
      if (target === 0 ? Math.abs(s.x) < 0.4 && Math.abs(s.v) < 4 : Math.abs(s.x) > Math.abs(target) * 0.9) { if (target === 0) { s.x = 0; s.v = 0; paint(); } done?.(); return; }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
  const fling = (dir: 1 | -1) => { buzz(14); st.current.v = dir * 900; springTo(dir * 520, () => onFling(dir)); };
  const bind = {
    onPointerDown: (e: RPE) => {
      if ((e.target as HTMLElement).closest("button,video")) return;
      const s = st.current; cancelAnimationFrame(s.raf);
      Object.assign(s, { sx: e.clientX - s.x, sy: e.clientY, id: e.pointerId, drag: true, lock: "", v: 0 });
    },
    onPointerMove: (e: RPE) => {
      const s = st.current; if (!s.drag || e.pointerId !== s.id) return;
      const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
      if (!s.lock) { if (Math.abs(dx) > 8) { s.lock = "x"; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } else if (Math.abs(dy) > 8) { s.lock = "y"; s.drag = false; return; } else return; }
      s.v = (dx - s.x) * 60; s.x = dx; paint();
      const armed = Math.abs(dx) > FLING; if (armed !== s.armed) { s.armed = armed; if (armed) buzz(6); }
    },
    onPointerUp: () => { const s = st.current; if (!s.drag) return; s.drag = false; if (Math.abs(s.x) > FLING || Math.abs(s.v) > 1100) fling(s.x > 0 ? 1 : -1); else springTo(0); },
    onPointerCancel: () => { st.current.drag = false; springTo(0); },
  };
  return { node, bind, p, fling, dragging: () => st.current.drag };
}

function MatchCard({ d, prefs, k, settled, onGone, onOpenDeal, onProfile, onPitch, onDetail }: { d: LiveDeal; onPitch: (id: string) => void; onDetail: (id: string, s?: SectionId) => void; prefs: Prefs; k: number; settled: boolean; onGone: (dir: 1 | -1) => void; onOpenDeal: (id: string) => void; onProfile: (r: ProfRef) => void }) {
  const reduced = useReducedMotion();
  const m = MATCH[d.id];
  const [more, setMore] = useState(false);
  const { score, line } = useMemo(() => scoreDeal(d, prefs), [d, prefs]);
  const { node, bind, p, fling } = useSpringDrag(onGone, reduced);
  const [vid, setVid] = useState(false);
  const [ref, seenIO] = useInView<HTMLDivElement>();
  const seen = seenIO || settled;
  const tilt = useRef<HTMLDivElement>(null);
  const founder = PEOPLE.find((x) => x.id === m.founder)!;
  const mut = m.mutuals.map((id) => PEOPLE.find((x) => x.id === id)!).filter(Boolean);
  const hover = (e: RPE) => {
    if (reduced || e.pointerType !== "mouse" || !tilt.current) return;
    const r = tilt.current.getBoundingClientRect();
    tilt.current.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
    tilt.current.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 5}deg`);
  };
  const unhover = () => { tilt.current?.style.setProperty("--rx", "0deg"); tilt.current?.style.setProperty("--ry", "0deg"); };
  return (
    <div ref={ref} className={`lv-mc-slot${seen ? " in" : ""}`} style={seen && settled ? undefined : { transitionDelay: `${k * 90}ms` }}>
      <div ref={node} className="lv-mc-drag" {...bind}>
        <div className="lv-mc-sway" style={{ animationDelay: `${-k * 1.7}s` }}>
          <article ref={tilt} className={`lv-mc${Math.abs(p) >= 1 ? " armed" : ""}`} onPointerMove={hover} onPointerLeave={unhover}
            aria-label={`${d.name}, sample match ${score}. Drag right to save, left to pass.`}>
            <div className={`lv-mc-cover${vid ? " vid" : ""}`}>
              {vid && m.pitch
                ? <video src={m.pitch} autoPlay={!reduced} muted loop playsInline controls={reduced} aria-label={`${d.name} sample pitch preview, muted`} />
                : <LiveImage src={d.img} intro={false} />}
              <div className="lv-mc-top"><SampleTag />{m.pitch && <PitchBadge len={m.pitchLen ?? ""} open={vid} onClick={() => { buzz(); onPitch(d.id); }} />}</div>
              <div className="lv-stamp save" style={{ opacity: Math.max(0, p) }}><Icon name="saved" size={18} />SAVE</div>
              <div className="lv-stamp pass" style={{ opacity: Math.max(0, -p) }}><Icon name="pass" size={18} />PASS</div>
            </div>
            <div className="lv-mc-body">
              <div className="lv-mc-head">
                <Logo id={d.id} />
                <div className="lv-mc-id">
                  <h3><button type="button" className="lv-mc-name" onClick={() => onDetail(d.id)}>{d.name}</button></h3>
                  <span className="lv-mono dim">{d.cat.toUpperCase()} · {d.city.split(",")[0].toUpperCase()}</span>
                </div>
                <MatchRing score={seen ? score : 0} />
              </div>
              <button type="button" className="lv-mc-open" onClick={() => onDetail(d.id)} aria-label={`Open ${d.name} details`}><p className="lv-mc-line">{d.line}</p></button>
              <button type="button" className="lv-mc-more" aria-expanded={more} onClick={() => setMore(!more)}><span>{more ? "Less" : "Why it fits, founder & stats"}</span><Icon name="forward" size={13} /></button>
              <div className={`lv-mc-x${more ? " open" : ""}`} aria-hidden={!more}><div>
              <button type="button" className="lv-mc-founder" onClick={() => onDetail(d.id, "team")} aria-label={`Founder ${founder.name}, sample profile`}>
                <Avatar p={founder} size={28} /><span><b>{founder.name}</b> · Founder</span><Icon name="forward" size={14} />
              </button>
              <p className="lv-mc-why">{line}</p>
              <div className="lv-mc-stats">
                <button type="button" onClick={() => onDetail(d.id, "traction")}><span className="lv-mono">TRACTION</span><b>{m.traction}</b></button>
                <button type="button" onClick={() => onDetail(d.id, "raise")}><span className="lv-mono">STAGE</span><b>{m.stage}</b></button>
                <button type="button" onClick={() => onDetail(d.id, "limit")}><span className="lv-mono">MIN</span><b>${m.minCheck}</b></button>
              </div>
              <button type="button" className="lv-mc-mut" onClick={() => onDetail(d.id, "team")}>
                <span className="lv-av-stack">{mut.slice(0, 4).map((x) => <Avatar key={x.id} p={x} size={24} />)}</span>
                <span>{mut.slice(0, 2).map((x) => x.name).join(", ")}{mut.length > 2 ? ` +${mut.length - 2}` : ""} · mutual</span>
                <Icon name="mutual" size={15} />
              </button>
              </div></div>
              <div className="lv-mc-act">
                <SwipeAction kind="pass" onClick={() => fling(-1)} />
                <SwipeAction kind="info" onClick={() => onDetail(d.id)} />
                <SwipeAction kind="save" onClick={() => fling(1)} />
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export function MatchList({ prefs, onOpenDeal, onProfile, onPrefs, toast }: { prefs: Prefs; onOpenDeal: (id: string) => void; onProfile: (r: ProfRef) => void; onPrefs: () => void; toast: (s: string) => void }) {
  const [gone, setGone] = useState<string[]>([]);
  const [pitch, setPitch] = useState<string | null>(null);
  const [det, setDet] = useState<{ id: string; s?: SectionId } | null>(null);
  const list = DEALS.filter((d) => !gone.includes(d.id)).map((d) => ({ d, s: scoreDeal(d, prefs).score })).sort((a, b) => b.s - a.s);
  return (
    <section className="lv-ml">
      <div className="lv-ml-h">
        <div><span className="lv-mono">FOR YOU / MATCHES</span><strong>{list.length} sample matches</strong></div>
        <IconButton icon="sliders" label="Match preferences" onClick={onPrefs} />
      </div>
      {list.map(({ d }, k) => (
        <MatchCard key={d.id} d={d} k={k} settled={gone.length > 0} prefs={prefs} onOpenDeal={onOpenDeal} onProfile={onProfile} onPitch={setPitch} onDetail={(id, s) => setDet({ id, s })}
          onGone={(dir) => { setGone((g) => [...g, d.id]); toast(dir > 0 ? `Saved ${d.name} · sample` : `Passed ${d.name}`); }} />
      ))}
      {!list.length && (
        <div className="lv-ml-done"><Icon name="match" size={34} /><strong>You're caught up</strong><p className="dim">Sample deck finished. Tune preferences or start over.</p><Button variant="secondary" icon="swipe" onClick={() => setGone([])}>Start over</Button></div>
      )}
      {det && <CompanyDetail key={det.id + (det.s ?? "")} id={det.id} start={det.s} onClose={() => setDet(null)} onProfile={onProfile} onPitch={(id) => setPitch(id)} />}
      {pitch && <PitchPlayer id={pitch} ids={list.map((x) => x.d.id)} onClose={() => setPitch(null)} onNext={setPitch} onProfile={onProfile}
        onSave={(id) => { setPitch(null); setGone((g) => [...g, id]); toast(`Saved ${DEALS.find((x) => x.id === id)?.name} · sample`); }}
        onPass={(id) => { setPitch(null); setGone((g) => [...g, id]); toast(`Passed ${DEALS.find((x) => x.id === id)?.name}`); }} />}
    </section>
  );
}

export function PrefsSheet({ prefs, onChange, onClose }: { prefs: Prefs; onChange: (p: Prefs) => void; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => { cancelAnimationFrame(t); removeEventListener("keydown", k); }; }, [onClose]);
  const tog = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const set = (p: Partial<Prefs>) => { buzz(4); onChange({ ...prefs, ...p }); };
  const top = DEALS.map((d) => ({ d, s: scoreDeal(d, prefs).score })).sort((a, b) => b.s - a.s)[0];
  return (
    <div className={`lv-sheet-wrap${shown ? " in" : ""}`} onClick={onClose}>
      <div className="lv-sheet short" role="dialog" aria-modal="true" aria-label="Match preferences" onClick={(e) => e.stopPropagation()}>
        <div className="lv-prefs">
          <div className="lv-prefs-h"><div><span className="lv-mono dim">TUNE YOUR MATCHES</span><h2>Preferences</h2></div><IconButton icon="close" label="Close" onClick={onClose} /></div>
          <div className="lv-prefs-g"><span className="lv-mono">SECTORS</span><div>{SECTORS.map((s) => <Chip key={s} on={prefs.sectors.includes(s)} onClick={() => set({ sectors: tog(prefs.sectors, s) })}>{s}</Chip>)}</div></div>
          <div className="lv-prefs-g"><span className="lv-mono">STAGE</span><div>{["Pre-seed", "Seed"].map((s) => <Chip key={s} icon="stage" on={prefs.stages.includes(s)} onClick={() => set({ stages: tog(prefs.stages, s) })}>{s}</Chip>)}</div></div>
          <div className="lv-prefs-g"><span className="lv-mono">CITY</span><div><Chip icon="location" on={prefs.nyc} onClick={() => set({ nyc: true })}>NYC first</Chip><Chip on={!prefs.nyc} onClick={() => set({ nyc: false })}>Anywhere</Chip></div></div>
          <div className="lv-prefs-g"><span className="lv-mono">TYPICAL CHECK</span>
            <div className="lv-seg" role="radiogroup" aria-label="Typical check">
              {CHECKS.map((c) => <button key={c} type="button" role="radio" aria-checked={prefs.check === c} className={prefs.check === c ? "on" : ""} onClick={() => set({ check: c })}>${c.toLocaleString("en-US")}</button>)}
              <i style={{ width: `${100 / CHECKS.length}%`, transform: `translateX(${CHECKS.indexOf(prefs.check) * 100}%)` }} />
            </div>
          </div>
          <div className="lv-prefs-live" aria-live="polite"><MatchRing score={top.s} size={40} /><span>Top sample match: <b>{top.d.name}</b></span></div>
          <div className="lv-prefs-f">
            <Button variant="ghost" onClick={() => onChange(DEFAULT_PREFS)}>Reset</Button>
            <Button icon="check" onClick={onClose}>Show matches</Button>
          </div>
          <p className="lv-fine">Scores are sample logic for the UI preview, not investment advice.</p>
        </div>
      </div>
    </div>
  );
}

/* Sample company marks (fictional). */
const MARKS: Record<string, JSX.Element> = {
  lumen: <><circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M16 7v18" stroke="currentColor" strokeWidth="2.4" /><circle cx="16" cy="16" r="3" fill="currentColor" /></>,
  gridline: <><path d="M8 24V14l8-6 8 6v10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><path d="M12 24v-5h8v5" fill="none" stroke="currentColor" strokeWidth="2.4" /></>,
  tally: <><rect x="8" y="7" width="16" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M12 13h8M12 17h8M12 21h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>,
};
export function Logo({ id, size = 44 }: { id: string; size?: number }) {
  return <span className="lv-logo" style={{ width: size, height: size }} aria-hidden><svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62}>{MARKS[id]}</svg></span>;
}
