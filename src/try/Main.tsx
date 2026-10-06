import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COMMUNITY_PHOTO, COMMUNITY_SIZE, DEALS, Deal, EVENTS, SECTORS, money, regCfLimit, usd } from "./data";
import { toggle, useTry } from "./store";
import { Art, I, Ic, Mark, Progress, Shell } from "./ui";
import { SwipeAction } from "../brand/Button";

function useToast() {
  const [t, setT] = useState<string | null>(null);
  const tm = useRef<number>();
  const show = (m: string) => { setT(m); window.clearTimeout(tm.current); tm.current = window.setTimeout(() => setT(null), 1800); };
  return [t ? <div className="toast" role="status">{t}</div> : null, show] as const;
}

/* ---------------- Swipe ---------------- */
function CardBody({ d }: { d: Deal }) {
  return (
    <div className="bd">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <b style={{ fontSize: 24, letterSpacing: "-.03em" }}>{d.name}</b><span className="sample">Sample</span>
      </div>
      <div style={{ color: "var(--mute)", fontSize: 15, marginTop: 4 }}>{d.line}</div>
      <div className="terms">
        <div><span className="lbl">Min</span><b className="num">${d.min}</b></div>
        <div><span className="lbl">Cap</span><b className="num">{d.cap}</b></div>
        <div><span className="lbl">Type</span><b>{d.type}</b></div>
        <div><span className="lbl">Left</span><b className="num">{d.daysLeft}d</b></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Progress deal={d} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--mute)", marginTop: 8 }}>
          <span><b className="num" style={{ color: "var(--ink)" }}>{money(d.raised)}</b> of {money(d.goal)}</span><span>{d.sector} · {d.city}</span>
        </div>
      </div>
    </div>
  );
}

export function Swipe() {
  const [s, set] = useTry();
  const nav = useNavigate();
  const [toast, show] = useToast();
  const queue = DEALS.filter((d) => !s.saved.includes(d.id) && !s.passed.includes(d.id))
    .sort((a, b) => Number(s.interests.includes(b.sector)) - Number(s.interests.includes(a.sector)));
  const top = queue[0];
  const [drag, setDrag] = useState({ x: 0, y: 0, on: false });
  const [fly, setFly] = useState<null | "l" | "r" | "u">(null);
  const start = useRef({ x: 0, y: 0 });

  const commit = (dir: "l" | "r" | "u") => {
    if (!top || fly) return;
    setFly(dir);
    window.setTimeout(() => {
      if (dir === "l") { set((x) => ({ ...x, passed: [...x.passed, top.id] })); show(`Passed on ${top.name}`); }
      if (dir === "r") { set((x) => ({ ...x, saved: [...x.saved, top.id] })); show(`Saved ${top.name}`); }
      setFly(null); setDrag({ x: 0, y: 0, on: false });
      if (dir === "u") nav(`/app/invest/${top.id}`);
    }, 260);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") commit("l");
      if (e.key === "ArrowRight") commit("r");
      if (e.key === "ArrowUp") commit("u");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const onDown = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); start.current = { x: e.clientX, y: e.clientY }; setDrag({ x: 0, y: 0, on: true }); };
  const onMove = (e: React.PointerEvent) => { if (drag.on) setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, on: true }); };
  const onUp = () => {
    if (!drag.on) return;
    const { x, y } = drag;
    if (y < -110 && Math.abs(y) > Math.abs(x)) commit("u");
    else if (x > 110) commit("r");
    else if (x < -110) commit("l");
    else if (Math.abs(x) < 6 && Math.abs(y) < 6 && top) nav(`/app/deal/${top.id}`);
    else setDrag({ x: 0, y: 0, on: false });
    if (!(y < -110 || Math.abs(x) > 110)) setDrag({ x: 0, y: 0, on: false });
  };

  const fx = fly === "l" ? -600 : fly === "r" ? 600 : drag.x;
  const fy = fly === "u" ? -800 : drag.y;
  const style: React.CSSProperties = {
    transform: `translate(${fx}px, ${fy}px) rotate(${fx / 18}deg)`,
    transition: drag.on && !fly ? "none" : "transform .28s cubic-bezier(.2,.8,.2,1)",
  };
  const op = (v: number) => Math.max(0, Math.min(1, v / 110));

  return (
    <Shell title="Swipe" right={<span className="chip" style={{ padding: "6px 12px", fontSize: 12 }}>For you</span>}>
      {top ? (
        <>
          <div className="deck">
            {queue[2] && <div className="cd b2" />}
            {queue[1] && <div className="cd b1"><Art deal={queue[1]} label={false} /><CardBody d={queue[1]} /></div>}
            <div className="cd f" key={top.id} style={style} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              role="group" aria-label={`${top.name}, sample deal. Drag right to save, left to pass, up to invest. Tap for details.`}>
              <Art deal={top} />
              <div className="stamp save" style={{ opacity: fly === "r" ? 1 : op(drag.x) }}>Save</div>
              <div className="stamp pass" style={{ opacity: fly === "l" ? 1 : op(-drag.x) }}>Pass</div>
              <div className="stamp inv" style={{ opacity: fly === "u" ? 1 : op(-drag.y) }}>Invest</div>
              <CardBody d={top} />
            </div>
          </div>
          <div className="acts">
            <SwipeAction kind="pass" onClick={() => commit("l")} />
            <button className="csw csw-save big" onClick={() => commit("u")} aria-label="Invest"><Ic d={I.invest} size={26} /></button>
            <button className="csw csw-pass" onClick={() => commit("r")} aria-label="Save"><Ic d={I.save} /></button>
          </div>
          <div className="hint"><span>← Pass</span><span>↑ Invest</span><span>Save →</span></div>
        </>
      ) : (
        <div className="pad" style={{ maxWidth: 420, margin: "40px auto 0" }}>
          <div className="h1">You're all caught up.</div>
          <p className="sub" style={{ margin: "10px 0 22px" }}>You've seen every sample deal. Check what you saved, or start over.</p>
          <Link to="/app/holdings" className="btn">See saved deals</Link>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => set((x) => ({ ...x, passed: [] }))}>Show passed deals again</button>
        </div>
      )}
      {toast}
    </Shell>
  );
}

