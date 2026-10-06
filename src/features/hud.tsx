import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./bicons";
import type { Company, Sector } from "./data";
import { useReducedMotion } from "./store";

const SECTOR_ICON: Record<Sector, IconName> = { Fintech: "fintech", Climate: "climate", Food: "food", Health: "health", Consumer: "match", AI: "software" };

/** HUD corner brackets around any block. */
export function Hud({ children, className = "", tag, scan }: { children: ReactNode; className?: string; tag?: string; scan?: boolean }) {
  return (
    <div className={`hud ${className}`}>
      <b className="hb tl" /><b className="hb tr" /><b className="hb bl" /><b className="hb br" />
      {tag && <span className="hud-tag mono">{tag}</span>}
      {scan && <span className="hud-scan" aria-hidden />}
      {children}
    </div>
  );
}

/** Company logo: black tile with the sector glyph + tilted card, never a letter. */
export function Logo({ c, size = 40 }: { c: Company; size?: number }) {
  return (
    <span className="lg" style={{ width: size, height: size, borderRadius: size * 0.3 }} aria-hidden>
      <img src={c.img} alt="" loading="lazy" />
      <span className="lg-ic"><Icon name={SECTOR_ICON[c.sector]} size={Math.round(size * 0.42)} /></span>
    </span>
  );
}

export const Face = ({ c, size = 36, ring }: { c: Company; size?: number; ring?: boolean }) => (
  <img className={`face${ring ? " ring" : ""}`} src={c.face} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size }} />
);

/** Logo with founder avatar overlapped bottom-right. */
export const Duo = ({ c, size = 46 }: { c: Company; size?: number }) => (
  <span className="duo" style={{ width: size + 8, height: size + 8 }}><Logo c={c} size={size} /><Face c={c} size={Math.round(size * 0.55)} ring /></span>
);

export function CountUp({ to, ms = 1100, suffix = "", prefix = "" }: { to: number; ms?: number; suffix?: string; prefix?: string }) {
  const rm = useReducedMotion();
  const [v, set] = useState(rm ? to : 0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (rm) { set(to); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const p = Math.min(1, (t - t0) / ms); set(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, rm]);
  return <span ref={ref} className="num">{prefix}{Math.round(v).toLocaleString("en-US")}{suffix}</span>;
}

/** Progress bar that fills on mount, with tick marks every 25%. */
export const Meter = ({ pct }: { pct: number }) => (
  <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><b style={{ ["--w" as string]: `${pct}%` }} /><i /><i /><i /></div>
);

export { Icon, SECTOR_ICON };
