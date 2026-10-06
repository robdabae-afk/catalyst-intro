import { useState } from "react";
import { Head } from "../FeaturesApp";
import { LEARN } from "../data";
import { ICheck, IArrow } from "../icons";
import { setState, useStore } from "../store";

export default function Learn() {
  const [s] = useStore();
  const firstOpen = LEARN.findIndex((c) => !(c.id in s.learned));
  const [i, setI] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [pick, setPick] = useState<number | null>(null);
  const c = LEARN[i];
  const done = Object.keys(s.learned).length;
  const allDone = done === LEARN.length;

  const answer = (k: number) => {
    if (pick !== null) return;
    setPick(k);
    const ok = k === c.answer;
    setState((x) => ({ ...x, learned: { ...x.learned, [c.id]: ok }, streak: ok ? x.streak + 1 : 0,
      steps: Object.keys({ ...x.learned, [c.id]: ok }).length === LEARN.length && !x.steps.includes("learn") ? [...x.steps, "learn"] : x.steps }));
  };
  const next = () => { setPick(null); setI((i + 1) % LEARN.length); };

  return (
    <div className="g-side">
      <div>
        <Head title="Learn" back right={<div className="row" style={{ gap: 10 }}>
          <span className="flame" aria-hidden>{LEARN.map((_, k) => <i key={k} className={k < s.streak ? "on" : ""} />)}</span>
          <span className="mono">{s.streak} streak</span></div>} />
        <div className="lstack" key={c.id}>
          <div className="lcard st">
            <div className="row"><span className="mono dim">Card {i + 1} / {LEARN.length}</span></div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1 }}>{c.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55 }}>{c.body}</p>
            <div style={{ marginTop: "auto" }}>
              <p className="mono" style={{ marginBottom: 10 }}>Quick check · {c.q}</p>
              <div style={{ display: "grid", gap: 8 }}>
                {c.options.map((o, k) => {
                  const cls = pick === null ? "" : k === c.answer ? " right" : k === pick ? " wrong" : "";
                  return <button key={o} className={`opt${cls}`} onClick={() => answer(k)} disabled={pick !== null && cls === ""}>{cls === " right" && <ICheck />}{o}</button>;
                })}
              </div>
              {pick !== null && (
                <div className="row" style={{ marginTop: 14, alignItems: "flex-start" }} role="status">
                  <p className="grow" style={{ fontSize: 13.5 }}><b>{pick === c.answer ? "Correct." : "Not quite."}</b> {c.why}</p>
                  <button className="btn sm" onClick={next}>Next <IArrow size={14} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="note" style={{ marginTop: 28, maxWidth: 520 }}>Educational only, not investment advice. Limits reflect SEC Reg CF rules for non-accredited investors and can change; confirm on sec.gov.</p>
      </div>
      <aside>
        <div className="sec" style={{ marginTop: 22 }}><h2>Series</h2><span className="mono dim">{done}/{LEARN.length}</span></div>
        <div className="bar" style={{ marginBottom: 8 }}><b style={{ width: `${(done / LEARN.length) * 100}%` }} /></div>
        {LEARN.map((x, k) => (
          <button key={x.id} className={`step${x.id in s.learned ? " done" : ""}`} onClick={() => { setPick(null); setI(k); }} aria-current={k === i}>
            <span className="tick">{x.id in s.learned ? <ICheck size={14} /> : <span className="mono">{k + 1}</span>}</span>
            <span className="grow" style={{ fontWeight: k === i ? 700 : 500 }}>{x.title}</span>
          </button>
        ))}
        {allDone && <p style={{ marginTop: 14, fontSize: 13.5 }}><b>Series complete.</b> You'll see these basics again before your first investment.</p>}
      </aside>
    </div>
  );
}
