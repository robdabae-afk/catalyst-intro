import { useMemo, useRef } from "react";
import { useReducedMotion } from "../store";
import { Head } from "../FeaturesApp";
import { EVENT } from "../data";
import { ICal } from "../icons";
import { Icon } from "../hud";
import { setState, useStore } from "../store";

// Decorative QR-style matrix from a hash of the pass id. Real passes would encode a signed token server-side.
function useMatrix(seed: string, n = 25) {
  return useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const cells: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) cells.push([x, y]);
    return { cells, n };
  }, [seed, n]);
}

const fmt = (d: string) => d.replace(/[-:]/g, "").replace(/\.\d+/, "");
const utc = (iso: string) => fmt(new Date(iso).toISOString()).slice(0, 15) + "Z";

export default function Ticket() {
  const [s] = useStore();
  const { cells, n } = useMatrix(EVENT.pass);
  const start = new Date(EVENT.start);
  const rm = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const tilt = (e: React.PointerEvent) => {
    if (rm || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.current.style.transform = `perspective(900px) rotateY(${(x - .5) * 10}deg) rotateX(${(.5 - y) * 10}deg)`;
    card.current.style.setProperty("--hx", `${x * 100}%`); card.current.style.setProperty("--hy", `${y * 100}%`);
  };
  const untilt = () => { if (card.current) card.current.style.transform = ""; };

  const ics = () => {
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Catalyst//Sample//EN", "BEGIN:VEVENT", `UID:${EVENT.pass}@catalystintro.com`, `DTSTAMP:${utc(new Date().toISOString())}`,
      `DTSTART:${utc(EVENT.start)}`, `DTEND:${utc(EVENT.end)}`, `SUMMARY:${EVENT.title}`, `LOCATION:${EVENT.venue}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = "catalyst-pitch-night.ics"; a.click(); URL.revokeObjectURL(url);
  };
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(EVENT.title)}&dates=${utc(EVENT.start)}/${utc(EVENT.end)}&location=${encodeURIComponent(EVENT.venue)}`;
  const finder = (x: number, y: number) => <g key={`${x}${y}`}><rect x={x} y={y} width="7" height="7" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" /></g>;

  return (
    <div>
      <Head title="Your pass" back />
      <div ref={card} className={`pass${s.checkedIn ? " done" : ""}`} onPointerMove={tilt} onPointerLeave={untilt}>
        <span className="holo" aria-hidden />
        <div className="pass-top">
          <img src="/x/ev-1.jpg" alt="" />
          <span className="pass-seal" aria-hidden>CATALYST<br />· ADMIT ·<br />ONE</span>
          <div className="ph-body">
            <div className="row" style={{ gap: 8 }}><span className="chip-d"><Icon name="ticket" size={12} />Pass</span><span className="sample inv">Sample</span></div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.035em", marginTop: 10, lineHeight: 1 }}>{EVENT.title}</h2>
          </div>
        </div>
        <div className="pass-body">
        <div className="pass-meta">
          <div><div className="mono" style={{ opacity: .55 }}>Date</div><b>{start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })}</b></div>
          <div><div className="mono" style={{ opacity: .55 }}>Doors</div><b>{start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}</b></div>
          <div><div className="mono" style={{ opacity: .55 }}>Where</div><b>{EVENT.venue}</b></div>
        </div>
        <div className="pass-cut" />
        <div style={{ position: "relative" }}>
          <svg className="qr" viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label={`Check-in code for pass ${EVENT.pass}`} shapeRendering="crispEdges">
            {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
            {finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
          </svg>
          {s.checkedIn && <div className="stamp">CHECKED IN</div>}
        </div>
        <div className="seat"><span>{EVENT.pass}</span><span>{EVENT.holder}</span><span>GA</span></div>
        </div>
      </div>
      <div className="row" style={{ maxWidth: 400, margin: "16px auto 0", gap: 8, flexWrap: "wrap" }}>
        <button className="btn grow" onClick={ics}><ICal size={18} />Add to calendar</button>
        <a className="btn ghost grow" href={gcal} target="_blank" rel="noreferrer">Google Calendar</a>
      </div>
      <div style={{ maxWidth: 400, margin: "12px auto 0" }}>
        <button className="btn ghost" style={{ width: "100%" }} onClick={() => setState((x) => ({ ...x, checkedIn: !x.checkedIn }))}>
          {s.checkedIn ? "Undo check-in (demo)" : "Simulate door scan (demo)"}</button>
        <p className="note" style={{ marginTop: 10, textAlign: "center" }}>Show this code at the door. Sample pass for preview; real passes use a signed one-time token.</p>
      </div>
    </div>
  );
}
