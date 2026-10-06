import { useEffect, useRef, useState } from "react";
import { requireAccount } from "@/features/sync";
import { DETAIL_COMPANIES, useCatalog } from "@/features/catalog";
import { askQuestion } from "./db";
import { Icon } from "@/brand/icons";
import { DEALS, MATCH } from "./data";
import { useReducedMotion } from "./hooks";
import { Avatar, PEOPLE, type ProfRef } from "./profiles";

/* Fullscreen pitch from the live catalog. Overlays use only the company's own fields. */
const CH = ["Problem", "Product", "Traction", "Team", "Ask"] as const;
const DUR = 12; // seconds; 6s clip plays at 0.5x

export function PitchPlayer({ id, ids, onClose, onNext, onSave, onPass, onProfile }: {
  id: string; ids: string[]; onClose: () => void; onNext: (id: string) => void; onSave: (id: string) => void; onPass: (id: string) => void; onProfile: (r: ProfRef) => void;
}) {
  useCatalog();
  const d = DEALS.find((x) => x.id === id); const m = MATCH[id]; const founder = PEOPLE.find((p) => p.id === m?.founder);
  const c = DETAIL_COMPANIES[id]; const hasVid = !!m?.pitch;
  const [qErr, setQErr] = useState("");
  const reduced = useReducedMotion();
  const v = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const [qa, setQa] = useState(false);
  const [sent, setSent] = useState(false); const [q, setQ] = useState("");
  const [seekN, setSeekN] = useState(0);
  const ci = Math.min(4, Math.floor((t / DUR) * 5)); const ch = CH[ci];
  const y0 = useRef<number | null>(null);

  useEffect(() => { setT(0); setHot(null); setQa(false); setSent(false); setQ(""); const el = v.current; if (el) { el.playbackRate = 0.5; el.currentTime = 0; if (!reduced) el.play().catch(() => {}); } }, [id, reduced]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") { if (qa) setQa(false); else onClose(); } }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [qa, onClose]);
  useEffect(() => { setHot(null); }, [ci]);
  useEffect(() => { if (hasVid) return; const st = performance.now() - t * 1000; let r = 0; const f = () => { const x = Math.min(DUR, (performance.now() - st) / 1000); setT(x); if (x < DUR) r = requestAnimationFrame(f); }; r = requestAnimationFrame(f); return () => cancelAnimationFrame(r); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seekN]);

  const seek = (i: number) => { setT((i / 5) * DUR + 0.02); const el = v.current; if (hasVid && el) el.currentTime = (i / 5) * (DUR / 2) + 0.01; else setSeekN((k) => k + 1); };
  if (!d) return <div className="pp" role="dialog" aria-modal aria-label="Pitch"><header className="pp-top"><button type="button" className="pp-ic" aria-label="Close pitch" onClick={onClose}><Icon name="close" size={20} /></button></header><section className="pp-focus"><h2>This pitch isn't available.</h2></section></div>;
  const next = ids[(ids.indexOf(id) + 1) % ids.length];
  const tc = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

  return (
    <div className="pp" role="dialog" aria-modal aria-label={`${d.name} pitch`}
      onPointerDown={(e) => { y0.current = e.clientY; }}
      onPointerUp={(e) => { if (y0.current !== null && y0.current - e.clientY > 90 && ids.length > 1 && !qa) onNext(next); y0.current = null; }}>
      {!hasVid && (d.img ? <img src={d.img} alt="" className="pp-v pp-kb" /> : <div className="pp-v" />)}
      <video ref={v} key={id} src={hasVid ? m!.pitch : undefined} style={hasVid ? undefined : { display: "none" }} muted playsInline loop={false} poster={d.img || undefined} className="pp-v"
        onTimeUpdate={(e) => setT(Math.min(DUR, e.currentTarget.currentTime * 2))}
        onEnded={() => setT(DUR)} aria-hidden />
      <div className="pp-shade" />

      <header className="pp-top">
        <button type="button" className="pp-ic" aria-label="Close pitch" onClick={onClose}><Icon name="close" size={20} /></button>
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
        {ch === "Problem" && <h2>{c?.problem || d.line}</h2>}
        {ch === "Product" && (<>
          <h2>{d.line}</h2>
          <div className="pp-hots">{(d.hotspots ?? []).map((h, i) => (
            <button key={h.tag} type="button" className={hot === i ? "on" : ""} aria-expanded={hot === i} onClick={(e) => { e.stopPropagation(); setHot(hot === i ? null : i); }}>
              <span className="pp-ht">{h.title}</span>{hot === i && <em>{h.fact}</em>}
            </button>))}
          </div>
        </>)}
        {ch === "Traction" && <h2>{(c?.traction ?? [])[0] || m?.traction || "Early days."}</h2>}
        {ch === "Team" && founder && (
          <button type="button" className="pp-founder" onClick={(e) => { e.stopPropagation(); onProfile({ kind: "person", id: founder.id }); }}>
            <Avatar p={founder} size={56} /><span><b>{founder.name}</b><small>Founder · tap for profile</small></span><Icon name="forward" size={16} />
          </button>)}
        {ch === "Ask" && (<><h2>{c?.instrument ? `${c.instrument}${c.valuationCap ? ` · ${c.valuationCap} cap` : ""}` : "Terms TBA."}</h2><p className="pp-sub">Save {d.name} to follow along. Investing opens only through a registered funding portal.</p></>)}
      </section>

      <footer className="pp-act">
        <button type="button" className="pp-ic lg" aria-label="Pass" onClick={() => onPass(id)}><Icon name="pass" size={22} /></button>
        <button type="button" className="pp-ic lg" aria-label="Ask a question" onClick={() => requireAccount() && setQa(true)}><Icon name="qa" size={22} /></button>
        <button type="button" className={`pp-ic lg save${ch === "Ask" ? " hl" : ""}`} aria-label="Save" onClick={() => onSave(id)}><Icon name="saved" size={22} /></button>
      </footer>

      {qa && (
        <div className="pp-qa-wrap" onClick={() => setQa(false)}>
          <div className="pp-qa" role="dialog" aria-label="Ask the founder" onClick={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
            <span className="dim">Ask {founder?.name ?? "the founder"}</span>
            {sent ? <h3>Question posted to {d.name}'s Q&amp;A. The answer shows up there.</h3> : (<>
              <h3>What would you ask?</h3>
              <textarea rows={3} value={q} onChange={(e) => setQ(e.target.value)} maxLength={2000} placeholder="e.g. How long does the battery last?" aria-label="Your question" />
              <button type="button" className="pp-send" disabled={!q.trim()} onClick={async () => { const b = q.trim(); if (!b || !requireAccount()) return; setQErr(""); const r = await askQuestion(id, b); if (r.ok) setSent(true); else setQErr(r.missing ? "Q&A opens soon." : r.error ?? "Couldn't send."); }}>Send question</button>
              {qErr && <p className="dim" role="alert">{qErr}</p>}
            </>)}
          </div>
        </div>)}
    </div>
  );
}
