import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";

export type Screen = { src: string; label: string; alt: string };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Showcase({ screens }: { screens: Screen[] }) {
  const [i, setI] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const n = screens.length;
  const go = (k: number) => setI(((k % n) + n) % n);

  // Scroll-linked tilt + pointer tilt, written straight to CSS vars (no re-render).
  useEffect(() => {
    const el = stage.current;
    if (!el || reduced()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        el.style.setProperty("--sx", `${(p * 14).toFixed(2)}deg`);
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const onMove = (e: PointerEvent) => {
    const el = stage.current;
    if (!el || reduced()) return;
    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      el.style.setProperty("--dx", `${dx}px`);
      if (Math.abs(dx) > 6) drag.current.moved = true;
      return;
    }
    if (e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--py", `${(((e.clientX - r.left) / r.width - 0.5) * 18).toFixed(2)}deg`);
    el.style.setProperty("--px", `${(-((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(2)}deg`);
  };
  const onDown = (e: PointerEvent) => {
    justDragged.current = false;
    drag.current = { x: e.clientX, moved: false };
    stage.current?.classList.add("dragging");
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    const el = stage.current;
    el?.classList.remove("dragging");
    el?.style.setProperty("--dx", "0px");
    if (d) {
      justDragged.current = d.moved;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    }
  };
  const onLeave = (e: PointerEvent) => {
    if (drag.current) onUp(e);
    stage.current?.style.setProperty("--px", "0deg");
    stage.current?.style.setProperty("--py", "0deg");
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  };

  return (
    <div className="show" role="region" aria-roledescription="carousel" aria-label="App screens">
      <div
        ref={stage}
        className="show-stage"
        tabIndex={0}
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onLeave}
        onPointerLeave={onLeave}
      >
        <div className="show-ring">
          {screens.map((s, k) => {
            let o = k - i;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            const a = Math.abs(o);
            return (
              <button
                key={s.src}
                type="button"
                className={"show-phone" + (o === 0 ? " on" : "")}
                style={{ ["--o" as string]: o, ["--a" as string]: a, zIndex: 10 - a, opacity: a > 2 ? 0 : 1, pointerEvents: a > 2 ? "none" : undefined }}
                aria-label={`${s.label}${o === 0 ? " (current)" : ""}`}
                aria-hidden={a > 2}
                tabIndex={-1}
                onClick={() => { if (justDragged.current) { justDragged.current = false; return; } go(k); }}
              >
                <img src={s.src} alt={o === 0 ? s.alt : ""} loading={a > 1 ? "lazy" : "eager"} decoding="async" draggable={false} width={540} height={1170} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="show-ctl">
        <button type="button" className="show-arrow" aria-label="Previous screen" onClick={() => go(i - 1)}>‹</button>
        <div className="show-dots">
          {screens.map((s, k) => (
            <button key={s.src} type="button" aria-label={`Show ${s.label}`} aria-current={k === i} onClick={() => go(k)} />
          ))}
        </div>
        <button type="button" className="show-arrow" aria-label="Next screen" onClick={() => go(i + 1)}>›</button>
      </div>
      <p className="show-cap" aria-live="polite"><b>{screens[i].label}</b></p>
    </div>
  );
}
