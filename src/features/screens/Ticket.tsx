import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useReducedMotion, setState, useStore } from "../store";
import { Head, path } from "../FeaturesApp";
import { EVENTS, useCatalog } from "../catalog";
import { requireAccount } from "../sync";
import { ICal } from "../icons";

const fmt = (d: string) => d.replace(/[-:]/g, "").replace(/\.\d+/, "");
const utc = (iso: string) => fmt(new Date(iso).toISOString()).slice(0, 15) + "Z";
const valid = (d?: string) => !!d && !Number.isNaN(new Date(d).getTime());

export default function Ticket() {
  useCatalog();
  const [s] = useStore();
  const [sp] = useSearchParams();
  const want = sp.get("e");
  const ev = EVENTS.find((e) => e.id === want) ?? EVENTS.find((e) => s.rsvps.includes(e.id));
  const going = !!ev && s.rsvps.includes(ev.id);
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

  if (!ev) return (
    <div><Head title="Your pass" back />
      <div className="card" style={{ maxWidth: 400, margin: "0 auto" }}><b>No pass yet</b>
        <p className="dim" style={{ fontSize: 13.5, marginTop: 6 }}>{EVENTS.length ? "RSVP to an event and your pass shows up here." : "No upcoming events right now."}</p>
        {EVENTS.length > 0 && <Link to={path("events")} className="btn" style={{ marginTop: 14, width: "100%" }}>See events</Link>}
      </div>
    </div>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = ev as any;
  const start: string | undefined = e.start ?? e.startsAt ?? e.starts_at;
  const end: string | undefined = e.end ?? e.endsAt ?? e.ends_at;
  const where: string = e.where ?? e.venue ?? "";
  const hasTime = valid(start);
  const endIso = valid(end) ? end! : hasTime ? new Date(new Date(start!).getTime() + 2 * 3600e3).toISOString() : "";
  const ics = () => {
    if (!hasTime) return;
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Catalyst//Events//EN", "BEGIN:VEVENT", `UID:${ev.id}@catalystintro.com`, `DTSTAMP:${utc(new Date().toISOString())}`,
      `DTSTART:${utc(start!)}`, `DTEND:${utc(endIso)}`, `SUMMARY:${ev.title}`, `LOCATION:${where}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = "catalyst-event.ics"; a.click(); URL.revokeObjectURL(url);
  };
  const gcal = hasTime ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${utc(start!)}/${utc(endIso)}&location=${encodeURIComponent(where)}` : "";
  const d = hasTime ? new Date(start!) : null;

  return (
    <div>
      <Head title="Your pass" back />
      <div ref={card} className="pass" onPointerMove={tilt} onPointerLeave={untilt}>
        <span className="holo" aria-hidden />
        <div className="pass-top">
          {e.img && <img src={e.img} alt="" />}
          <span className="pass-seal" aria-hidden>CATALYST<br />· ADMIT ·<br />ONE</span>
          <div className="ph-body">
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.035em", marginTop: 10, lineHeight: 1 }}>{ev.title}</h2>
          </div>
        </div>
        <div className="pass-body">
          <div className="pass-meta">
            <div><div className="mono" style={{ opacity: .55 }}>Date</div><b>{d ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" }) : e.when ?? "TBA"}</b></div>
            {d && <div><div className="mono" style={{ opacity: .55 }}>Doors</div><b>{d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}</b></div>}
            {where && <div className="pm-w"><div className="mono" style={{ opacity: .55 }}>Where</div><b>{where}</b></div>}
          </div>
          <div className="pass-cut" />
          <p className="mono" style={{ textAlign: "center", padding: "8px 0" }}>{going ? "RSVP CONFIRMED" : "NOT RSVPED"}</p>
        </div>
      </div>
      <div className="row" style={{ maxWidth: 400, margin: "16px auto 0", gap: 8, flexWrap: "wrap" }}>
        {!going && <button className="btn grow" onClick={() => requireAccount() && setState((x) => ({ ...x, rsvps: [...new Set([...x.rsvps, ev.id])] }))}>RSVP</button>}
        {hasTime && <button className="btn grow" onClick={() => { ics(); setState((x) => ({ ...x, steps: x.steps.includes("event") ? x.steps : [...x.steps, "event"] })); }}><ICal size={18} />Add to calendar</button>}
        {hasTime && <a className="btn ghost grow" href={gcal} target="_blank" rel="noreferrer">Google Calendar</a>}
      </div>
      <p className="note" style={{ maxWidth: 400, margin: "12px auto 0", textAlign: "center" }}>Check in at the door with the name on your account.</p>
    </div>
  );
}
