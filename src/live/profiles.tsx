import { useEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { Button, IconButton } from "@/brand/Button";
import { DEALS, EVENTS, usd, type LiveDeal } from "./data";
import { LiveImage, SampleTag, Sparkline } from "./parts";
import { useCountUp, useInView, useParallax, useReducedMotion } from "./hooks";
import { SaveToggle } from "./micro";

/* All people, companies and figures here are SAMPLE data for UI preview. */

export type Person = { id: string; name: string; initials: string; photo?: string; role: "Founder" | "Investor" | "Member"; at?: string; city: string; bio: string; backed: string[]; events: string[]; followers: number; mutual: number };
export const PEOPLE: Person[] = [
  { id: "p-maya", name: "Maya O.", initials: "MO", photo: "/live/founder-lumen.jpg", role: "Founder", at: "lumen", city: "Brooklyn", bio: "Sample founder. Ex-AR engineer, building captions for everyone.", backed: [], events: ["e1"], followers: 1240, mutual: 8 },
  { id: "p-dev", name: "Dev K.", initials: "DK", role: "Founder", at: "lumen", city: "Brooklyn", bio: "Sample cofounder. Leads the speech model.", backed: ["tally"], events: ["e1", "e2"], followers: 610, mutual: 3 },
  { id: "p-ana", name: "Ana R.", initials: "AR", photo: "/live/founder-gridline.jpg", role: "Founder", at: "gridline", city: "Queens", bio: "Sample founder. Ex-utility engineer building home batteries.", backed: [], events: ["e2"], followers: 980, mutual: 5 },
  { id: "p-sam", name: "Sam T.", initials: "ST", photo: "/live/founder-tally.jpg", role: "Founder", at: "tally", city: "Manhattan", bio: "Sample founder. Ex-accountant, hates receipts.", backed: ["lumen"], events: ["e1"], followers: 1530, mutual: 11 },
  { id: "p-lee", name: "Lee W.", initials: "LW", role: "Investor", city: "Manhattan", bio: "Sample investor. Backs consumer and climate.", backed: ["lumen", "gridline"], events: ["e1", "e2"], followers: 2200, mutual: 14 },
  { id: "p-jo", name: "Jordan R.", initials: "JR", role: "Member", city: "Brooklyn", bio: "Sample member. First startup check was $100.", backed: ["lumen"], events: ["e1"], followers: 140, mutual: 6 },
];
export type ProfRef = { kind: "co"; id: string } | { kind: "person"; id: string };
const team = (d: LiveDeal) => PEOPLE.filter((p) => p.at === d.id);

function Count({ to, fmt = (n: number) => Math.round(n).toLocaleString("en-US"), go }: { to: number; fmt?: (n: number) => string; go: boolean }) {
  const reduced = useReducedMotion();
  return <>{fmt(useCountUp(to, go, reduced))}</>;
}
export const Avatar = ({ p, size = 44, ring }: { p: Person; size?: number; ring?: boolean }) => (
  <span className={`lv-av${ring ? " ring" : ""}`} style={{ width: size, height: size, fontSize: size * 0.34, backgroundImage: p.photo ? `url(${p.photo})` : undefined }} aria-hidden>{p.photo ? null : p.initials}</span>
);

/* ---- long press ---- */
function useLongPress(cb: (x: number, y: number) => void, ms = 480) {
  const t = useRef<number>(); const fired = useRef(false);
  return {
    fired,
    bind: {
      onPointerDown: (e: RPE) => { fired.current = false; const { clientX: x, clientY: y } = e; t.current = window.setTimeout(() => { fired.current = true; navigator.vibrate?.(10); cb(x, y); }, ms); },
      onPointerUp: () => clearTimeout(t.current), onPointerLeave: () => clearTimeout(t.current), onPointerCancel: () => clearTimeout(t.current),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
type QA = { icon: IconName; label: string; run: () => void };
export function QuickActions({ at, items, onClose }: { at: { x: number; y: number } | null; items: QA[]; onClose: () => void }) {
  useEffect(() => { if (!at) return; const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [at, onClose]);
  if (!at) return null;
  return (
    <div className="lv-qa-scrim" onClick={onClose}>
      <div className="lv-qa" role="menu" style={{ left: Math.min(at.x, innerWidth - 200), top: Math.min(at.y, innerHeight - 180) }} onClick={(e) => e.stopPropagation()}>
        {items.map((it, k) => <button key={it.label} role="menuitem" type="button" style={{ animationDelay: `${k * 40}ms` }} onClick={() => { it.run(); onClose(); }}><Icon name={it.icon} size={17} /><span>{it.label}</span></button>)}
      </div>
    </div>
  );
}

/* ---- feed cards (Discover) ---- */
export function ProfileFeed({ onOpen, toast }: { onOpen: (r: ProfRef) => void; toast: (s: string) => void }) {
  const [qa, setQa] = useState<{ x: number; y: number; r: ProfRef } | null>(null);
  const [ref, seen] = useInView<HTMLDivElement>();
  const items: ProfRef[] = [{ kind: "person", id: "p-lee" }, { kind: "co", id: "gridline" }, { kind: "person", id: "p-maya" }, { kind: "person", id: "p-jo" }, { kind: "co", id: "tally" }, { kind: "person", id: "p-sam" }];
  return (
    <section className="lv-pfeed" ref={ref}>
      <div className="lv-pfeed-h lv-mono"><span>PEOPLE + COMPANIES</span><span className="dim">HOLD FOR ACTIONS</span></div>
      <div className={`lv-pfeed-row${seen ? " in" : ""}`}>
        {items.map((r, k) => <FeedCard key={r.id} r={r} k={k} onOpen={onOpen} onHold={(x, y) => setQa({ x, y, r })} />)}
      </div>
      <QuickActions at={qa} onClose={() => setQa(null)} items={qa ? (qa.r.kind === "co"
        ? [{ icon: "save", label: "Save company", run: () => toast("Saved · sample") }, { icon: "play", label: "Watch pitch", run: () => onOpen(qa.r) }, { icon: "share", label: "Share", run: () => toast("Link copied · sample") }]
        : [{ icon: "plus", label: "Follow", run: () => toast("Following · sample") }, { icon: "send", label: "Message", run: () => toast("Message drafted · sample") }, { icon: "share", label: "Share profile", run: () => toast("Link copied · sample") }]) : []} />
    </section>
  );
}
function FeedCard({ r, k, onOpen, onHold }: { r: ProfRef; k: number; onOpen: (r: ProfRef) => void; onHold: (x: number, y: number) => void }) {
  const lp = useLongPress(onHold);
  const open = () => { if (!lp.fired.current) onOpen(r); };
  if (r.kind === "co") {
    const d = DEALS.find((x) => x.id === r.id)!;
    return (
      <button type="button" className="lv-pcard co" style={{ transitionDelay: `${k * 60}ms` }} onClick={open} {...lp.bind} aria-label={`${d.name}, sample company. Long-press for actions.`}>
        <LiveImage src={d.img} intro={false} className="lv-pcard-img"><span className="lv-pcard-play"><Icon name="play" size={14} /></span></LiveImage>
        <strong>{d.name}</strong><span className="lv-mono dim">{d.cat.toUpperCase()} · CO</span>
        <span className="lv-av-stack">{team(d).map((p) => <Avatar key={p.id} p={p} size={22} />)}</span>
      </button>
    );
  }
  const p = PEOPLE.find((x) => x.id === r.id)!;
  return (
    <button type="button" className="lv-pcard" style={{ transitionDelay: `${k * 60}ms` }} onClick={open} {...lp.bind} aria-label={`${p.name}, sample ${p.role}. Long-press for actions.`}>
      <Avatar p={p} size={56} ring />
      <strong>{p.name}</strong><span className="lv-mono dim">{p.role.toUpperCase()}</span>
      <span className="lv-mono lv-mut">{p.mutual} MUTUAL</span>
    </button>
  );
}

/* ---- swipeable tabs ---- */
function SwipeTabs({ tabs, children }: { tabs: string[]; children: ReactNode[] }) {
  const [i, setI] = useState(0); const sx = useRef<number | null>(null); const [dx, setDx] = useState(0);
  const go = (n: number) => { setI(Math.max(0, Math.min(tabs.length - 1, n))); setDx(0); };
  return (
    <div className="lv-stabs">
      <div className="lv-stabs-h" role="tablist">
        {tabs.map((t, k) => <button key={t} role="tab" type="button" aria-selected={i === k} className={i === k ? "on" : ""} onClick={() => go(k)}>{t}</button>)}
        <i className="lv-stabs-ink" style={{ width: `${100 / tabs.length}%`, transform: `translateX(${i * 100}%)` }} />
      </div>
      <div className="lv-stabs-vp"
        onPointerDown={(e) => { sx.current = e.clientX; }}
        onPointerMove={(e) => { if (sx.current !== null) setDx(e.clientX - sx.current); }}
        onPointerUp={() => { if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); else setDx(0); sx.current = null; }}
        onPointerCancel={() => { sx.current = null; setDx(0); }}>
        <div className="lv-stabs-track" style={{ transform: `translateX(calc(${-i * 100}% + ${dx * 0.6}px))`, transition: sx.current !== null ? "none" : undefined }}>
          {children.map((c, k) => <div key={k} role="tabpanel" aria-hidden={i !== k} className="lv-stabs-p">{c}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ---- action buttons ---- */
function FollowBtn() {
  const [on, setOn] = useState(false); const [n, setN] = useState(0);
  return <Button variant={on ? "secondary" : "primary"} size="sm" className={`lv-follow${on ? " on" : ""}`} onClick={() => { setOn(!on); setN(n + 1); }} aria-pressed={on}>
    <span key={n} className="lv-follow-ic"><Icon name={on ? "check" : "plus"} size={15} /></span>{on ? "Following" : "Follow"}
  </Button>;
}
function MsgBtn({ toast }: { toast: (s: string) => void }) {
  const [n, setN] = useState(0);
  return <IconButton icon="send" label="Message" className={`lv-msgb${n ? " fly" : ""}`} key={n} onClick={() => { setN(n + 1); toast("Message drafted · sample"); }} />;
}

/* ---- sheet ---- */
export function ProfileSheet({ r, onClose, onOpen, toast }: { r: ProfRef; onClose: () => void; onOpen: (r: ProfRef) => void; toast: (s: string) => void }) {
  const reduced = useReducedMotion();
  const cover = useRef<HTMLDivElement>(null); useParallax(cover, reduced);
  const [scroll, setScroll] = useState(0);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0); const sy = useRef<number | null>(null);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => { cancelAnimationFrame(t); removeEventListener("keydown", k); }; }, [onClose]);
  const isCo = r.kind === "co";
  const d = isCo ? DEALS.find((x) => x.id === r.id)! : null;
  const p = !isCo ? PEOPLE.find((x) => x.id === r.id)! : null;
  const img = d ? d.img : p!.role === "Investor" ? "/live/ev-2.jpg" : "/live/ev-1.jpg";
  const [saved, setSaved] = useState(false);
  return (
    <div className={`lv-sheet-wrap${shown ? " in" : ""}`} onClick={onClose}>
      <div className="lv-sheet" role="dialog" aria-modal="true" aria-label={`${d?.name ?? p!.name} profile, sample`}
        style={{ transform: drag ? `translateY(${drag}px)` : undefined }} onClick={(e) => e.stopPropagation()}
        onScroll={(e) => setScroll((e.target as HTMLElement).scrollTop)}>
        <div className="lv-sheet-grab"
          onPointerDown={(e) => { sy.current = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (sy.current !== null) setDrag(Math.max(0, e.clientY - sy.current)); }}
          onPointerUp={() => { if (drag > 110) onClose(); setDrag(0); sy.current = null; }}><i /></div>
        <div ref={cover} className="lv-sheet-cover" style={{ transform: reduced ? undefined : `translateY(${scroll * 0.4}px)` }}>
          <LiveImage src={img} intro={!reduced} hotspots={d?.hotspots ?? []} />
          <div className="lv-sheet-top"><SampleTag label={r.kind === "person" ? "SAMPLE PROFILE" : "SAMPLE DEAL"} /><IconButton icon="close" label="Close" className="lv-glass" onClick={onClose} /></div>
        </div>
        <div className="lv-sheet-body">
          <div className="lv-sheet-id" style={{ transform: reduced ? undefined : `translateY(${-Math.min(scroll, 60) * 0.3}px) scale(${1 - Math.min(scroll, 120) / 600})` }}>
            {d ? <span className="lv-av co" style={{ backgroundImage: `url(${d.img})` }} aria-hidden /> : <Avatar p={p!} size={76} ring />}
            <div className="lv-sheet-acts">
              <FollowBtn />
              {d ? <SaveToggle on={saved} onChange={(v) => { setSaved(v); toast(v ? "Saved · sample" : "Removed"); }} /> : null}
              <MsgBtn toast={toast} />
            </div>
          </div>
          <h2>{d?.name ?? p!.name}</h2>
          <p className="lv-mono dim">{d ? `${d.cat.toUpperCase()} · ${d.city.toUpperCase()}` : `${p!.role.toUpperCase()} · ${p!.city.toUpperCase()}`} · SAMPLE</p>
          {d ? <CoBody d={d} onOpen={onOpen} /> : <PersonBody p={p!} onOpen={onOpen} />}
          <p className="lv-fine">Sample profile for UI preview. Not a real {d ? "company or offering" : "person"}.</p>
        </div>
      </div>
    </div>
  );
}

function Stats({ items }: { items: [string, number, ((n: number) => string)?][] }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return <div ref={ref} className="lv-stats">{items.map(([l, v, f]) => <div key={l}><em>{l}</em><b><Count to={v} fmt={f} go={seen} /></b></div>)}</div>;
}
function Mutual({ n, events }: { n: number; events: string[] }) {
  const ev = EVENTS.filter((e) => events.includes(e.id));
  return (
    <div className="lv-mutual">
      <span className="lv-av-stack">{PEOPLE.slice(0, 3).map((x) => <Avatar key={x.id} p={x} size={22} />)}</span>
      <span>{n} mutual connections{ev.length ? ` · both at ${ev[0].title}` : ""}</span>
    </div>
  );
}

function CoBody({ d, onOpen }: { d: LiveDeal; onOpen: (r: ProfRef) => void }) {
  const vid = useRef<HTMLVideoElement>(null); const reduced = useReducedMotion();
  const [vref, vseen] = useInView<HTMLDivElement>();
  useEffect(() => { const v = vid.current; if (!v) return; if (vseen && !reduced) v.play().catch(() => {}); else v.pause(); }, [vseen, reduced]);
  const pct = Math.round((d.raised / d.goal) * 100);
  return <>
    <Stats items={[["RAISED", d.raised, usd], ["INVESTORS", d.investors], ["FOLLOWERS", d.investors * 3]]} />
    <div className="lv-team">
      <div className="lv-mono dim">TEAM</div>
      <div className="lv-team-row">{team(d).map((p) => <button key={p.id} type="button" className="lv-team-m" onClick={() => onOpen({ kind: "person", id: p.id })}><Avatar p={p} size={44} ring /><span>{p.name}</span></button>)}</div>
    </div>
    <Mutual n={7} events={["e1"]} />
    <SwipeTabs tabs={["About", "Pitch", "Updates", "Q&A"]}>{[
      <div className="lv-tabp"><p>{d.line}. Sample company description for UI preview.</p><div className="lv-bar"><span style={{ width: `${pct}%` }} /></div><p className="lv-mono dim">{pct}% OF SAMPLE GOAL · {d.days}D LEFT</p></div>,
      <div className="lv-tabp" ref={vref}><div className="lv-pitch"><video ref={vid} src={`/live/pitch-${d.id}.mp4`} muted loop playsInline preload="metadata" aria-label="Sample pitch preview, muted" /><span className="lv-pitch-tag lv-mono"><i className="lv-live" />PITCH PREVIEW · SAMPLE</span></div></div>,
      <div className="lv-tabp">{["Shipped v2 · sample", "Hit 75% of goal · sample", "New retail partner · sample"].map((u, k) => <div key={u} className="lv-row2" style={{ animationDelay: `${k * 80}ms` }}><Icon name="announce" size={17} /><span>{u}</span><b className="lv-mono">{k + 1}W</b></div>)}<Sparkline data={d.spark} go w={260} h={34} /></div>,
      <div className="lv-tabp">{["How do you use the money?", "When do you expect to be profitable?"].map((q, k) => <div key={q} className="lv-row2" style={{ animationDelay: `${k * 80}ms` }}><Icon name="qa" size={17} /><span>{q}</span><b className="lv-mono"><Icon name="upvote" size={14} /> {12 - k * 5}</b></div>)}</div>,
    ]}</SwipeTabs>
  </>;
}

function PersonBody({ p, onOpen }: { p: Person; onOpen: (r: ProfRef) => void }) {
  const co = p.at ? DEALS.find((d) => d.id === p.at) : null;
  return <>
    <Stats items={[["FOLLOWERS", p.followers], ["BACKED", p.backed.length], ["EVENTS", p.events.length]]} />
    <Mutual n={p.mutual} events={p.events} />
    <SwipeTabs tabs={["About", "Backed", "Events"]}>{[
      <div className="lv-tabp"><p>{p.bio}</p>{co && <button type="button" className="lv-li btn" onClick={() => onOpen({ kind: "co", id: co.id })}><LiveImage src={co.img} intro={false} className="lv-thumb" /><div className="lv-li-m"><strong>{co.name}</strong><span className="lv-mono dim">FOUNDER · SAMPLE</span></div><Icon name="forward" size={14} /></button>}</div>,
      <div className="lv-tabp">{p.backed.length ? p.backed.map((id) => { const d = DEALS.find((x) => x.id === id)!; return <button key={id} type="button" className="lv-li btn" onClick={() => onOpen({ kind: "co", id })}><LiveImage src={d.img} intro={false} className="lv-thumb" /><div className="lv-li-m"><strong>{d.name}</strong><span className="lv-mono dim">{d.cat.toUpperCase()} · SAMPLE</span></div><Icon name="forward" size={14} /></button>; }) : <p className="dim">No sample backings yet.</p>}</div>,
      <div className="lv-tabp">{EVENTS.filter((e) => p.events.includes(e.id)).map((e, k) => <div key={e.id} className="lv-row2" style={{ animationDelay: `${k * 80}ms` }}><Icon name="ticket" size={17} /><span>{e.title}</span><b className="lv-mono">ATTENDED</b></div>)}</div>,
    ]}</SwipeTabs>
  </>;
}

export function Toast({ msg }: { msg: { t: string; n: number } | null }) {
  if (!msg) return null;
  return <div key={msg.n} className="lv-toast lv-mono" role="status"><Icon name="check" size={14} />{msg.t}</div>;
}
