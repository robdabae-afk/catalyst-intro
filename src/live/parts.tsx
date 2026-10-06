import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/brand/icons";
import { type Hotspot, type LiveDeal, usd } from "./data";
import { useCountUp, useInView, useParallax, useReducedMotion } from "./hooks";

/** Status pill (e.g. "OPENS SOON"). No sample labels on real companies. */
export const SampleTag = ({ dark, label = "OPENS SOON" }: { dark?: boolean; label?: string }) => <span className={`lv-pill${dark ? " dk" : ""}`}><i />{label}</span>;

/* Image with Ken Burns drift, pointer/gyro parallax, scan-line intro and hotspots. */
export function LiveImage({ src, hotspots = [], children, intro = true, className = "", style }: { src: string; hotspots?: Hotspot[]; children?: ReactNode; intro?: boolean; className?: string; style?: CSSProperties }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref, reduced);
  const [open, setOpen] = useState<number | null>(null);
  const [scanKey] = useState(() => Math.random());
  useEffect(() => { if (open === null) return; const c = () => setOpen(null); addEventListener("scroll", c, true); return () => removeEventListener("scroll", c, true); }, [open]);
  return (
    <div ref={ref} className={`lv-img ${reduced ? "rm" : ""} ${className}`} style={style} onClick={() => setOpen(null)}>
      <div className="lv-img-in">{src ? <img src={src} alt="" draggable={false} /> : <div className="lv-img-empty" aria-hidden />}</div>
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
  if (data.length < 2) return null;
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

/* Static count (no simulated live increments). */
export function Ticker({ start, label = "INVESTORS" }: { start: number; label?: string }) {
  return <span className="lv-tick"><b>{start.toLocaleString("en-US")}</b> {label}</span>;
}

/* Raise block: no live raise numbers or ticker. Investing is not open yet. */
export function RaiseHud({ d, dark, compact }: { d: LiveDeal; dark?: boolean; compact?: boolean }) {
  return (
    <div className={`lv-hud${dark ? " dk" : ""}${compact ? " cp" : ""}`}>
      <div className="lv-hud-top">
        <div>
          <div className="lv-big lv-soon">Investing opens soon</div>
          <div className="lv-mono dim">SAVE IT AND WE'LL TELL YOU</div>
        </div>
      </div>
      {!compact && (
        <div className="lv-terms">
          <div><em>VAL CAP</em><b>{d.cap || "TBA"}</b></div>
          <div><em>MIN</em><b>{d.min || "TBA"}</b></div>
          <div><em>INSTRUMENT</em><b>{(d as LiveDeal & { instrument?: string }).instrument || "TBA"}</b></div>
        </div>
      )}
    </div>
  );
}

export function CatIcon({ cat }: { cat: string }) {
  const m: Record<string, "food" | "climate" | "software"> = { Food: "food", Climate: "climate", Software: "software", Hardware: "software", Fintech: "software" };
  return <Icon name={m[cat] ?? "software"} size={14} />;
}

/* Interval-free clock string for telemetry corners. */
export function useClock() {
  const [t, set] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => set(new Date()), 1000); return () => clearInterval(i); }, []);
  return t.toTimeString().slice(0, 8);
}
