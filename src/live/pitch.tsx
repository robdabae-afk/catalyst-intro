import { useEffect, useRef, useState } from "react";
import { setState } from "@/features/store";
import { Icon } from "@/brand/icons";
import { DEALS, MATCH } from "./data";
import { useCountUp, useReducedMotion } from "./hooks";
import { Avatar, PEOPLE, type ProfRef } from "./profiles";

/* Fullscreen sample pitch. One focal overlay at a time, synced to the active chapter. All content is SAMPLE. */
const CH = ["Problem", "Product", "Traction", "Team", "Ask"] as const;
type Ch = (typeof CH)[number];
const COPY: Record<string, Record<Ch, string>> = {
  lumen: { Problem: "Group conversations move too fast for people with hearing loss. Most just nod along.", Product: "", Traction: "", Team: "", Ask: "" },
  gridline: { Problem: "Peak-hour power is the dirtiest and most expensive power on the grid.", Product: "", Traction: "", Team: "", Ask: "" },
  tally: { Problem: "Small businesses lose hours every week to paper receipts.", Product: "", Traction: "", Team: "", Ask: "" },
};
const TRAC: Record<string, { n: number; label: string }> = { lumen: { n: 1200, label: "on the waitlist" }, gridline: { n: 40, label: "homes in the pilot" }, tally: { n: 2100, label: "businesses using it" } };
const CLEAN = new Set(["lumen"]); // clips without burned-in HUD text
const DUR = 12; // seconds; 6s clip plays at 0.5x