/* ---------------- Discover ---------------- */
export function Discover() {
  const [f, setF] = useState<(typeof SECTORS)[number]>("All");
  const [s, set] = useTry();
  const [q, setQ] = useState<string | null>(null);
  const t = (q || "").trim().toLowerCase();
  const list = DEALS.filter((d) => (f === "All" || d.sector === f) && (!t || `${d.name} ${d.line} ${d.sector}`.toLowerCase().includes(t)));
  const [feat, ...rest] = list;
  return (
    <Shell title="Discover" right={<button className="ic" aria-label={q === null ? "Search" : "Close search"} onClick={() => setQ(q === null ? "" : null)}><Ic d={q === null ? I.search : I.close} size={18} /></button>}>
      {q !== null && <div className="pad" style={{ paddingBottom: 18 }}><input className="srch" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sample startups" aria-label="Search sample startups" /></div>}
      <div className="pad">
        <div className="h1" style={{ fontSize: 30 }}>Own a piece of what's next.</div>
        <p className="sub" style={{ margin: "6px 0 16px" }}>Startups you can back from $100. All companies shown are samples.</p>
      </div>
      <div className="chips pad" style={{ paddingBottom: 14 }}>
        {SECTORS.map((k) => <button key={k} className={`chip ${f === k ? "on" : ""}`} onClick={() => setF(k)}>{k}</button>)}
      </div>
      <div className="pad">
        {feat ? (
          <Link to={`/app/deal/${feat.id}`} className="feat"><Art deal={feat} style={{ position: "absolute", inset: 0 }} /><div className="ov" />
            <div className="tx"><span className="lbl" style={{ color: "#ccc" }}>Raising now</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 4 }}>
                <b style={{ fontSize: 22, letterSpacing: "-.03em" }}>{feat.name}</b>
                <span className="sample" style={{ borderColor: "#fff" }}>Sample</span></div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{feat.line}</div></div></Link>
        ) : <div className="empty">{t ? `Nothing matches "${q}" yet.` : "No sample deals in this category yet."}</div>}
        <div className="dgrid" style={{ marginTop: 6 }}>
          {rest.map((d) => (
            <div className="card" key={d.id}>
              <div className="row">
                <Link to={`/app/deal/${d.id}`}><Mark deal={d} /></Link>
                <Link to={`/app/deal/${d.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><b style={{ fontSize: 17 }}>{d.name}</b><span className="sample">Sample</span></div>
                  <div className="sub" style={{ fontSize: 14 }}>{d.line}</div>
                </Link>
                <button className="ic" aria-label={s.saved.includes(d.id) ? "Unsave" : "Save"} aria-pressed={s.saved.includes(d.id)}
                  style={s.saved.includes(d.id) ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : {}}
                  onClick={() => set((x) => ({ ...x, saved: toggle(x.saved, d.id) }))}><Ic d={I.mark} size={16} /></button>
              </div>
              <div className="meta"><span><b className="num">{d.cap}</b> cap</span><span>{d.type}</span><span><b className="num">{d.daysLeft}</b> days left</span><span>{d.sector}</span></div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- Portfolio ---------------- */
export function Portfolio() {
  const [s, set] = useTry();
  const [tab, setTab] = useState<"saved" | "holdings">("saved");
  const saved = DEALS.filter((d) => s.saved.includes(d.id));
  const lim = regCfLimit(s.income, s.netWorth);
  return (
    <Shell title="Portfolio">
      <div className="pad" style={{ maxWidth: 720 }}>
        <div className="st" style={{ marginBottom: 18 }}>
          <div><span className="lbl">Invested</span><b className="num">$0</b></div>
          <div><span className="lbl">Saved</span><b className="num">{saved.length}</b></div>
          <div><span className="lbl">Est. limit</span><b className="num">{money(lim)}</b></div>
        </div>
        <div className="seg">
          <button className={tab === "saved" ? "on" : ""} onClick={() => setTab("saved")}>Saved</button>
          <button className={tab === "holdings" ? "on" : ""} onClick={() => setTab("holdings")}>Holdings</button>
        </div>
        <div style={{ marginTop: 14 }}>
          {tab === "saved" ? (
            saved.length ? saved.map((d) => (
              <div className="ev" key={d.id}>
                <Link to={`/app/deal/${d.id}`}><Mark deal={d} /></Link>
                <Link to={`/app/deal/${d.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><b>{d.name}</b><span className="sample">Sample</span></div>
                  <div className="sub" style={{ fontSize: 13 }}>{money(d.raised)} of {money(d.goal)} · {d.daysLeft} days left</div>
                </Link>
                <button className="go" onClick={() => set((x) => ({ ...x, saved: x.saved.filter((i) => i !== d.id) }))}>Remove</button>
              </div>
            )) : <div className="empty">Nothing saved yet. Swipe right on a deal, or tap the bookmark in Discover. <Link className="u" to="/app/swipe" style={{ color: "var(--ink)" }}>Start swiping</Link></div>
          ) : (
            <>
              <div className="empty">No holdings yet. Investing opens soon through an SEC-registered funding portal. When it does, companies you back show up here with updates from the founders.</div>
              {s.intents.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <span className="lbl">Your interest so far</span>
                  {s.intents.map((it) => {
                    const d = DEALS.find((x) => x.id === it.id);
                    return d && <div className="ev" key={it.id}><Mark deal={d} size={36} /><div style={{ flex: 1 }}><b>{d.name}</b> <span className="sample">Sample</span><div className="sub" style={{ fontSize: 13 }}>Not invested · no money moved</div></div><b className="num">{usd(it.amount)}</b></div>;
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- Events ---------------- */
export function Events() {
  const [s, set] = useTry();
  const [hero, ...rest] = EVENTS;
  const Rsvp = ({ id }: { id: string }) => {
    const on = s.rsvps.includes(id);
    return <button className={`go ${on ? "on" : ""}`} aria-pressed={on} onClick={() => set((x) => ({ ...x, rsvps: toggle(x.rsvps, id) }))}>{on ? "Going ✓" : "RSVP"}</button>;
  };
  return (
    <Shell title="Events">
      <div className="pad">
        <p className="sub" style={{ marginBottom: 14 }}>Meet founders in person with the Catalyst community, {COMMUNITY_SIZE} people and counting.</p>
        <div className="evgrid">
          <div>
            <Link to={`/app/events/${hero.id}`} className="evhero photo" style={{ backgroundImage: `url(${hero.photo})`, display: "block", color: "#fff" }}><div className="ov" />
              <div className="tx"><span className="dt" style={{ color: "#ddd" }}>{hero.date}</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 10, marginTop: 4 }}>
                  <div><b style={{ fontSize: 22, letterSpacing: "-.03em" }}>{hero.title}</b><div style={{ fontSize: 13, opacity: 0.8 }}>{hero.place} · {hero.blurb}</div></div>
                </div></div></Link>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
              <span className="sub" style={{ fontSize: 13 }}>Photo from a past Catalyst event</span><Rsvp id={hero.id} />
            </div>
          </div>
          <div>
            <span className="lbl">Coming up</span>
            {rest.map((e) => (
              <div className="ev" key={e.id}>
                <div className="photo" style={{ backgroundImage: `url(${e.photo})` }} role="img" aria-label="Past Catalyst event" />
                <Link to={`/app/events/${e.id}`} style={{ minWidth: 0, flex: 1 }}><div className="dt">{e.date}</div><b style={{ display: "block" }}>{e.title}</b><div className="sub" style={{ fontSize: 13 }}>{e.place}</div></Link>
                <Rsvp id={e.id} />
              </div>
            ))}
            <p className="sub" style={{ fontSize: 12, marginTop: 12 }}>Preview schedule. RSVPs stay on this device.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- Profile ---------------- */
export function Profile() {
  const [s, set] = useTry();
  const nav = useNavigate();
  return (
    <Shell title="Profile">
      <div className="pad" style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="av">Y</div>
          <div><b style={{ fontSize: 22, letterSpacing: "-.03em" }}>You</b><div className="sub" style={{ fontSize: 14 }}>Preview account · nothing is saved to a server</div></div>
        </div>
        <div className="st" style={{ margin: "20px 0 8px" }}>
          <div><span className="lbl">Saved</span><b className="num">{s.saved.length}</b></div>
          <div><span className="lbl">RSVPs</span><b className="num">{s.rsvps.length}</b></div>
          <div><span className="lbl">Est. limit</span><b className="num">{money(regCfLimit(s.income, s.netWorth))}</b></div>
        </div>
        <Link className="it" to="/app/account">Settings<span>Identity, limit, bank, alerts →</span></Link>
        <Link className="it" to="/app/welcome/4">Interests<span>{s.interests.join(", ") || "None"}</span></Link>
        <Link className="it" to="/app/welcome/5">Money check<span className="num">{usd(regCfLimit(s.income, s.netWorth))} est.</span></Link>
        <button className="it" onClick={() => set((x) => ({ ...x, notify: !x.notify }))} aria-pressed={s.notify}>Notifications<i className={`sw ${s.notify ? "on" : ""}`} /></button>
        <Link className="it" to="/app/welcome/6">How startup investing works<span>→</span></Link>
        <Link className="it" to="/terms">Terms<span>→</span></Link>
        <Link className="it" to="/privacy">Privacy<span>→</span></Link>
        <div className="evhero photo" style={{ backgroundImage: `url(${COMMUNITY_PHOTO})`, height: 150, marginTop: 22 }}><div className="ov" />
          <div className="tx"><b style={{ fontSize: 18 }}>Join the real waitlist</b><div style={{ fontSize: 13, opacity: 0.85 }}>Be first in when investing opens.</div></div></div>
        <Link to="/signup" className="btn" style={{ marginTop: 12 }}>Join the waitlist</Link>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { localStorage.removeItem("catalyst-try-v1"); nav("/app/welcome"); }}>Reset preview</button>
      </div>
    </Shell>
  );
}
