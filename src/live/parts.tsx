import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/brand/icons";
import { type Hotspot, type LiveDeal, usd } from "./data";
import { useCountUp, useInView, useParallax, useReducedMotion, useTicker } from "./hooks";

export const SampleTag = ({ dark }: { dark?: boolean }) => <span className={`lv-pill${dark ? " dk" : ""}`}><i />SAMPLE DEAL</span>;

/* Image with Ken Burns drift, pointer/gyro parallax, scan-line intro and hotspots. */
export function LiveImage({ src, hotspots = [], children, intro = true, className = "", style }: { src: string; hotspots?: Hotspot[]; children?: ReactNode; intro?: boolean; className?: string; style?: CSSProperties }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref, reduced);
  const [open, setOpen] = useState<number | null>(null);
  const [scanKey] = useState(() => Math.random());
  return (
    <div ref={ref} className={`lv-img ${reduced ? "rm" : ""} ${className}`} style={style} onClick={() => setOpen(null)}>
      <div className="lv-img-in"><img src={src} alt="" draggable={false} /></div>
      <div className="lv-grain" />
      {intro && !reduced && <div key={scanKey} className="lv-scan"><span /><b className="tl" /><b className="tr" /><b className="bl" /><b className="br" /></div>}
      {hotspots.map((h, i) => (
        <div key={i} className={`lv-hs${open === i ? " on" : ""}${h.x > 55 ? " left" : ""}`} style={{ left: `${h.x}%`, top: `${h.y}%` }}>
          <button type="button" aria-label={`${h.tag} ${h.title}`} aria-expanded={open === i} onClick={(e) => { e.stopPropagation(); setOpen(open === i ? null : i); }}><span /></button>
          <div className="lv-call" role="note">
            <em>{h.tag}</em><strong>{h.title}</strong><p>{h.fact}</p>
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}

export function Sparkline({ data, go, w = 120, h = 32 }: { data: number[]; go: boolean; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg className={`lv-spark${go ? " go" : ""}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
      <path d={`${d}L${w} ${h}L0 ${h}Z`} className="fill" />
      <path d={d} className="ln" pathLength={1} />
      <circle cx={last[0]} cy={last[1]} r="2.6" className="dot" />
    </svg>
  );
}

/* Investor ticker with +1 pop. */
export function Ticker({ start, label = "INVESTORS" }: { start: number; label?: string }) {
  const reduced = useReducedMotion();
  const [n, pop] = useTicker(start, reduced);
  return (
    <span className="lv-tick">
      <span className="lv-live" aria-hidden />
      <b aria-live="polite">{n.toLocaleString("en-US")}</b> {label}
      {pop > 0 && <i key={pop} className="lv-plus">+1</i>}
    </span>
  );
}

/* HUD raise block: count-up, bar fill, ticker, terms, sparkline. */
export function RaiseHud({ d, dark, compact }: { d: LiveDeal; dark?: boolean; compact?: boolean }) {
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<HTMLDivElement>();
  const raised = useCountUp(d.raised, seen, reduced);
  const pct = (raised / d.goal) * 100;
  return (
    <div ref={ref} className={`lv-hud${dark ? " dk" : ""}${compact ? " cp" : ""}`}>
      <div className="lv-hud-top">
        <div>
          <div className="lv-big">{usd(raised)}</div>
          <div className="lv-mono dim">RAISED OF {usd(d.goal)} · SAMPLE</div>
        </div>
        {!compact && <div className="lv-spk"><Sparkline data={d.spark} go={seen} /><span className="lv-mono dim">MOMENTUM · 12W</span></div>}
      </div>
      <div className="lv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Sample raise progress">
        <span style={{ width: `${pct}%` }} />
        {[25, 50, 75].map((t) => <i key={t} style={{ left: `${t}%` }} />)}
      </div>
      <div className="lv-row lv-mono">
        <span>{Math.round(pct)}%</span>
        <Ticker start={d.investors} />
      </div>
      {!compact && (
        <div className="lv-terms">
          <div><em>VAL CAP</em><b>{d.cap}</b></div>
          <div><em>MIN</em><b>{d.min}</b></div>
          <div><em>DAYS LEFT</em><b>{d.days}</b></div>
        </div>
      )}
    </div>
  );
}

export function CatIcon({ cat }: { cat: string }) {
  const m: Record<string, "food" | "climate" | "software"> = { Food: "food", Climate: "climate", Software: "software" };
  return <Icon name={m[cat] ?? "software"} size={14} />;
}

/* Interval-free clock string for telemetry corners. */
export function useClock() {
  const [t, set] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => set(new Date()), 1000); return () => clearInterval(i); }, []);
  return t.toTimeString().slice(0, 8);
}