export function PitchPlayer({ id, ids, onClose, onNext, onSave, onPass, onProfile }: {
  id: string; ids: string[]; onClose: () => void; onNext: (id: string) => void; onSave: (id: string) => void; onPass: (id: string) => void; onProfile: (r: ProfRef) => void;
}) {
  const d = DEALS.find((x) => x.id === id)!; const m = MATCH[id]; const founder = PEOPLE.find((p) => p.id === m.founder)!;
  const reduced = useReducedMotion();
  const v = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const [qa, setQa] = useState(false);
  const [sent, setSent] = useState(false); const [q, setQ] = useState("");
  const [seekN, setSeekN] = useState(0);
  const ci = Math.min(4, Math.floor((t / DUR) * 5)); const ch = CH[ci];
  const n = useCountUp(TRAC[id].n, ch === "Traction", reduced, 1100);
  const y0 = useRef<number | null>(null);

  useEffect(() => { setT(0); setHot(null); setQa(false); setSent(false); setQ(""); const el = v.current; if (el) { el.playbackRate = 0.5; el.currentTime = 0; if (!reduced) el.play().catch(() => {}); } }, [id, reduced]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") qa ? setQa(false) : onClose(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [qa, onClose]);
  useEffect(() => { setHot(null); }, [ci]);
  useEffect(() => { if (CLEAN.has(id)) return; const st = performance.now() - t * 1000; let r = 0; const f = () => { const x = Math.min(DUR, (performance.now() - st) / 1000); setT(x); if (x < DUR) r = requestAnimationFrame(f); }; r = requestAnimationFrame(f); return () => cancelAnimationFrame(r); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seekN]);

  const seek = (i: number) => { setT((i / 5) * DUR + 0.02); const el = v.current; if (CLEAN.has(id) && el) el.currentTime = (i / 5) * (DUR / 2) + 0.01; else setSeekN((k) => k + 1); };
  const next = ids[(ids.indexOf(id) + 1) % ids.length];
  const tc = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <div className="pp" role="dialog" aria-modal aria-label={`${d.name} sample pitch`}
      onPointerDown={(e) => { y0.current = e.clientY; }}
      onPointerUp={(e) => { if (y0.current !== null && y0.current - e.clientY > 90 && ids.length > 1 && !qa) onNext(next); y0.current = null; }}>
      {!CLEAN.has(id) && <img src={d.img} alt="" className="pp-v pp-kb" />}
      <video ref={v} key={id} src={CLEAN.has(id) ? m.pitch : undefined} style={CLEAN.has(id) ? undefined : { display: "none" }} muted playsInline loop={false} poster={d.img} className="pp-v"
        onTimeUpdate={(e) => setT(Math.min(DUR, e.currentTarget.currentTime * 2))}
        onEnded={() => setT(DUR)} aria-hidden />
      <div className="pp-shade" />

      <header className="pp-top">
        <button type="button" className="pp-ic" aria-label="Close pitch" onClick={onClose}><Icon name="close" size={20} /></button>
        <span className="pp-tag">Sample</span>
      </header>

      <nav className="pp-rail" aria-label="Chapters">
        {CH.map((c, i) => (
          <button key={c} type="button" className={i === ci ? "on" : i < ci ? "done" : ""} aria-current={i === ci} onClick={() => seek(i)}>
            <i><b style={{ width: i < ci ? "100%" : i === ci ? `${((t / DUR) * 5 - i) * 100}%` : 0 }} /></i><span>{c}</span>
          </button>
        ))}
      </nav>

      {/* the single focal overlay for this chapter */}
      <section className="pp-focus" key={ch} aria-live="polite">
        {ch === "Problem" && <h2>{COPY[id].Problem}</h2>}
        {ch === "Product" && (<>
          <h2>{d.line}</h2>
          <div className="pp-hots">{d.hotspots.map((h, i) => (
            <button key={h.tag} type="button" className={hot === i ? "on" : ""} aria-expanded={hot === i} onClick={(e) => { e.stopPropagation(); setHot(hot === i ? null : i); }}>
              <span className="pp-ht">{h.title}</span>{hot === i && <em>{h.fact}</em>}
            </button>))}
          </div>
        </>)}
        {ch === "Traction" && (<><div className="pp-big">{n.toLocaleString("en-US")}</div><h2 className="pp-sub">{TRAC[id].label}</h2></>)}
        {ch === "Team" && (
          <button type="button" className="pp-founder" onClick={(e) => { e.stopPropagation(); onProfile({ kind: "person", id: founder.id }); }}>
            <Avatar p={founder} size={56} /><span><b>{founder.name}</b><small>Founder · tap for profile</small></span><Icon name="forward" size={16} />
          </button>)}
        {ch === "Ask" && (<><h2>Investing opens soon.</h2><p className="pp-sub">Save {d.name} and we'll tell you when it does.</p></>)}
      </section>

      <footer className="pp-act">
        <button type="button" className="pp-ic lg" aria-label="Pass" onClick={() => onPass(id)}><Icon name="pass" size={22} /></button>
        <button type="button" className="pp-ic lg" aria-label="Ask a question" onClick={() => setQa(true)}><Icon name="qa" size={22} /></button>
        <button type="button" className={`pp-ic lg save${ch === "Ask" ? " hl" : ""}`} aria-label="Save" onClick={() => onSave(id)}><Icon name="saved" size={22} /></button>
      </footer>

      {qa && (
        <div className="pp-qa-wrap" onClick={() => setQa(false)}>
          <div className="pp-qa" role="dialog" aria-label="Ask the founder" onClick={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
            <span className="dim">Ask {founder.name}</span>
            {sent ? <h3>Question saved. It's on {d.name}'s Q&amp;A, and you'll see the answer there.</h3> : (<>
              <h3>What would you ask?</h3>
              <textarea rows={3} value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000} placeholder="e.g. How long does the battery last?" aria-label="Your question" />
              <button type="button" className="pp-send" disabled={!q.trim()} onClick={() => { const b = q.trim(); if (!b) return; setState((s) => ({ ...s, qs: { ...s.qs, [id]: [b, ...(s.qs[id] ?? [])] } })); setSent(true); }}>Send question</button>
            </>)}
          </div>
        </div>)}
    </div>
  );
}
