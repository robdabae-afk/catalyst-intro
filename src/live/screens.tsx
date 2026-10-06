import { useState } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { Button, Chip, IconButton } from "@/brand/Button";
import { DEALS, EVENTS, usd } from "./data";
import { LiveImage, Sparkline, Ticker, useClock } from "./parts";
import { useCountUp, useInView, useReducedMotion } from "./hooks";

/* All figures below are SAMPLE data for UI preview only. */

function Top({ l, r }: { l: string; r?: string }) { const c = useClock(); return <header className="lv-top"><div className="lv-mono">{l}</div><div className="lv-mono dim">{r ?? c}</div></header>; }

function Count({ to, fmt = (n: number) => Math.round(n).toLocaleString("en-US") }: { to: number; fmt?: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<HTMLSpanElement>();
  return <span ref={ref}>{fmt(useCountUp(to, seen, reduced))}</span>;
}

/* ---------- PORTFOLIO ---------- */
const HOLD = [
  { d: DEALS[0], amt: 250 }, { d: DEALS[1], amt: 150 }, { d: DEALS[2], amt: 500 },
];
export function PortfolioView() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const total = HOLD.reduce((s, h) => s + h.amt, 0);
  return (
    <div className="lv-pf">
      <Top l="PORTFOLIO" />
      <div ref={ref} className="lv-pf-hero">
        <span className="lv-pill dk"><i />SAMPLE PORTFOLIO</span>
        <div className="lv-big xl"><Count to={total} fmt={usd} /></div>
        <div className="lv-mono dim">COMMITTED · 3 STARTUPS · NOT INVESTMENT RETURNS</div>
        <div className="lv-alloc">
          {HOLD.map((h, k) => <i key={k} style={{ flexGrow: h.amt, transitionDelay: `${k * 120}ms`, opacity: 1 - k * 0.28 }} className={seen ? "in" : ""} />)}
        </div>
      </div>
      <ul className="lv-list">
        {HOLD.map(({ d, amt }) => (
          <li key={d.id} className="lv-li">
            <LiveImage src={d.img} intro={false} className="lv-thumb" />
            <div className="lv-li-m"><strong>{d.name}</strong><span className="lv-mono dim">{d.cat.toUpperCase()} · {d.days}D LEFT IN RAISE</span></div>
            <div className="lv-li-r"><b>{usd(amt)}</b><Sparkline data={d.spark} go={seen} w={52} h={16} /></div>
          </li>
        ))}
      </ul>
      <div className="lv-tele lv-mono"><span>REG CF LIMIT <b>$2,500</b></span><span>USED <b>{Math.round((total / 2500) * 100)}%</b></span><span className="dim">SAMPLE</span></div>
    </div>
  );
}

/* ---------- PROFILE ---------- */
export function ProfileView({ isAdmin = false, onAdmin }: { isAdmin?: boolean; onAdmin?: () => void }) {
  const [tags, setTags] = useState<Record<string, boolean>>({ Fintech: true, Climate: true, Software: false, Hardware: true });
  return (
    <div className="lv-prof">
      <Top l="PROFILE" />
      <div className="lv-prof-h">
        <div className="lv-avatar"><span>JR</span><svg viewBox="0 0 80 80" aria-hidden><circle cx="40" cy="40" r="37" pathLength={1} /></svg></div>
        <div><h3>Jordan R.</h3><div className="lv-mono dim">SAMPLE MEMBER · BROOKLYN</div></div>
      </div>
      <div className="lv-stats">
        <div><em>SAVED</em><b><Count to={14} /></b></div>
        <div><em>EVENTS</em><b><Count to={6} /></b></div>
        <div><em>BACKED</em><b><Count to={3} /></b></div>
      </div>
      <div className="lv-sec">
        <div className="lv-mono dim">INTERESTS</div>
        <div className="lv-chips">{Object.keys(tags).map((t) => <Chip key={t} on={tags[t]} onClick={() => setTags({ ...tags, [t]: !tags[t] })}>{t}</Chip>)}</div>
      </div>
      <div className="lv-sec">
        <div className="lv-mono dim">VERIFICATION</div>
        {([["identity", "Identity", "VERIFIED"], ["bank", "Bank linked", "SAMPLE"], ["limit", "Reg CF limit", "$2,500"]] as [IconName, string, string][]).map(([ic, l, v], k) => (
          <div key={l} className="lv-row2" style={{ animationDelay: `${k * 90}ms` }}><Icon name={ic} size={18} /><span>{l}</span><b className="lv-mono">{v}</b></div>
        ))}
      </div>
      <div className="lv-sec lv-pmenu"><Button variant="secondary" icon="settings" block>Settings</Button>{isAdmin && <Button variant="secondary" icon="dashboard" block onClick={onAdmin}>Admin</Button>}</div>
    </div>
  );
}

