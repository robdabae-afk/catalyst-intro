import { useEffect, useRef, useState, type RefObject } from "react";

export function useReducedMotion() {
  const [r, set] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => set(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/* Shared gyro reading (-1..1), one listener for the whole page. */
const gyro = { x: 0, y: 0, on: false };
function startGyro() {
  if (gyro.on || typeof window === "undefined") return;
  gyro.on = true;
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    gyro.x = Math.max(-1, Math.min(1, e.gamma / 25));
    gyro.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
  });
}

/* Writes smoothed --px/--py (-1..1) onto the element from pointer or tilt. */
export function useParallax(ref: RefObject<HTMLElement>, reduced: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    startGyro();
    let tx = 0, ty = 0, x = 0, y = 0, hover = false, raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      hover = true;
    };
    const leave = () => { hover = false; tx = 0; ty = 0; };
    const tick = () => {
      const gx = hover ? tx : gyro.x, gy = hover ? ty : gyro.y;
      x += (gx - x) * 0.08; y += (gy - y) * 0.08;
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [ref, reduced]);
}

export function useInView<T extends HTMLElement>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [v, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, v];
}

/* Eased count-up from 0 to target once `go` is true. */
export function useCountUp(target: number, go: boolean, reduced: boolean, ms = 1400) {
  const [v, set] = useState(reduced ? target : 0);
  useEffect(() => {
    if (!go) return;
    set(0);
    if (reduced) { set(target); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      set(Math.min(target, target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, go, reduced, ms]);
  return v;
}

/* Sample "live" ticker: bumps by 1 at random intervals, returns count + pop key. */
export function useTicker(start: number, reduced: boolean, lo = 2600, hi = 6000) {
  const [n, set] = useState(start);
  const [pop, setPop] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => { set((c) => c + 1); setPop((p) => p + 1); next(); }, lo + Math.random() * (hi - lo));
    };
    next();
    return () => clearTimeout(t);
  }, [reduced, lo, hi]);
  return [n, pop] as const;
}
