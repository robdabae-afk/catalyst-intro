import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Head } from "../FeaturesApp";
import { KIND_LABEL, type NotifKind, type Notif } from "../data";
import { COMPANIES, NOTIFS, useCatalog } from "../catalog";
import { requireAccount } from "../sync";

const byId = (id: string) => COMPANIES.find((c) => c.id === id);
import { IX } from "../icons";
import { setState, unreadCount, useStore } from "../store";
import { Switch } from "../parts";
import { Duo, Icon } from "../hud";
import type { IconName } from "../bicons";

const ICON: Record<NotifKind, IconName> = { new_pitch: "pitch", founder_update: "announce", event_reminder: "rsvp", qa_answered: "qa", new_follower: "mutual", raise_milestone: "traction" };
const SHORT: Record<NotifKind, string> = { new_pitch: "New pitch", founder_update: "Update", event_reminder: "Event", qa_answered: "Q&A", new_follower: "Follower", raise_milestone: "Terms" };
const KINDS = Object.keys(KIND_LABEL) as NotifKind[];

function Lead({ x }: { x: Notif }) {
  const c = x.company ? byId(x.company) : undefined;
  if (c) return <Duo c={c} size={42} />;
  return <span className="ib" style={{ width: 50, height: 50 }}><Icon name={ICON[x.kind]} size={22} /></span>;
}

function Thumb({ x }: { x: Notif }) {
  const c = x.company ? byId(x.company) : undefined;
  if (x.thumb === "pitch" && c?.img) return <span className="nt-thumb"><img src={c.img} alt="" /><span className="play"><Icon name="play" size={13} /></span></span>;
  return null;
}

export default function Notifications() {
  useCatalog();
  const [s] = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotifKind | "all">("all");
  const n = unreadCount(s);
  const list = NOTIFS.filter((x) => s.prefs[x.kind] && (filter === "all" || x.kind === filter));
  const days = ["Today", "Yesterday", "Earlier"] as const;
  const go = (x: Notif) => { setState((st) => ({ ...st, readIds: [...new Set([...st.readIds, x.id])] })); nav(`/${x.to.replace(/^\/+/, "")}`); };

  return (
    <div style={{ maxWidth: 720 }}>
      <Head title="Inbox" right={<div className="row" style={{ gap: 8 }}>
        <button className="btn ghost sm" disabled={!n} onClick={() => setState((x) => ({ ...x, readIds: NOTIFS.map((i) => i.id) }))}><Icon name="check" size={15} />Read all</button>
        <button className="ib" onClick={() => setOpen(true)} aria-label="Notification settings"><Icon name="settings" size={18} /></button>
      </div>} />
      <div className="eyebrow mono" style={{ marginBottom: 12 }}><span className="blink" /><span>{n} unread</span></div>
      <div className="chips" role="tablist">
        <button className={`chip${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>All{n ? ` · ${n}` : ""}</button>
        {KINDS.filter((k) => s.prefs[k]).map((k) => (
          <button key={k} className={`chip${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}><Icon name={ICON[k]} size={15} />{SHORT[k]}</button>
        ))}
      </div>
      {days.map((d, di) => {
        const items = list.filter((x) => x.day === d);
        if (!items.length) return null;
        return (
          <section key={d}>
            <div className="sec"><h2><span className="ix">0{di + 1}</span>{d}</h2></div>
            <div className="st">
              {items.map((x) => {
                const unread = !s.readIds.includes(x.id);
                return (
                  <div key={x.id} role="button" tabIndex={0} className={`nt${unread ? " unread" : ""}`} onClick={() => go(x)} onKeyDown={(e) => { if (e.key === "Enter") go(x); }}>
                    <Lead x={x} />
                    <span className="grow">
                      <span className="nt-kind mono"><Icon name={ICON[x.kind]} size={13} />{SHORT[x.kind]} · {x.ago}</span>
                      <b>{x.title}</b><p>{x.body}</p>
                      {x.thumb === "pitch" && <span className="nt-actions"><span className="btn sm"><Icon name="play" size={12} />Watch pitch</span></span>}
                    </span>
                    <Thumb x={x} />
                    {unread && <span className="nt-dot" aria-label="unread" />}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {!list.length && <p className="dim" style={{ marginTop: 24 }}>Nothing here yet.</p>}
      
      {open && (
        <div className="sheet-bg" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Notification settings" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 8 }}><h2 className="grow" style={{ fontSize: 20, fontWeight: 800 }}>Notify me about</h2>
              <button className="ib" onClick={() => setOpen(false)} aria-label="Close"><IX /></button></div>
            {KINDS.map((k) => (
              <div className="set" key={k}><Icon name={ICON[k]} size={18} /><span className="grow">{KIND_LABEL[k]}</span>
                <Switch label={KIND_LABEL[k]} on={s.prefs[k]} onChange={() => requireAccount() && setState((x) => ({ ...x, prefs: { ...x.prefs, [k]: !x.prefs[k] } }))} /></div>
            ))}
            <div className="set" style={{ borderBottom: 0 }}><Icon name="invest" size={18} /><span className="grow"><b>When investing opens</b><br /><span className="dim" style={{ fontSize: 12.5 }}>One alert when the funding portal goes live.</span></span>
              <Switch label="When investing opens" on={s.prefs.investing_opens} onChange={() => requireAccount() && setState((x) => ({ ...x, prefs: { ...x.prefs, investing_opens: !x.prefs.investing_opens } }))} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