/* ---------- INBOX + THREAD ---------- */
const THREADS = [
  { id: "t1", who: "Lumen Labs", d: DEALS[0], last: "Thanks for the question on battery life!", unread: true, t: "2M" },
  { id: "t2", who: "Gridline", d: DEALS[1], last: "Install walkthrough is open to investors.", unread: true, t: "1H" },
  { id: "t3", who: "Tally", d: DEALS[2], last: "We just shipped receipt scanning v2.", unread: false, t: "1D" },
];
export function InboxView({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="lv-inbox">
      <Top l="INBOX" r={`${THREADS.filter((t) => t.unread).length} UNREAD`} />
      <ul className="lv-list">
        {THREADS.map((t, k) => (
          <li key={t.id}><button type="button" className="lv-li btn" style={{ animationDelay: `${k * 80}ms` }} onClick={() => onOpen(t.id)}>
            <LiveImage src={t.d.img} intro={false} className="lv-thumb round" />
            <div className="lv-li-m"><strong>{t.who}</strong><span className="lv-snip">{t.last}</span></div>
            <div className="lv-li-r"><span className="lv-mono dim">{t.t}</span>{t.unread ? <i className="lv-dot" aria-label="unread" /> : <Icon name="forward" size={14} />}</div>
          </button></li>
        ))}
      </ul>
      <p className="lv-fine pad">Sample conversations for UI preview.</p>
    </div>
  );
}
export function ThreadView({ id, onBack }: { id: string; onBack?: () => void }) {
  const t = THREADS.find((x) => x.id === id) ?? THREADS[0];
  const [msgs, setMsgs] = useState([
    { me: true, txt: "What are gross margins per can?" },
    { me: false, txt: t.last },
    { me: false, txt: "Sample answer: around 60% at current volume." },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const send = () => {
    if (!draft.trim()) return;
    setMsgs([...msgs, { me: true, txt: draft.trim() }]); setDraft(""); setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { me: false, txt: "Sample reply: good question, we'll cover it in the Q&A." }]); }, 1400);
  };
  return (
    <div className="lv-thread">
      <header className="lv-thread-h">
        {onBack && <IconButton icon="back" label="Back" variant="ghost" onClick={onBack} />}
        <LiveImage src={t.d.img} intro={false} className="lv-thumb round sm" />
        <div><strong>{t.who}</strong><div className="lv-mono dim"><span className="lv-live" /> FOUNDER · SAMPLE</div></div>
      </header>
      <div className="lv-msgs" aria-live="polite">
        {msgs.map((m, k) => <div key={k} className={`lv-msg${m.me ? " me" : ""}`}>{m.txt}</div>)}
        {typing && <div className="lv-msg typing"><i /><i /><i /></div>}
      </div>
      <form className="lv-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask the founder…" aria-label="Message" />
        <IconButton type="submit" icon="send" label="Send" variant="primary" className="lv-send" disabled={!draft.trim()} />
      </form>
    </div>
  );
}

/* ---------- NOTIFICATIONS ---------- */
const NOTES: { ic: IconName; txt: string; t: string; fresh?: boolean }[] = [
  { ic: "chart", txt: "Tally shipped receipt scanning v2", t: "NOW", fresh: true },
  { ic: "qa", txt: "Lumen Labs answered your question", t: "2M", fresh: true },
  { ic: "events", txt: "Founder Night: 9 spots left", t: "1H" },
  { ic: "announce", txt: "Gridline posted an update", t: "1D" },
];
export function NotificationsView() {
  const [read, setRead] = useState(false);
  return (
    <div className="lv-notes">
      <Top l="NOTIFICATIONS" r={read ? "ALL READ" : "2 NEW"} />
      <ul className="lv-list">
        {NOTES.map((n, k) => (
          <li key={k} className={`lv-note${n.fresh && !read ? " fresh" : ""}`} style={{ animationDelay: `${k * 90}ms` }}>
            <span className="lv-note-ic"><Icon name={n.ic} size={18} /></span>
            <span className="lv-note-t">{n.txt}</span>
            <span className="lv-mono dim">{n.t}</span>
          </li>
        ))}
      </ul>
      <div className="lv-sec"><Button variant="ghost" icon="check" onClick={() => setRead(true)} disabled={read}>Mark all read</Button></div>
      <p className="lv-fine pad">Sample notifications.</p>
    </div>
  );
}

