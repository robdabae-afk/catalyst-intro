import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon } from "../brand/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errText, useAct, useP } from "@/lib/platform/client";
import type { EventInput, EventStatus, Rsvp, RsvpStatus } from "@/lib/platform/contract";
import { Err, Head, Loading, fmtDate, toast } from "./Layout";

const statusPill = (s: EventStatus) => s === "published" ? <span className="pill o">Published</span> : s === "draft" ? <span className="pill d">Draft</span> : <span className="pill">Cancelled</span>;

export function EventsList() {
  const q = useP(["adminEvents"], () => api.adminListEvents());
  const nav = useNavigate();
  const [f, setF] = useState<"upcoming" | "past" | "draft">("upcoming");
  const nowIso = new Date().toISOString();
  const rows = (q.data || []).filter((e) => f === "draft" ? e.status === "draft" : f === "past" ? e.startsAt < nowIso : e.startsAt >= nowIso && e.status !== "draft");
  return (
    <>
      <Head k="Community" title="Events"><Link className="b k" to="/admin/events/new"><Icon name="plus" size={15} />New event</Link></Head>
      <div className="ad-body fade">
        <div className="seg" style={{ marginBottom: 16 }}>{(["upcoming", "past", "draft"] as const).map((x) => <button key={x} className={f === x ? "on" : ""} onClick={() => setF(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}</div>
        {q.isLoading ? <Loading /> : q.error ? <Err e={q.error} /> : rows.length === 0 ? <div className="empty">Nothing here.</div> : (
          <table className="rsp">
            <thead><tr><th>Event</th><th>When</th><th>Venue</th><th>Going</th><th>Waitlist</th><th>Status</th></tr></thead>
            <tbody>{rows.map((e) => (
              <tr key={e.id} className="click" onClick={() => nav(`/admin/events/${e.id}`)}>
                <td className="t">{e.title}</td><td className="mono" data-l="">{fmtDate(e.startsAt)}</td><td className="hm">{e.venue}</td>
                <td className="num" data-l="Going">{e.goingCount}{e.capacity ? ` / ${e.capacity}` : ""}</td><td className="num hm">{e.waitlistCount}</td><td>{statusPill(e.status)}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

const toLocal = (iso?: string | null) => { if (!iso) return ""; const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

export function EventForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const existing = useP(["adminEvent", id], () => api.getEvent(id!), !!id);
  const settings = useP(["settings"], () => api.getSettings(), !id);
  const [v, setV] = useState<EventInput>({ title: "", startsAt: "", venue: "", capacity: 40, description: "", status: "draft", coverUrl: null, address: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [up, setUp] = useState(false);
  useEffect(() => { if (existing.data) { const e = existing.data; setV({ title: e.title, startsAt: toLocal(e.startsAt), venue: e.venue, address: e.address || "", capacity: e.capacity, description: e.description, status: e.status, coverUrl: e.coverUrl }); } }, [existing.data]);
  useEffect(() => { if (settings.data && !id) setV((x) => ({ ...x, capacity: settings.data!.defaultCapacity })); }, [settings.data, id]);
  const set = <K extends keyof EventInput>(k: K, val: EventInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const save = async (ev: FormEvent, status?: EventStatus) => {
    ev.preventDefault(); setErr(null);
    if (!v.title.trim() || !v.startsAt || !v.venue.trim()) { setErr("Title, date and venue are required."); return; }
    setBusy(true);
    try {
      const input = { ...v, status: status || v.status, startsAt: new Date(v.startsAt).toISOString() };
      const e = id ? await api.updateEvent(id, input) : await api.createEvent(input);
      toast(input.status === "published" ? "Event published" : "Saved as draft"); nav(`/admin/events/${e.id}`);
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  const upload = async (file?: File) => { if (!file) return; setUp(true); try { set("coverUrl", await api.uploadEventCover(file)); } catch (x) { setErr(errText(x)); } finally { setUp(false); } };
  if (id && existing.isLoading) return <><Head title="Edit event" /><div className="ad-body"><Loading /></div></>;
  if (id && existing.error) return <><Head title="Edit event" /><div className="ad-body"><Err e={existing.error} /></div></>;
  return (
    <>
      <Head k={id ? "Edit" : "New"} title={id ? v.title || "Edit event" : "New event"}><Link className="b q" to={id ? `/admin/events/${id}` : "/admin/events"}>Cancel</Link></Head>
      <div className="ad-body fade">
        <form className="f" onSubmit={(e) => save(e)}>
          {err && <div className="err" role="alert">{err}</div>}
          <label className="fl"><span className="lbl">Title</span><input value={v.title} onChange={(e) => set("title", e.target.value)} required maxLength={120} /></label>
          <div className="f2">
            <label className="fl"><span className="lbl">Date & time</span><input type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} required /></label>
            <label className="fl"><span className="lbl">Capacity (blank = unlimited)</span><input type="number" min={1} value={v.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : null)} /></label>
          </div>
          <div className="f2">
            <label className="fl"><span className="lbl">Venue</span><input value={v.venue} onChange={(e) => set("venue", e.target.value)} required /></label>
            <label className="fl"><span className="lbl">Address (shown after RSVP)</span><input value={v.address || ""} onChange={(e) => set("address", e.target.value)} /></label>
          </div>
          <label className="fl"><span className="lbl">Description</span><textarea value={v.description} onChange={(e) => set("description", e.target.value)} /></label>
          <div className="fl">
            <span className="lbl">Cover photo</span>
            <div className="cover" style={v.coverUrl ? { backgroundImage: `url(${v.coverUrl})`, borderStyle: "solid" } : {}}>{!v.coverUrl && (up ? "Uploading…" : "No cover yet")}</div>
            <div className="ad-row"><label className="b sm" style={{ cursor: "pointer" }}>{up ? "Uploading…" : "Upload image"}<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
              {v.coverUrl && <button type="button" className="lnk note" onClick={() => set("coverUrl", null)}>Remove</button>}</div>
          </div>
          <div className="ad-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
            <button className="b k" disabled={busy} onClick={(e) => save(e, "published")}>{!busy && <Icon name="publish" size={15} />}{busy ? "Saving…" : "Publish"}</button>
            <button className="b" disabled={busy} onClick={(e) => save(e, "draft")}>Save draft</button>
            {id && v.status === "published" && <button className="b q" type="button" disabled={busy} onClick={(e) => save(e, "cancelled")}>Cancel event</button>}
          </div>
        </form>
      </div>
    </>
  );
}

const RS: RsvpStatus[] = ["approved", "pending", "waitlisted", "declined", "cancelled"];
function csv(rows: Rsvp[], title: string) {
  const esc = (s: string) => {
    let v = String(s ?? "");
    if (/^\s*[=+\-@]/.test(v) || /^[\t\r\n]/.test(v)) v = "'" + v;
    return `"${v.replace(/"/g, '""')}"`;
  };
  const body = ["name,email,status,checked_in,rsvp_at", ...rows.map((r) => [r.memberName, r.memberEmail, r.status, r.checkedInAt || "", r.createdAt].map(esc).join(","))].join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-rsvps.csv`; a.click(); URL.revokeObjectURL(a.href);
}

export function EventDetail() {
  const { id } = useParams() as { id: string };
  const nav = useNavigate();
  const ev = useP(["adminEvent", id], () => api.getEvent(id));
  const rs = useP(["adminRsvps", id], () => api.adminListRsvps(id));
  const inval = [["adminRsvps", id], ["adminEvent", id], ["adminEvents"], ["adminStats"]];
  const setStatus = useAct(({ r, s }: { r: string; s: RsvpStatus }) => api.setRsvpStatus(r, s), inval);
  const check = useAct(({ r, on }: { r: string; on: boolean }) => api.checkIn(r, on), inval);
  const del = useAct(() => api.deleteEvent(id), [["adminEvents"], ["adminStats"]]);
  const [f, setF] = useState<RsvpStatus | "all">("all"); const [q, setQ] = useState("");
  const rows = useMemo(() => (rs.data || []).filter((r) => (f === "all" || r.status === f) && (!q || (r.memberName + r.memberEmail).toLowerCase().includes(q.toLowerCase()))), [rs.data, f, q]);
  const counts = (s: RsvpStatus) => (rs.data || []).filter((r) => r.status === s).length;
  const checked = (rs.data || []).filter((r) => r.checkedInAt).length;
  if (ev.isLoading) return <><Head title="Event" /><div className="ad-body"><Loading /></div></>;
  if (ev.error || !ev.data) return <><Head title="Event" /><div className="ad-body"><Err e={ev.error} /></div></>;
  const e = ev.data;
  const act = (p: Promise<unknown>, msg: string) => p.then(() => toast(msg)).catch((x) => toast(errText(x)));
  return (
    <>
      <Head k={fmtDate(e.startsAt)} title={e.title}>
        <Link className="b" to={`/admin/events/${id}/edit`}><Icon name="edit" size={15} />Edit</Link>
        <button className="b q" onClick={() => csv(rs.data || [], e.title)} disabled={!rs.data?.length}><Icon name="export" size={15} />Export CSV</button>
        <button className="b q" onClick={() => { if (confirm(`Delete "${e.title}" and all its RSVPs?`)) del.mutateAsync(undefined).then(() => nav("/admin/events")).catch((x) => toast(errText(x))); }}><Icon name="delete" size={15} />Delete</button>
      </Head>
      <div className="ad-body fade">
        <div className="stats" style={{ marginBottom: 28 }}>
          <div><span className="lbl">Going</span><b>{counts("approved")}{e.capacity ? <span style={{ fontSize: 18, color: "var(--mute)" }}>/{e.capacity}</span> : null}</b>{e.capacity ? <div className="bar"><span style={{ width: `${Math.min(100, (counts("approved") / e.capacity) * 100)}%` }} /></div> : null}</div>
          <div><span className="lbl">To review</span><b>{counts("pending")}</b></div>
          <div><span className="lbl">Waitlist</span><b>{counts("waitlisted")}</b></div>
          <div><span className="lbl">Checked in</span><b>{checked}</b></div>
        </div>
        <div className="ad-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <div className="seg" style={{ flexWrap: "wrap" }}>{(["all", ...RS] as const).map((x) => <button key={x} className={f === x ? "on" : ""} onClick={() => setF(x)}>{x}</button>)}</div>
          <input placeholder="Search name or email" value={q} onChange={(x) => setQ(x.target.value)} style={{ maxWidth: 240 }} aria-label="Search RSVPs" />
        </div>
        {rs.isLoading ? <Loading /> : rs.error ? <Err e={rs.error} /> : rows.length === 0 ? <div className="empty">No RSVPs{f !== "all" ? ` marked ${f}` : ""} yet.</div> : (
          <table className="rsp">
            <thead><tr><th>Member</th><th>Status</th><th>RSVP'd</th><th>Check-in</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td className="t">{r.memberName}<div className="note mono">{r.memberEmail}</div></td>
                <td><span className={`pill ${r.status === "approved" ? "k" : r.status === "pending" ? "o" : ""}`}>{r.status}</span></td>
                <td className="mono hm note">{fmtDate(r.createdAt)}</td>
                <td><label className="ad-row" style={{ gap: 6 }}><input type="checkbox" checked={!!r.checkedInAt} disabled={r.status !== "approved"} onChange={(x) => act(check.mutateAsync({ r: r.id, on: x.target.checked }), x.target.checked ? `Checked in ${r.memberName}` : "Check-in removed")} /><span className="note">{r.checkedInAt ? "In" : ""}</span></label></td>
                <td style={{ textAlign: "right" }}><div className="ad-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                  {r.status !== "approved" && <button className="b sm k" onClick={() => act(setStatus.mutateAsync({ r: r.id, s: "approved" }), "Approved")}>Approve</button>}
                  {(r.status === "pending" || r.status === "approved") && <button className="b sm" onClick={() => act(setStatus.mutateAsync({ r: r.id, s: "waitlisted" }), "Moved to waitlist")}>Waitlist</button>}
                  {r.status !== "declined" && r.status !== "cancelled" && <button className="b sm q" onClick={() => act(setStatus.mutateAsync({ r: r.id, s: "declined" }), "Declined")}>Decline</button>}
                </div></td>
              </tr>))}</tbody>
          </table>
        )}
        <div className="sec"><span className="lbl">Details</span>
          <div className="list">
            <div><span>Status</span>{statusPill(e.status)}</div>
            <div><span>Venue</span><span>{e.venue}{e.address ? ` · ${e.address}` : ""}</span></div>
            <div><span>Member page</span>{e.status === "published" ? <Link className="lnk" to={`/app/events/${e.id}`}>/app/events/{e.id}</Link> : <span className="note">Visible once published</span>}</div>
          </div>
        </div>
      </div>
    </>
  );
}
