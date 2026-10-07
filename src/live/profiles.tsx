import { useEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { setState, useStore, toggle, watchToggle, watchAdd } from "@/features/store";
import { Icon, type IconName } from "@/brand/icons";
import { Button, IconButton } from "@/brand/Button";
import { DEALS, EVENTS, type LiveDeal } from "./data";
const copyLink = (path: string) => navigator.clipboard?.writeText(location.origin + path).then(() => true, () => false) ?? Promise.resolve(false);
import { LiveImage } from "./parts";
import { useInView, useParallax, useReducedMotion } from "./hooks";
import { SaveToggle } from "./micro";

/* Profiles come from the live catalog (company team members). No invented counts. */
import { PEOPLE, MATCH } from "@/features/catalog";
import { requireAccount } from "@/features/sync";
export { PEOPLE };
export type Person = { id: string; name: string; initials: string; photo?: string; role: "Founder" | "Investor" | "Member"; at?: string; city: string; bio: string; backed: string[]; events: string[]; followers: number; mutual: number };
export type ProfRef = { kind: "co"; id: string } | { kind: "person"; id: string };
const team = (d: LiveDeal) => PEOPLE.filter((p) => p.at === d.id);

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
  const items: ProfRef[] = [...DEALS.slice(0, 4).map((d) => ({ kind: "co" as const, id: d.id })), ...PEOPLE.map((p) => ({ kind: "person" as const, id: p.id }))];
  const nav = useNavigate();
  if (!items.length) return null;
  return (
    <section className="lv-pfeed" ref={ref}>
      <div className="lv-pfeed-h lv-mono"><span>PEOPLE + COMPANIES</span><span className="dim">HOLD FOR ACTIONS</span></div>
      <div className={`lv-pfeed-row${seen ? " in" : ""}`}>
        {items.map((r, k) => <FeedCard key={r.id} r={r} k={k} onOpen={onOpen} onHold={(x, y) => setQa({ x, y, r })} />)}
      </div>
      <QuickActions at={qa} onClose={() => setQa(null)} items={qa ? (qa.r.kind === "co"
        ? [{ icon: "save", label: "Save company", run: () => { if (requireAccount()) { void watchAdd(qa.r.id).then((ok) => ok && toast("Saved to watchlist")); } } }, { icon: "play", label: "Open", run: () => onOpen(qa.r) }, { icon: "share", label: "Copy link", run: () => void copyLink(`/c/${qa.r.id}`).then((ok) => toast(ok ? "Link copied" : "Couldn't copy")) }]
        : [{ icon: "plus", label: "Follow", run: () => { if (requireAccount()) { setState((s) => ({ ...s, people: s.people.includes(qa.r.id) ? s.people : [...s.people, qa.r.id] })).then((ok) => ok && toast("Following")); } } }, { icon: "send", label: "Message", run: () => { const at = PEOPLE.find((x) => x.id === qa.r.id)?.at; if (at && requireAccount()) nav(`/inbox/t/${at}`); } }]) : []} />
    </section>
  );
}
function FeedCard({ r, k, onOpen, onHold }: { r: ProfRef; k: number; onOpen: (r: ProfRef) => void; onHold: (x: number, y: number) => void }) {
  const lp = useLongPress(onHold);
  const open = () => { if (!lp.fired.current) onOpen(r); };
  if (r.kind === "co") {
    const d = DEALS.find((x) => x.id === r.id);
    if (!d) return null;
    return (
      <button type="button" className="lv-pcard co" style={{ transitionDelay: `${k * 60}ms` }} onClick={open} {...lp.bind} aria-label={`${d.name}. Long-press for actions.`}>
        <LiveImage src={d.img} intro={false} className="lv-pcard-img"><span className="lv-pcard-play"><Icon name="play" size={14} /></span></LiveImage>
        <strong>{d.name}</strong><span className="lv-mono dim">{d.cat.toUpperCase()} · CO</span>
        <span className="lv-av-stack">{team(d).map((p) => <Avatar key={p.id} p={p} size={22} />)}</span>
      </button>
    );
  }
  const p = PEOPLE.find((x) => x.id === r.id);
  if (!p) return null;
  return (
    <button type="button" className="lv-pcard" style={{ transitionDelay: `${k * 60}ms` }} onClick={open} {...lp.bind} aria-label={`${p.name}, ${p.role}. Long-press for actions.`}>
      <Avatar p={p} size={56} ring />
      <strong>{p.name}</strong><span className="lv-mono dim">{p.role.toUpperCase()}</span>
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
function FollowBtn({ id, company }: { id: string; company?: boolean }) {
  const [st] = useStore(); const [n, setN] = useState(0);
  const on = company ? st.follows.includes(id) : st.people.includes(id);
  const flip = () => requireAccount() && setState((s) => company ? { ...s, follows: toggle(s.follows, id) } : { ...s, people: toggle(s.people, id) });
  return <Button variant={on ? "secondary" : "primary"} size="sm" className={`lv-follow${on ? " on" : ""}`} onClick={() => { flip(); setN(n + 1); }} aria-pressed={on}>
    <span key={n} className="lv-follow-ic"><Icon name={on ? "check" : "plus"} size={15} /></span>{on ? "Following" : "Follow"}
  </Button>;
}
function MsgBtn({ thread }: { thread: string }) {
  const nav = useNavigate();
  return <IconButton icon="send" label="Message" className="lv-msgb" onClick={() => requireAccount() && nav(`/inbox/t/${thread}`)} />;
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
  const d = isCo ? DEALS.find((x) => x.id === r.id) ?? null : null;
  const p = !isCo ? PEOPLE.find((x) => x.id === r.id) ?? null : null;
  const img = d ? d.img : p?.photo ?? "";
  const [st] = useStore(); const saved = !!(d && st.watch[d.id]); const setSaved = (v: boolean) => { if (d && v !== saved && requireAccount()) watchToggle(d.id); };
  if (!d && !p) return <div className="lv-sheet-wrap in" onClick={onClose}><div className="lv-sheet" role="dialog" aria-modal="true" aria-label="Profile"><div className="lv-sheet-body"><h2>Not available</h2><p className="dim">This profile isn't live.</p><Button onClick={onClose}>Close</Button></div></div></div>;
  return (
    <div className={`lv-sheet-wrap${shown ? " in" : ""}`} onClick={onClose}>
      <div className="lv-sheet" role="dialog" aria-modal="true" aria-label={`${d?.name ?? p!.name} profile`}
        style={{ transform: drag ? `translateY(${drag}px)` : undefined }} onClick={(e) => e.stopPropagation()}
        onScroll={(e) => setScroll((e.target as HTMLElement).scrollTop)}>
        <div className="lv-sheet-grab"
          onPointerDown={(e) => { sy.current = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (sy.current !== null) setDrag(Math.max(0, e.clientY - sy.current)); }}
          onPointerUp={() => { if (drag > 110) onClose(); setDrag(0); sy.current = null; }}><i /></div>
        <div ref={cover} className="lv-sheet-cover" style={{ transform: reduced ? undefined : `translateY(${scroll * 0.4}px)` }}>
          {img ? <LiveImage src={img} intro={!reduced} hotspots={d?.hotspots ?? []} /> : <div className="lv-noimg" />}
          <div className="lv-sheet-top"><span /><IconButton icon="close" label="Close" className="lv-glass" onClick={onClose} /></div>
        </div>
        <div className="lv-sheet-body">
          <div className="lv-sheet-id" style={{ transform: reduced ? undefined : `translateY(${-Math.min(scroll, 60) * 0.3}px) scale(${1 - Math.min(scroll, 120) / 600})` }}>
            {d ? <span className="lv-av co" style={{ backgroundImage: d.img ? `url(${d.img})` : undefined }} aria-hidden>{d.img ? null : d.name.charAt(0)}</span> : <Avatar p={p!} size={76} ring />}
            <div className="lv-sheet-acts">
              <FollowBtn id={d ? d.id : p!.id} company={!!d} />
              {d ? <SaveToggle on={saved} onChange={(v) => { setSaved(v); toast(v ? "Added to watchlist" : "Removed from watchlist"); }} /> : null}
              {(d || p?.at) && <MsgBtn thread={d ? d.id : p!.at!} />}
            </div>
          </div>
          <h2>{d?.name ?? p!.name}</h2>
          <p className="lv-mono dim">{(d ? [d.cat, d.city] : [p!.role, p!.city]).filter(Boolean).join(" · ").toUpperCase()}</p>
          {d ? <CoBody d={d} onOpen={onOpen} /> : <PersonBody p={p!} onOpen={onOpen} />}
        </div>
      </div>
    </div>
  );
}

function CoBody({ d, onOpen }: { d: LiveDeal; onOpen: (r: ProfRef) => void }) {
  const vid = useRef<HTMLVideoElement>(null); const reduced = useReducedMotion();
  const [vref, vseen] = useInView<HTMLDivElement>();
  useEffect(() => { const v = vid.current; if (!v) return; if (vseen && !reduced) v.play().catch(() => {}); else v.pause(); }, [vseen, reduced]);
  const tm = team(d);
  return <>
    {tm.length > 0 && <div className="lv-team">
      <div className="lv-mono dim">TEAM</div>
      <div className="lv-team-row">{tm.map((p) => <button key={p.id} type="button" className="lv-team-m" onClick={() => onOpen({ kind: "person", id: p.id })}><Avatar p={p} size={44} ring /><span>{p.name}</span></button>)}</div>
    </div>}
    <SwipeTabs tabs={["About", "Pitch"]}>{[
      <div className="lv-tabp"><p>{d.line}</p><p className="lv-mono dim">INVESTING OPENS ONLY THROUGH A REGISTERED PORTAL</p></div>,
      <div className="lv-tabp" ref={vref}>{MATCH[d.id]?.pitch ? <div className="lv-pitch"><video ref={vid} src={MATCH[d.id].pitch} poster={d.img || undefined} muted loop playsInline preload="metadata" aria-label="Pitch, muted" /></div> : <p className="dim">No pitch video yet.</p>}</div>,
    ]}</SwipeTabs>
  </>;
}

function PersonBody({ p, onOpen }: { p: Person; onOpen: (r: ProfRef) => void }) {
  const co = p.at ? DEALS.find((d) => d.id === p.at) : null;
  const ev = EVENTS.filter((e) => p.events.includes(e.id));
  return <div className="lv-tabp">
    {p.bio && <p>{p.bio}</p>}
    {co && <button type="button" className="lv-li lv-libtn" onClick={() => onOpen({ kind: "co", id: co.id })}><LiveImage src={co.img} intro={false} className="lv-thumb" /><div className="lv-li-m"><strong>{co.name}</strong><span className="lv-mono dim">{p.role.toUpperCase()}</span></div><Icon name="forward" size={14} /></button>}
    {ev.map((e) => <div key={e.id} className="lv-row2"><Icon name="ticket" size={17} /><span>{e.title}</span></div>)}
  </div>;
}

export function Toast({ msg }: { msg: { t: string; n: number } | null }) {
  if (!msg) return null;
  return <div key={msg.n} className="lv-toast lv-mono" role="status"><Icon name="check" size={14} />{msg.t}</div>;
}