/* ---------- ONBOARDING ---------- */
const STEPS = [
  { k: "WELCOME", h: "Back the startups on your block.", p: "Catalyst is a startup-investing app for everyday people. Sample preview." },
  { k: "INTERESTS", h: "What do you want to see?", p: "Pick a few. You can change these later." },
  { k: "LIMITS", h: "Know your limit.", p: "Reg CF caps how much non-accredited investors can put in each year. Example only." },
  { k: "RISK", h: "Startups are risky.", p: "Most fail. Only invest money you can afford to lose." },
];
export function OnboardingView() {
  const [s, setS] = useState(0);
  const [picks, setPicks] = useState<string[]>(["Fintech"]);
  const reduced = useReducedMotion();
  const lim = useCountUp(s === 2 ? 2500 : 0, s === 2, reduced, 900);
  const st = STEPS[s];
  return (
    <div className="lv-onb">
      <div className="lv-steps" aria-label={`Step ${s + 1} of ${STEPS.length}`}>{STEPS.map((_, k) => <i key={k} className={k <= s ? "on" : ""} />)}</div>
      {s === 0 ? (
        <LiveImage src="/live/ev-1.jpg" className="lv-onb-img"><div className="lv-onb-cap lv-mono">CATALYST COMMUNITY · NYC</div></LiveImage>
      ) : (
        <div className="lv-onb-vis">
          {s === 1 && <div className="lv-chips">{["Fintech", "AI", "Climate", "Software", "Hardware"].map((c) => <Chip key={c} on={picks.includes(c)} onClick={() => setPicks(picks.includes(c) ? picks.filter((x) => x !== c) : [...picks, c])}>{c}</Chip>)}</div>}
          {s === 2 && <div className="lv-gauge"><div className="lv-big xl">{usd(lim)}</div><div className="lv-mono dim">EXAMPLE 12-MONTH LIMIT</div><div className="lv-bar"><span style={{ width: `${(lim / 2500) * 100}%` }} /></div></div>}
          {s === 3 && <div className="lv-risk">{["Could lose it all", "Hard to sell", "Takes years"].map((r, k) => <div key={r} className="lv-row2" style={{ animationDelay: `${k * 120}ms` }}><Icon name="shield" size={18} /><span>{r}</span></div>)}</div>}
        </div>
      )}
      <div key={s} className="lv-onb-txt">
        <div className="lv-mono dim">{String(s + 1).padStart(2, "0")} / {st.k}</div>
        <h2>{st.h}</h2><p>{st.p}</p>
      </div>
      <div className="lv-onb-cta">
        {s > 0 && <Button variant="ghost" onClick={() => setS(s - 1)}>Back</Button>}
        <Button iconRight="forward" block onClick={() => setS((s + 1) % STEPS.length)}>{s === STEPS.length - 1 ? "Start over" : "Continue"}</Button>
      </div>
    </div>
  );
}

/* ---------- ADMIN ---------- */
export function AdminView() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [ev, setEv] = useState(EVENTS[0]);
  const series = [3, 4, 4, 6, 5, 8, 9, 8, 11, 13, 12, 15];
  return (
    <div className="lv-admin">
      <Top l="ADMIN / OVERVIEW" />
      <div ref={ref} className="lv-kpis">
        <div><em>MEMBERS</em><b><Count to={28000} /></b><span className="lv-mono dim">COMMUNITY</span></div>
        <div><em>SIGNUPS · 7D</em><b><Count to={146} /></b><span className="lv-mono dim">SAMPLE</span></div>
        <div className="wide"><em>RSVPS · 12W · SAMPLE</em><Sparkline data={series} go={seen} w={260} h={40} /></div>
      </div>
      <div className="lv-sec">
        <div className="lv-mono dim">NEXT EVENT</div>
        <div className="lv-adm-ev">
          <strong>{ev.title}</strong>
          <span className="lv-mono"><Ticker start={ev.going} label="GOING" /></span>
          <div className="lv-cap"><i style={{ width: `${(ev.going / ev.cap) * 100}%` }} /></div>
          <div className="lv-adm-act">
            <Button size="sm" icon="check" onClick={() => setEv({ ...ev, going: Math.min(ev.cap, ev.going + 1) })}>Approve 1</Button>
            <Button size="sm" variant="secondary" icon="announce">Announce</Button>
          </div>
        </div>
      </div>
      <div className="lv-sec">
        <div className="lv-mono dim">QUEUE</div>
        {([["deals", "Pitch drafts", 4], ["qa", "Q&A to review", 7], ["members", "Pending members", 12]] as [IconName, string, number][]).map(([ic, l, n], k) => (
          <div key={l} className="lv-row2" style={{ animationDelay: `${k * 90}ms` }}><Icon name={ic} size={18} /><span>{l}</span><b className="lv-mono">{n}</b></div>
        ))}
      </div>
      <p className="lv-fine pad">Member count from Catalyst community; other figures are sample.</p>
    </div>
  );
}
