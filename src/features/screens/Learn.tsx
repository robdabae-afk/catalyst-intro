import { useRef, useState } from "react";
import { Icon } from "../hud";
import { Head } from "../FeaturesApp";
import { LEARN } from "../data";
import { ICheck, } from "../icons";
import { setState, useStore } from "../store";

export default function Learn() {
  const [s] = useStore();
  const firstOpen = LEARN.findIndex((c) => !s.learned[c.id]);
  const [i, setI] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [pick, setPick] = useState<number | null>(null);
  const c = LEARN[i];
  const done = LEARN.filter((c) => s.learned[c.id]).length;
  const allDone = done === LEARN.length;

  const answer = (k: number) => {
    if (pick !== null) return;
    setPick(k);
    const ok = k === c.answer;
    // only a correct answer counts; a wrong one can be retried and never marks the card done
    void Promise.resolve(setState((x) => {
      const learned = ok ? { ...x.learned, [c.id]: true } : x.learned;
      const all = LEARN.every((q) => learned[q.id]);
      return { ...x, learned, streak: ok ? x.streak + 1 : 0, steps: all && !x.steps.includes("learn") ? [...x.steps, "learn"] : x.steps };
    })).then((saved) => { if (!saved) setPick(null); });
  };
  const go = (d: number) => { setPick(null); setDx(0); setI((i + d + LEARN.length) % LEARN.length); };
  const next = () => go(1);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const x0 = useRef<number | null>(null);
  const down = (e: React.PointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; x0.current = e.clientX; setDrag(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { if (x0.current !== null) setDx(e.clientX - x0.current); };
  const up = () => { if (x0.current === null) return; x0.current = null; setDrag(false); if (dx < -90) go(1); else if (dx > 90) go(-1); else setDx(0); };
  const ART = ["/x/deal-tally.jpg", "/x/ev-2.jpg", "/x/deal-lumen.jpg", "/x/ev-1.jpg", "/x/deal-gridline.jpg"];

  return (
    <div className="g-side">
      <div>
        <Head title="Learn" back right={<div className="row" style={{ gap: 10 }}>
          
          <span className="mono">{s.streak} streak</span></div>} />
        <div className="deck">
          {[2, 1].map((o) => { const b = LEARN[(i + o) % LEARN.length]; return (
            <div key={b.id + o} className={`lcard back${o}`} aria-hidden><div className="lc-art"><img src={ART[(i + o) % LEARN.length]} alt="" /><span className="big">0{((i + o) % LEARN.length) + 1}</span></div><div className="lc-in"><h2 style={{ fontSize: 24, fontWeight: 800 }}>{b.title}</h2></div></div>); })}
          <div key={c.id} className={`lcard st${drag ? " drag" : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            style={{ transform: `translateX(${dx}px) rotate(${dx / 22}deg)` }}>
            <span className="stamp-l nx" style={{ opacity: Math.min(1, -dx / 90) }}>NEXT</span>
            <span className="stamp-l pv" style={{ opacity: Math.min(1, dx / 90) }}>BACK</span>
            <div className="lc-art"><img src={ART[i]} alt="" draggable={false} />
              <span className="hud-tag mono" style={{ left: 16 }}>Card {i + 1} / {LEARN.length}</span>
              <span className="big">0{i + 1}</span>
            </div>
            <div className="lc-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.1 }}>{c.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55 }}>{c.body}</p>
            <div style={{ marginTop: "auto" }}>
              <p className="mono" style={{ marginBottom: 10 }}>Quick check · {c.q}</p>
              <div style={{ display: "grid", gap: 8 }}>
                {c.options.map((o, k) => {
                  const cls = pick === null ? "" : k === c.answer ? " right" : k === pick ? " wrong" : "";
                  return <button key={o} className={`opt${cls}`} onClick={() => answer(k)} disabled={pick !== null && cls === ""}>{cls === " right" && <ICheck />}{o}</button>;
                })}
              </div>
              {pick !== null && <p style={{ fontSize: 13.5, marginTop: 12 }} role="status"><b>{pick === c.answer ? "Correct." : "Not quite."}</b> {c.why}</p>}
              {pick !== null && pick !== c.answer && <button type="button" className="opt retry" onClick={() => setPick(null)}>Try again</button>}
            </div>
            </div>
          </div>
        </div>
        <div className="deck-ctl">
          <button className="ib" onClick={() => go(-1)} aria-label="Previous card"><Icon name="back" size={18} /></button>
          <span className="dots">{LEARN.map((x, k) => <i key={x.id} className={k === i ? "on" : s.learned[x.id] ? "ok" : ""} />)}</span>
          <button className="ib" onClick={next} aria-label="Next card" style={pick !== null ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined}><Icon name="forward" size={18} /></button>
        </div>
        
        <p className="note" style={{ marginTop: 28, maxWidth: 520 }}>Educational only, not investment advice. Limits reflect SEC Reg CF rules for non-accredited investors and can change; confirm on sec.gov.</p>
      </div>
      <aside>
        <div className="sec" style={{ marginTop: 22 }}><h2>Series</h2><span className="mono dim">{done}/{LEARN.length}</span></div>
        <div className="bar" style={{ marginBottom: 8 }}><b style={{ width: `${(done / LEARN.length) * 100}%` }} /></div>
        {LEARN.map((x, k) => (
          <button key={x.id} className={`step${s.learned[x.id] ? " done" : ""}`} onClick={() => { setPick(null); setI(k); }} aria-current={k === i}>
            <span className="tick">{s.learned[x.id] ? <ICheck size={14} /> : <span className="mono">{k + 1}</span>}</span>
            <span className="grow" style={{ fontWeight: k === i ? 700 : 500 }}>{x.title}</span>
          </button>
        ))}
        {allDone && <p style={{ marginTop: 14, fontSize: 13.5 }}><b>Series complete.</b> You'll see these basics again before your first investment.</p>}
      </aside>
    </div>
  );
}
