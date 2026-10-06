import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errText, useAct, useP } from "@/lib/platform/client";
import type { DealInput, DealStatus, Role } from "@/lib/platform/contract";
import { Err, Head, Loading, fmtDay, toast } from "./Layout";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const NOTICE = "Preview listings only. Catalyst is not offering investments; Reg CF funding portal registration is pending. No money can be committed.";

export function DealsList() {
  const q = useP(["adminDeals"], () => api.adminListDeals());
  const nav = useNavigate();
  return (
    <>
      <Head k="Listings" title="Deals"><Link className="b k" to="/admin/deals/new">New deal</Link></Head>
      <div className="ad-body fade">
        <div className="err" style={{ marginBottom: 18 }}>{NOTICE}</div>
        {q.isLoading ? <Loading /> : q.error ? <Err e={q.error} /> : !q.data?.length ? <div className="empty">No deals yet.</div> : (
          <table className="rsp">
            <thead><tr><th>Company</th><th>Sector</th><th>Terms</th><th>Label</th><th>Status</th></tr></thead>
            <tbody>{q.data.map((d) => (
              <tr key={d.id} className="click" onClick={() => nav(`/admin/deals/${d.id}`)}>
                <td className="t">{d.name}<div className="note">{d.line}</div></td><td className="hm">{d.sector} · {d.city}</td>
                <td className="mono hm">{d.instrument} · {d.valuationCap} cap · min {usd(d.minCheck)}</td>
                <td>{d.isSample ? <span className="pill o">Sample</span> : <span className="pill">Real co.</span>}</td>
                <td><span className={`pill ${d.status === "preview" ? "k" : "d"}`}>{d.status}</span></td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

const BLANK: DealInput = { slug: "", name: "", line: "", sector: "Food", city: "", about: "", minCheck: 100, valuationCap: "", instrument: "SAFE", goal: 0, status: "draft", isSample: true, coverUrl: null, traction: [], useOfFunds: [] };

export function DealForm() {
  const { id } = useParams(); const nav = useNavigate();
  const ex = useP(["adminDeal", id], () => api.getDeal(id!), !!id);
  const [v, setV] = useState<DealInput>(BLANK); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ex.data) { const { id: _i, createdAt: _c, ...rest } = ex.data; setV(rest); } }, [ex.data]);
  const set = <K extends keyof DealInput>(k: K, val: DealInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const del = useAct(() => api.deleteDeal(id!), [["adminDeals"], ["adminStats"]]);
  const save = async (e: FormEvent, status?: DealStatus) => {
    e.preventDefault(); setErr(null);
    if (!v.name.trim()) { setErr("Name is required."); return; }
    setBusy(true);
    try {
      const input = { ...v, status: status || v.status, slug: v.slug || v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") };
      const d = id ? await api.updateDeal(id, input) : await api.createDeal(input);
      toast("Deal saved"); nav(`/admin/deals/${d.id}`);
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  if (id && ex.isLoading) return <><Head title="Deal" /><div className="ad-body"><Loading /></div></>;
  if (id && ex.error) return <><Head title="Deal" /><div className="ad-body"><Err e={ex.error} /></div></>;
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <>
      <Head k={id ? "Edit deal" : "New deal"} title={v.name || "New deal"}>
        {id && v.status === "preview" && <Link className="b q" to={`/app/deal/${v.slug || id}`}>View in app</Link>}
        {id && <button className="b q" onClick={() => { if (confirm("Delete this deal?")) del.mutateAsync(undefined).then(() => nav("/admin/deals")).catch((x) => toast(errText(x))); }}>Delete</button>}
      </Head>
      <div className="ad-body fade">
        <form className="f" onSubmit={(e) => save(e)}>
          <div className="err">{NOTICE}</div>
          {err && <div className="err" role="alert">{err}</div>}
          <div className="f2">
            <label className="fl"><span className="lbl">Company name</span><input value={v.name} onChange={(e) => set("name", e.target.value)} required /></label>
            <label className="fl"><span className="lbl">One-liner</span><input value={v.line} onChange={(e) => set("line", e.target.value)} /></label>
          </div>
          <div className="f2">
            <label className="fl"><span className="lbl">Sector</span><select value={v.sector} onChange={(e) => set("sector", e.target.value)}>{["Food", "Health", "Climate", "Software", "Education", "Consumer", "Fintech"].map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="fl"><span className="lbl">City</span><input value={v.city} onChange={(e) => set("city", e.target.value)} /></label>
          </div>
          <div className="f2">
            <label className="fl"><span className="lbl">Instrument</span><input value={v.instrument} onChange={(e) => set("instrument", e.target.value)} /></label>
            <label className="fl"><span className="lbl">Valuation cap</span><input value={v.valuationCap} onChange={(e) => set("valuationCap", e.target.value)} placeholder="$6M" /></label>
          </div>
          <div className="f2">
            <label className="fl"><span className="lbl">Minimum (illustrative)</span><input type="number" min={0} value={v.minCheck} onChange={(e) => set("minCheck", Number(e.target.value))} /></label>
            <label className="fl"><span className="lbl">Target raise (illustrative)</span><input type="number" min={0} value={v.goal} onChange={(e) => set("goal", Number(e.target.value))} /></label>
          </div>
          <label className="fl"><span className="lbl">About</span><textarea value={v.about} onChange={(e) => set("about", e.target.value)} /></label>
          <div className="f2">
            <label className="fl"><span className="lbl">Traction (one per line)</span><textarea value={v.traction.join("\n")} onChange={(e) => set("traction", lines(e.target.value))} /></label>
            <label className="fl"><span className="lbl">Use of funds (one per line)</span><textarea value={v.useOfFunds.join("\n")} onChange={(e) => set("useOfFunds", lines(e.target.value))} /></label>
          </div>
          <label className="ad-row"><input type="checkbox" checked={v.isSample} onChange={(e) => set("isSample", e.target.checked)} /><span><b>Sample / fictional company</b> <span className="note">shows a "Sample" label everywhere in the app</span></span></label>
          <div className="ad-row" style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
            <button className="b k" disabled={busy} onClick={(e) => save(e, "preview")}>Show as preview</button>
            <button className="b" disabled={busy} onClick={(e) => save(e, "draft")}>Save draft</button>
            {id && <button className="b q" disabled={busy} onClick={(e) => save(e, "archived")}>Archive</button>}
          </div>
        </form>
      </div>
    </>
  );
}

export function Questions() {
  const [open, setOpen] = useState(true);
  const q = useP(["adminQuestions", open], () => api.adminListQuestions({ open }));
  const deals = useP(["adminDeals"], () => api.adminListDeals());
  const inval = [["adminQuestions"], ["adminStats"]];
  const answer = useAct(({ id, a }: { id: string; a: string }) => api.answerQuestion(id, a), inval);
  const hide = useAct(({ id, h }: { id: string; h: boolean }) => api.setQuestionHidden(id, h), inval);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const dealName = (id: string) => deals.data?.find((d) => d.id === id)?.name || id;
  return (
    <>
      <Head k="Deals" title="Questions & answers" />
      <div className="ad-body fade">
        <div className="seg" style={{ marginBottom: 16 }}><button className={open ? "on" : ""} onClick={() => setOpen(true)}>Open</button><button className={!open ? "on" : ""} onClick={() => setOpen(false)}>All</button></div>
        {q.isLoading ? <Loading /> : q.error ? <Err e={q.error} /> : !q.data?.length ? <div className="empty">{open ? "No open questions." : "No questions yet."}</div> : (
          <div style={{ borderTop: "1px solid var(--ink)" }}>{q.data.map((x) => (
            <div key={x.id} style={{ padding: "18px 0", borderBottom: "1px solid var(--line)", opacity: x.hidden ? 0.5 : 1 }}>
              <div className="ad-row" style={{ justifyContent: "space-between" }}>
                <span className="lbl">{dealName(x.dealId)} · {x.memberName} · {fmtDay(x.createdAt)}</span>
                <div className="ad-row" style={{ gap: 6 }}>{x.hidden && <span className="pill d">Hidden</span>}{x.answer && <span className="pill k">Answered</span>}
                  <button className="b sm q" onClick={() => hide.mutateAsync({ id: x.id, h: !x.hidden }).then(() => toast(x.hidden ? "Visible again" : "Hidden from members")).catch((e) => toast(errText(e)))}>{x.hidden ? "Unhide" : "Hide"}</button></div>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 10px", letterSpacing: "-.01em" }}>{x.body}</p>
              {x.answer && <p style={{ borderLeft: "2px solid var(--ink)", paddingLeft: 12, margin: "0 0 10px" }}>{x.answer}</p>}
              <form className="ad-row" onSubmit={(e) => { e.preventDefault(); const a = (draft[x.id] || "").trim(); if (!a) return;
                answer.mutateAsync({ id: x.id, a }).then(() => { toast("Answer posted"); setDraft((d) => ({ ...d, [x.id]: "" })); }).catch((er) => toast(errText(er))); }}>
                <input style={{ flex: 1, minWidth: 200 }} placeholder={x.answer ? "Edit answer" : "Write a public answer"} value={draft[x.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [x.id]: e.target.value }))} aria-label="Answer" />
                <button className="b sm k" disabled={!(draft[x.id] || "").trim()}>Post</button>
              </form>
            </div>))}</div>
        )}
      </div>
    </>
  );
}

export function Members() {
  const [q, setQ] = useState("");
  const m = useP(["adminMembers", q], () => api.adminListMembers({ q }));
  const nav = useNavigate();
  return (
    <>
      <Head k="People" title="Members"><input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} aria-label="Search members" /></Head>
      <div className="ad-body fade">
        <p className="note" style={{ marginTop: 0 }}>App accounts only. The 28,000-person Catalyst community is tracked separately.</p>
        {m.isLoading ? <Loading /> : m.error ? <Err e={m.error} /> : !m.data?.length ? <div className="empty">No members match.</div> : (
          <table className="rsp">
            <thead><tr><th>Name</th><th>Email</th><th>City</th><th>RSVPs</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>{m.data.map((x) => (
              <tr key={x.id} className="click" onClick={() => nav(`/admin/members/${x.id}`)}>
                <td className="t">{x.name}</td><td className="mono hm">{x.email}</td><td className="hm">{x.city || "–"}</td>
                <td className="num" data-l="RSVPs">{x.rsvpCount ?? "–"}</td><td>{x.role === "admin" ? <span className="pill k">Admin</span> : <span className="pill">Member</span>}</td>
                <td className="mono hm note">{fmtDay(x.createdAt)}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function MemberDetail() {
  const { id } = useParams() as { id: string };
  const m = useP(["adminMember", id], () => api.adminGetMember(id));
  const role = useAct((r: Role) => api.setMemberRole(id, r), [["adminMember", id], ["adminMembers"], ["adminStats"]]);
  if (m.isLoading) return <><Head title="Member" /><div className="ad-body"><Loading /></div></>;
  if (m.error || !m.data) return <><Head title="Member" /><div className="ad-body"><Err e={m.error} /></div></>;
  const x = m.data; const next: Role = x.role === "admin" ? "member" : "admin";
  return (
    <>
      <Head k={x.email} title={x.name}>
        <button className={`b ${next === "admin" ? "k" : ""}`} disabled={role.isPending} onClick={() => { if (confirm(next === "admin" ? `Give ${x.name} full admin access?` : `Remove admin from ${x.name}?`)) role.mutateAsync(next).then(() => toast(`Role set to ${next}`)).catch((e) => toast(errText(e))); }}>
          {next === "admin" ? "Make admin" : "Remove admin"}</button>
      </Head>
      <div className="ad-body fade split">
        <div className="sec" style={{ marginTop: 0 }}><span className="lbl">RSVPs</span>
          {x.rsvps.length === 0 ? <div className="empty">No RSVPs.</div> : <div className="list">{x.rsvps.map((r) => <Link key={r.id} to={`/admin/events/${r.eventId}`}><span>{r.event.title}<div className="note mono">{fmtDay(r.event.startsAt)}</div></span><span className="pill">{r.status}</span></Link>)}</div>}
        </div>
        <div className="card"><div className="list">
          <div><span className="lbl">Role</span><span className={`pill ${x.role === "admin" ? "k" : ""}`}>{x.role}</span></div>
          <div><span className="lbl">City</span><span>{x.city || "–"}</span></div>
          <div><span className="lbl">Joined</span><span className="mono">{fmtDay(x.createdAt)}</span></div>
          <div><span className="lbl">Interests</span><span>{x.interests.join(", ") || "–"}</span></div>
        </div>{x.bio && <p>{x.bio}</p>}</div>
      </div>
    </>
  );
}
