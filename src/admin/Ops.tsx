import { FormEvent, useEffect, useState } from "react";
import { Icon } from "../brand/icons";
import { api, errText, useAct, useP } from "@/lib/platform/client";
import type { Audience, OrgSettings } from "@/lib/platform/contract";
import { Err, Head, Loading, fmtDate, fmtDay, toast } from "./Layout";

const audText = (a: Audience, evs: { id: string; title: string }[] = []) => a === "all" ? "All members" : a === "admins" ? "Admins" : `Going to ${evs.find((e) => e.id === a.eventId)?.title || "event"}`;

export function Announcements() {
  const list = useP(["announcements"], () => api.listAnnouncements());
  const evs = useP(["adminEvents"], () => api.adminListEvents());
  const send = useAct((i: { title: string; body: string; audience: Audience }) => api.sendAnnouncement(i), [["announcements"]]);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [aud, setAud] = useState("all");
  const audience: Audience = aud === "all" || aud === "admins" ? aud : { eventId: aud };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!confirm(`Send "${title}" to ${audText(audience, evs.data)}? This creates an in-app notification for each recipient.`)) return;
    send.mutateAsync({ title: title.trim(), body: body.trim(), audience }).then(() => { toast("Announcement sent"); setTitle(""); setBody(""); }).catch((x) => toast(errText(x)));
  };
  return (
    <>
      <Head k="Notifications" title="Announcements" />
      <div className="ad-body fade split">
        <form className="f" onSubmit={submit}>
          <label className="fl"><span className="lbl">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} required /></label>
          <label className="fl"><span className="lbl">Message</span><textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} required /><span className="note mono">{body.length}/600</span></label>
          <label className="fl"><span className="lbl">Send to</span>
            <select value={aud} onChange={(e) => setAud(e.target.value)}>
              <option value="all">All members</option><option value="admins">Admins only (test)</option>
              {(evs.data || []).filter((e) => e.status === "published").map((e) => <option key={e.id} value={e.id}>Going to {e.title}</option>)}
            </select></label>
          <div className="ad-row"><button className="b k" disabled={send.isPending || !title.trim() || !body.trim()}>{!send.isPending && <Icon name="send" size={15} />}{send.isPending ? "Sending…" : "Send announcement"}</button><span className="note">In-app notification. Email delivery depends on backend setup.</span></div>
        </form>
        <div>
          <span className="lbl">Preview</span>
          <div className="card" style={{ marginTop: 8 }}><div className="ad-row" style={{ justifyContent: "space-between" }}><b>{title || "Title"}</b><span className="note mono">now</span></div><p style={{ margin: "6px 0 0", color: "var(--mute)" }}>{body || "Your message shows up like this in the member's notifications."}</p></div>
          <div className="sec"><span className="lbl">Sent</span>
            {list.isLoading ? <Loading rows={3} /> : list.error ? <Err e={list.error} /> : !list.data?.length ? <div className="empty">Nothing sent yet.</div> : (
              <div className="list">{list.data.map((a) => <div key={a.id}><span><b>{a.title}</b><div className="note">{audText(a.audience, evs.data)}</div></span><span className="note mono">{a.sentAt ? fmtDate(a.sentAt) : "draft"}</span></div>)}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const PAGE = 25;
export function Waitlist() {
  const [q, setQ] = useState(""); const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [q]);
  const w = useP(["waitlist", q, page], () => api.adminListWaitlist({ q, limit: PAGE, offset: page * PAGE }));
  const total = w.data?.total || 0;
  return (
    <>
      <Head k="Read only" title="Waitlist"><input placeholder="Search email" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} aria-label="Search waitlist" /></Head>
      <div className="ad-body fade">
        <p className="note" style={{ marginTop: 0 }}>Signups from the public waitlist. View only; nothing here can be edited or emailed from this screen.</p>
        {w.isLoading ? <Loading /> : w.error ? <Err e={w.error} /> : !w.data?.rows.length ? <div className="empty">No signups{q ? " match" : ""}.</div> : (
          <>
            <table className="rsp"><thead><tr><th>Email</th><th>Name</th><th>Source</th><th>Signed up</th></tr></thead>
              <tbody>{w.data.rows.map((r) => <tr key={r.id}><td className="mono t">{r.email}</td><td className="hm">{r.name || "–"}</td><td data-l="">{r.source ? <span className="pill">{r.source}</span> : "–"}</td><td className="mono note hm">{fmtDay(r.createdAt)}</td></tr>)}</tbody></table>
            <div className="ad-row" style={{ justifyContent: "space-between", marginTop: 14 }}>
              <span className="note mono">{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
              <div className="ad-row"><button className="b sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button><button className="b sm" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Next</button></div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function SettingsPage() {
  const s = useP(["settings"], () => api.getSettings());
  const save = useAct((p: Partial<OrgSettings>) => api.updateSettings(p), [["settings"]]);
  const [v, setV] = useState<OrgSettings | null>(null);
  useEffect(() => { if (s.data) setV(s.data); }, [s.data]);
  if (s.isLoading || (!v && !s.error)) return <><Head title="Settings" /><div className="ad-body"><Loading /></div></>;
  if (s.error || !v) return <><Head title="Settings" /><div className="ad-body"><Err e={s.error} /></div></>;
  return (
    <>
      <Head k="Workspace" title="Settings" />
      <div className="ad-body fade">
        <form className="f" onSubmit={(e) => { e.preventDefault(); save.mutateAsync(v).then(() => toast("Settings saved")).catch((x) => toast(errText(x))); }}>
          <div className="f2">
            <label className="fl"><span className="lbl">Organization name</span><input value={v.orgName} onChange={(e) => setV({ ...v, orgName: e.target.value })} /></label>
            <label className="fl"><span className="lbl">Contact email</span><input type="email" value={v.contactEmail} onChange={(e) => setV({ ...v, contactEmail: e.target.value })} /></label>
          </div>
          <label className="fl" style={{ maxWidth: 340 }}><span className="lbl">Default event capacity</span><input type="number" min={1} value={v.defaultCapacity} onChange={(e) => setV({ ...v, defaultCapacity: Number(e.target.value) })} /></label>
          <label className="ad-row"><input type="checkbox" checked={v.requireApproval} onChange={(e) => setV({ ...v, requireApproval: e.target.checked })} /><span><b>Require approval for RSVPs</b> <span className="note">new RSVPs start as "pending" until an admin approves</span></span></label>
          <div><button className="b k" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save settings"}</button></div>
        </form>
        <div className="sec"><span className="lbl">Compliance</span>
          <div className="list"><div><span>Investment execution</span><span className="pill">Disabled · registration pending</span></div>
            <div><span>Deal listings</span><span className="note">Preview only, labeled in the app</span></div></div>
        </div>
      </div>
    </>
  );
}
