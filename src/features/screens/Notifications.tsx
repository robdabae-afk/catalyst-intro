import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Head } from "../FeaturesApp";
import { KIND_LABEL, NOTIFS, NotifKind } from "../data";
import { IBell, IPitch, IUpdate, ICal, IQA, IUserPlus, IUp, IX } from "../icons";
import { setState, unreadCount, useStore } from "../store";
import { Switch } from "../parts";

const ICON: Record<NotifKind, typeof IBell> = { new_pitch: IPitch, founder_update: IUpdate, event_reminder: ICal, qa_answered: IQA, new_follower: IUserPlus, raise_milestone: IUp };
const KINDS = Object.keys(KIND_LABEL) as NotifKind[];

export default function Notifications() {
  const [s] = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotifKind | "all">("all");
  const n = unreadCount(s);
  const list = NOTIFS.filter((x) => s.prefs[x.kind] && (filter === "all" || x.kind === filter));
  const days = ["Today", "Yesterday", "Earlier"] as const;

  return (
    <div>
      <Head title="Inbox" right={<div className="row" style={{ gap: 8 }}>
        <button className="btn ghost sm" disabled={!n} onClick={() => setState((x) => ({ ...x, readIds: NOTIFS.map((i) => i.id) }))}>Mark all read</button>
        <button className="btn ghost sm" onClick={() => setOpen(true)} aria-label="Notification settings">Settings</button>
      </div>} />
      <div className="chips" role="tablist">
        <button className={`chip${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>All{n ? ` · ${n}` : ""}</button>
        {KINDS.filter((k) => s.prefs[k]).map((k) => (
          <button key={k} className={`chip${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>{KIND_LABEL[k].replace(" from companies I follow", "").replace("My ", "")}</button>
        ))}
      </div>
      {days.map((d) => {
        const items = list.filter((x) => x.day === d);
        if (!items.length) return null;
        return (
          <section key={d}>
            <div className="sec"><h2>{d}</h2></div>
            <div className="st">
              {items.map((x) => {
                const I = ICON[x.kind]; const unread = !s.readIds.includes(x.id);
                return (
                  <button key={x.id} className={`nt${unread ? " unread" : ""}`} onClick={() => { setState((st) => ({ ...st, readIds: [...new Set([...st.readIds, x.id])] })); nav(`/app/x/${x.to}`); }}>
                    <span className="nt-ic"><I size={20} /></span>
                    <span className="grow"><b>{x.title}</b><p>{x.body}</p><span className="mono dim">{x.ago} ago</span></span>
                    {unread && <span className="nt-dot" aria-label="unread" />}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {!list.length && <p className="dim" style={{ marginTop: 24 }}>Nothing here yet.</p>}
      <p className="note" style={{ marginTop: 20 }}>Sample notifications. Raise milestones are illustrative; investing opens soon.</p>

      {open && (
        <div className="sheet-bg" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Notification settings" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 8 }}><h2 className="grow" style={{ fontSize: 20, fontWeight: 800 }}>Notify me about</h2>
              <button className="btn ghost sm" onClick={() => setOpen(false)} aria-label="Close"><IX /></button></div>
            {KINDS.map((k) => (
              <div className="set" key={k}><span className="grow">{KIND_LABEL[k]}</span>
                <Switch label={KIND_LABEL[k]} on={s.prefs[k]} onChange={() => setState((x) => ({ ...x, prefs: { ...x.prefs, [k]: !x.prefs[k] } }))} /></div>
            ))}
            <div className="set" style={{ borderBottom: 0 }}><span className="grow"><b>When investing opens</b><br /><span className="dim" style={{ fontSize: 12.5 }}>One alert when the funding portal goes live.</span></span>
              <Switch label="When investing opens" on={s.prefs.investing_opens} onChange={() => setState((x) => ({ ...x, prefs: { ...x.prefs, investing_opens: !x.prefs.investing_opens } }))} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
