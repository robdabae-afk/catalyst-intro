// Member deals / inbox / notifications / profile wired to the platform adapter.
// Flag off: sample backend + DEMO banner. Flag on: real API; errors (incl. missing tables) fail closed.
// No investing or money movement here. Registration pending.
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errText, isSample, useAct, useP, useSession } from "@/lib/platform/client";
import type { PDeal } from "@/lib/platform/contract";
import { DemoBanner } from "./Live";
import { Ic, I, Shell, SubTop, Av, useNoindex } from "./ui";
import { Button, ButtonLink, InvestButton, SwipeAction } from "../brand/Button";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const box = { border: "1px solid var(--line)", borderRadius: 14, padding: 16, margin: "12px 0" } as const;

function ErrBox({ e }: { e: unknown }) {
  return <p role="alert" style={{ border: "1px solid #000", borderRadius: 12, padding: 14, fontSize: 14 }}>{errText(e)}</p>;
}

function NeedSignIn({ what }: { what: string }) {
  const act = useAct(() => api.signIn("you@sample.local", "sample"), [[]]);
  return (
    <div style={box}>
      <b>Sign in to {what}</b>
      {isSample ? (
        <>
          <p className="sub" style={{ fontSize: 13, margin: "4px 0 10px" }}>Demo mode: signs you in as a local sample member.</p>
          <Button onClick={() => act.mutate(undefined)} loading={act.isPending} disabled={act.isPending}>Continue as sample member</Button>
        </>
      ) : <div style={{ marginTop: 10 }}><ButtonLink to="/app/login" icon="profile">Sign in</ButtonLink></div>}
    </div>
  );
}

function DealBadges({ d }: { d: PDeal }) {
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      {d.isSample && <span className="sample">Sample</span>}
      <span className="chip" style={{ padding: "2px 8px", fontSize: 11 }}>Preview · investing soon</span>
    </span>
  );
}

const Disclaimer = () => (
  <p className="sub" style={{ fontSize: 11, marginTop: 16 }}>
    Preview only. Catalyst's funding portal registration is pending; no investments are offered or accepted. Nothing here is investment advice.
  </p>
);

function Cover({ d, h = 160 }: { d: PDeal; h?: number }) {
  return d.coverUrl
    ? <div className="photo" style={{ backgroundImage: `url(${d.coverUrl})`, height: h, borderRadius: 14, backgroundSize: "cover", backgroundPosition: "center" }} role="img" aria-label={`${d.name} image`} />
    : <div style={{ height: h, borderRadius: 14, background: "#000", color: "#fff", display: "grid", placeItems: "center", fontSize: h / 3, fontWeight: 700 }} aria-hidden>{d.name[0]}</div>;
}

function useSaves(on: boolean) {
  const q = useP(["saves"], () => api.listSaves(), on);
  return { set: new Set((q.data || []).map((s) => s.dealId)), q };
}

function SaveBtn({ id, saved }: { id: string; saved: boolean }) {
  const t = useAct((x: string) => api.toggleSave(x), [["saves"]]);
  return (
    <>
      <button className={`go ${saved ? "on" : ""}`} disabled={t.isPending} aria-pressed={saved} onClick={() => t.mutate(id)}>
        <Ic d={I.mark} size={16} /> {saved ? "Saved" : "Save"}
      </button>
      {t.error && <span role="alert" className="sub" style={{ fontSize: 12 }}>{errText(t.error)}</span>}
    </>
  );
}

// ---------- Discover ----------
export function Discover() {
  const { session } = useSession();
  const deals = useP(["deals"], () => api.listDeals());
  const { set } = useSaves(!!session);
  const [q, setQ] = useState("");
  const list = (deals.data || []).filter((d) => !q || `${d.name} ${d.line} ${d.sector} ${d.city}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="Discover">
      <DemoBanner />
      <div className="pad">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies, sectors, cities" aria-label="Search deals"
          style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }} />
        {deals.isLoading && <p className="sub">Loading deals…</p>}
        {deals.error && <ErrBox e={deals.error} />}
        {deals.data && list.length === 0 && <p className="sub">{deals.data.length ? "No matches." : "No preview listings yet."}</p>}
        {list.map((d) => (
          <div key={d.id} style={{ ...box, display: "flex", gap: 14, alignItems: "center" }}>
            <Link to={`/app/deal/${d.slug || d.id}`} style={{ flex: 1, minWidth: 0, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 64, flex: "none" }}><Cover d={d} h={64} /></div>
              <div style={{ minWidth: 0 }}>
                <b style={{ display: "block" }}>{d.name}</b>
                <div className="sub" style={{ fontSize: 13 }}>{d.line}</div>
                <div className="num" style={{ fontSize: 12, margin: "4px 0" }}>{d.sector} · {d.city}</div>
                <DealBadges d={d} />
              </div>
            </Link>
            {session && <SaveBtn id={d.id} saved={set.has(d.id)} />}
          </div>
        ))}
        <Disclaimer />
      </div>
    </Shell>
  );
}

// ---------- Swipe ----------
export function Swipe() {
  const { session } = useSession();
  const deals = useP(["deals"], () => api.listDeals());
  const { set } = useSaves(!!session);
  const [i, setI] = useState(0);
  const save = useAct((x: string) => api.toggleSave(x), [["saves"]]);
  const list = deals.data || [];
  const d = list[i];
  return (
    <Shell title="Swipe">
      <DemoBanner />
      <div className="pad">
        {deals.isLoading && <p className="sub">Loading deals…</p>}
        {deals.error && <ErrBox e={deals.error} />}
        {deals.data && list.length === 0 && <p className="sub">No preview listings yet.</p>}
        {deals.data && list.length > 0 && !d && (
          <div style={box}><b>You're all caught up.</b><p className="sub" style={{ fontSize: 13 }}>Saved deals show on Discover.</p>
            <Button variant="ghost" icon="back" onClick={() => setI(0)}>Start over</Button></div>
        )}
        {d && (
          <div style={box}>
            <Cover d={d} h={240} />
            <div style={{ marginTop: 12 }}><DealBadges d={d} /></div>
            <b style={{ display: "block", fontSize: 24, letterSpacing: "-.03em", marginTop: 8 }}>{d.name}</b>
            <p className="sub">{d.line}</p>
            <div className="num" style={{ fontSize: 12 }}>{d.sector} · {d.city} · {i + 1}/{list.length}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 18, justifyContent: "center", alignItems: "center" }}>
              <SwipeAction kind="pass" onClick={() => setI(i + 1)} />
              <Link className="csw csw-info" to={`/app/deal/${d.slug || d.id}`} aria-label="Details"><Ic d={I.forward} size={22} /></Link>
              {session && (
                <SwipeAction kind="save" big disabled={save.isPending} aria-label={set.has(d.id) ? "Saved" : "Save"}
                  onClick={async () => { if (!set.has(d.id)) await save.mutateAsync(d.id).catch(() => {}); setI(i + 1); }} />
              )}
            </div>
            {save.error && <p role="alert" className="sub" style={{ fontSize: 12 }}>{errText(save.error)}</p>}
          </div>
        )}
        {!session && deals.data && <NeedSignIn what="save deals" />}
        <Disclaimer />
      </div>
    </Shell>
  );
}

// ---------- Deal detail ----------
export function DealPage() {
  const id = useParams().id!;
  const { session } = useSession();
  const deal = useP(["deal", id], () => api.getDeal(id));
  const d = deal.data;
  const qs = useP(["questions", d?.id], () => api.listQuestions(d!.id), !!d);
  const { set } = useSaves(!!session && !!d);
  const [text, setText] = useState("");
  const ask = useAct((b: string) => api.askQuestion(d!.id, b), [["questions", d?.id]]);
  useNoindex(d?.name || "Deal");
  const submit = (e: FormEvent) => { e.preventDefault(); if (text.trim()) ask.mutate(text.trim(), { onSuccess: () => setText("") }); };
  const visible = (qs.data || []).filter((q) => !q.hidden);
  return (
    <div className="cx"><div className="page" style={{ paddingBottom: 40 }}>
      <DemoBanner />
      <SubTop title={d?.name || "Deal"} back="/app/discover" right={session && d ? <SaveBtn id={d.id} saved={set.has(d.id)} /> : undefined} />
      <div style={{ padding: "6px 20px" }}>
        {deal.isLoading && <p className="sub">Loading…</p>}
        {deal.error && <ErrBox e={deal.error} />}
        {d && (
          <>
            <Cover d={d} h={220} />
            <div style={{ marginTop: 12 }}><DealBadges d={d} /></div>
            <h1 style={{ fontSize: 28, letterSpacing: "-.03em", margin: "8px 0 2px" }}>{d.name}</h1>
            <p className="sub">{d.line}</p>
            <div className="it" style={{ cursor: "default" }}>Sector<span>{d.sector}</span></div>
            <div className="it" style={{ cursor: "default" }}>City<span>{d.city}</span></div>
            <div className="it" style={{ cursor: "default" }}>Instrument<span>{d.instrument}</span></div>
            <div className="it" style={{ cursor: "default" }}>Valuation cap<span>{d.valuationCap}</span></div>
            <div className="it" style={{ cursor: "default" }}>Planned minimum<span className="num">{money(d.minCheck)}</span></div>
            <div className="it" style={{ cursor: "default" }}>Target raise<span className="num">{money(d.goal)}</span></div>
            <div className="sec"><h2>About</h2><p style={{ whiteSpace: "pre-wrap" }}>{d.about}</p></div>
            {d.traction.length > 0 && <div className="sec"><h2>Traction (company-reported)</h2>{d.traction.map((t, i) => <p key={i}>{t}</p>)}</div>}
            {d.useOfFunds.length > 0 && <div className="sec"><h2>Use of funds</h2>{d.useOfFunds.map((t, i) => <p key={i}>{t}</p>)}</div>}
            <div style={box}><b>Investing isn't open yet</b><p className="sub" style={{ fontSize: 13 }}>Registration pending. Save this deal to hear when it opens.</p><div style={{ marginTop: 10 }}><InvestButton disabled block>Investing opens soon</InvestButton></div></div>

            <div className="sec">
              <h2>Questions</h2>
              <p className="sub" style={{ fontSize: 12 }}>Public to all members so everyone sees the same answers.</p>
              {qs.isLoading && <p className="sub">Loading…</p>}
              {qs.error && <ErrBox e={qs.error} />}
              {qs.data && visible.length === 0 && <p className="sub">No questions yet.</p>}
              {visible.map((q) => (
                <div key={q.id} style={box}>
                  <div className="num" style={{ fontSize: 11 }}>{q.memberName} · {when(q.createdAt)}</div>
                  <p style={{ whiteSpace: "pre-wrap", margin: "4px 0" }}>{q.body}</p>
                  {q.answer ? <p style={{ whiteSpace: "pre-wrap", borderLeft: "2px solid #000", paddingLeft: 10, margin: 0 }}><b>Answer: </b>{q.answer}</p>
                    : <span className="sub" style={{ fontSize: 12 }}>Awaiting answer</span>}
                </div>
              ))}
              {session ? (
                <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
                  <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Ask a public question" aria-label="Ask a question"
                    style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px" }} />
                  <Button type="submit" icon="send" loading={ask.isPending} disabled={!text.trim() || ask.isPending}>Ask</Button>
                </form>
              ) : <NeedSignIn what="ask a question" />}
              {ask.error && <p role="alert" className="sub" style={{ fontSize: 12 }}>{errText(ask.error)}</p>}
            </div>
            <Disclaimer />
          </>
        )}
      </div>
    </div></div>
  );
}

// ---------- Inbox ----------
export function Inbox() {
  const { session, loading } = useSession();
  const th = useP(["threads"], () => api.listThreads(), !!session);
  return (
    <Shell title="Inbox" right={<Link to="/app/notifications" className="ic" aria-label="Notifications"><Ic d={I.bell} size={18} /></Link>}>
      <DemoBanner />
      <div className="pad">
        {!loading && !session && <NeedSignIn what="see messages" />}
        {th.isLoading && <p className="sub">Loading…</p>}
        {th.error && <ErrBox e={th.error} />}
        {th.data && th.data.length === 0 && (
          <div style={box}><b>No conversations yet</b><p className="sub" style={{ fontSize: 13 }}>You haven't joined any threads. Event and deal threads are created by the Catalyst team and show up here when you're added.</p></div>
        )}
        {th.data?.map((t) => (
          <Link key={t.id} to={`/app/inbox/${t.id}`} className="it" style={{ gap: 12 }}>
            <span style={{ display: "flex", gap: 12, alignItems: "center" }}><Av name={t.title || "?"} size={36} group={t.kind !== "dm"} />
              <span>{t.unread ? <b>{t.title}</b> : t.title}<span className="num" style={{ display: "block", fontSize: 11 }}>{t.kind} · {when(t.lastMessageAt)}</span></span></span>
            <span>{t.unread ? "● " : ""}→</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

export function ThreadPage() {
  const id = useParams().id!;
  const { session, loading } = useSession();
  const th = useP(["threads"], () => api.listThreads(), !!session);
  const msgs = useP(["messages", id], () => api.listMessages(id), !!session);
  const t = th.data?.find((x) => x.id === id);
  const read = useAct((x: string) => api.markThreadRead(x), [["threads"]]);
  const send = useAct((b: string) => api.sendMessage(id, b), [["messages", id], ["threads"]]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useNoindex(t?.title || "Thread");
  useEffect(() => { if (t?.unread) read.mutate(id); }, [t?.unread, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView(); }, [msgs.data?.length]);
  const submit = (e: FormEvent) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim(), { onSuccess: () => setText("") }); };
  return (
    <div className="cx"><div className="page">
      <DemoBanner />
      <SubTop title={t?.title || "Conversation"} back="/app/inbox" />
      {!loading && !session && <div style={{ padding: 20 }}><NeedSignIn what="see messages" /></div>}
      {(th.error || msgs.error) && <div style={{ padding: 20 }}><ErrBox e={th.error || msgs.error} /></div>}
      {th.data && !t && !th.isLoading && <p className="sub" style={{ padding: 20 }}>You're not in this conversation.</p>}
      <div className="msgs">
        {msgs.isLoading && <p className="sub">Loading…</p>}
        {msgs.data?.length === 0 && <p className="sub" style={{ textAlign: "center" }}>No messages yet.</p>}
        {msgs.data?.map((m) => {
          const me = m.userId === session?.userId;
          return <div key={m.id} style={{ display: "contents" }}>
            {!me && <div className="who">{m.senderName}</div>}
            <div className={`bub ${me ? "me" : ""}`} title={when(m.createdAt)}>{m.body}</div>
          </div>;
        })}
        <div ref={end} />
      </div>
      {session && t && (
        <div className="composer"><form onSubmit={submit}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Message" aria-label="Message" />
          <button type="submit" disabled={!text.trim() || send.isPending} aria-label="Send"><Ic d={I.send} size={18} /></button>
        </form>{send.error && <p role="alert" className="sub" style={{ fontSize: 12, padding: "0 16px" }}>{errText(send.error)}</p>}</div>
      )}
    </div></div>
  );
}

// ---------- Notifications ----------
const safeLink = (l?: string | null) => (l && l.startsWith("/app/") ? l : null);

export function Notifications() {
  const { session, loading } = useSession();
  const n = useP(["notifications"], () => api.listNotifications(), !!session);
  const mark = useAct((x: string) => api.markNotificationRead(x), [["notifications"]]);
  const unread = (n.data || []).some((x) => !x.readAt);
  return (
    <Shell title="Notifications" right={unread ? <button className="go" disabled={mark.isPending} onClick={() => mark.mutate("all")}>Mark all read</button> : undefined}>
      <DemoBanner />
      <div className="pad">
        {!loading && !session && <NeedSignIn what="see notifications" />}
        {n.isLoading && <p className="sub">Loading…</p>}
        {(n.error || mark.error) && <ErrBox e={n.error || mark.error} />}
        {n.data && n.data.length === 0 && <p className="sub">You're all caught up.</p>}
        {n.data?.map((x) => {
          const link = safeLink(x.link);
          const body = (
            <div style={{ ...box, background: x.readAt ? undefined : "#f4f4f4" }}>
              <div className="num" style={{ fontSize: 11 }}>{x.kind} · {when(x.createdAt)}{!x.readAt && " · new"}</div>
              <b style={{ display: "block" }}>{x.title}</b>
              <p className="sub" style={{ whiteSpace: "pre-wrap", margin: "4px 0 0", fontSize: 14 }}>{x.body}</p>
            </div>
          );
          const onClick = () => { if (!x.readAt) mark.mutate(x.id); };
          return link ? <Link key={x.id} to={link} onClick={onClick}>{body}</Link>
            : <div key={x.id} onClick={onClick} role={x.readAt ? undefined : "button"}>{body}</div>;
        })}
      </div>
    </Shell>
  );
}

// ---------- Profile ----------
export function Profile() {
  const { session, loading } = useSession();
  const me = useP(["me"], () => api.getMe(), !!session);
  const upd = useAct((p: { name: string; city: string; bio: string; interests: string[] }) => api.updateMe(p), [["me"]]);
  const out = useAct(() => api.signOut(), [[]]);
  const [f, setF] = useState<{ name: string; city: string; bio: string; interests: string } | null>(null);
  useEffect(() => {
    if (me.data) setF({ name: me.data.name || "", city: me.data.city || "", bio: me.data.bio || "", interests: me.data.interests.join(", ") });
  }, [me.data]);
  const save = (e: FormEvent) => {
    e.preventDefault(); if (!f) return;
    upd.mutate({ name: f.name.trim(), city: f.city.trim(), bio: f.bio.trim(), interests: f.interests.split(",").map((s) => s.trim()).filter(Boolean) });
  };
  const inp = { width: "100%", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", marginTop: 4 } as const;
  return (
    <Shell title="Profile" right={<Link to="/app/notifications" className="ic" aria-label="Notifications"><Ic d={I.bell} size={18} /></Link>}>
      <DemoBanner />
      <div className="pad">
        {!loading && !session && <NeedSignIn what="see your profile" />}
        {me.isLoading && <p className="sub">Loading…</p>}
        {me.error && <ErrBox e={me.error} />}
        {me.data && f && (
          <>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <Av name={me.data.name || me.data.email} size={56} />
              <div><b style={{ fontSize: 20 }}>{me.data.name || "Unnamed member"}</b>
                <div className="num" style={{ fontSize: 12 }}>{me.data.email} · {me.data.role}{me.data.rsvpCount != null ? ` · ${me.data.rsvpCount} RSVPs` : ""}</div></div>
            </div>
            <form onSubmit={save}>
              <label className="lbl" style={{ display: "block", marginTop: 10 }}>Name<input style={inp} value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label className="lbl" style={{ display: "block", marginTop: 10 }}>City<input style={inp} value={f.city} maxLength={80} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
              <label className="lbl" style={{ display: "block", marginTop: 10 }}>Bio<textarea style={{ ...inp, minHeight: 80 }} value={f.bio} maxLength={500} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
              <label className="lbl" style={{ display: "block", marginTop: 10 }}>Interests (comma separated)<input style={inp} value={f.interests} onChange={(e) => setF({ ...f, interests: e.target.value })} /></label>
              <div style={{ marginTop: 14 }}><Button type="submit" loading={upd.isPending} disabled={upd.isPending}>Save profile</Button></div>
              {upd.isSuccess && <span className="sub" style={{ marginLeft: 10, fontSize: 12 }}>Saved</span>}
              {upd.error && <p role="alert" className="sub" style={{ fontSize: 12 }}>{errText(upd.error)}</p>}
            </form>
            <div style={{ marginTop: 20 }}>
              <Link className="it" to="/app/notifications">Notifications<span>→</span></Link>
              <Link className="it" to="/app/inbox">Messages<span>→</span></Link>
              <Link className="it" to="/app/events">My events<span>→</span></Link>
              {me.data.role === "admin" && <Link className="it" to="/admin">Admin<span>→</span></Link>}
            </div>
            <div style={{ marginTop: 16 }}><Button variant="ghost" loading={out.isPending} disabled={out.isPending} onClick={() => out.mutate(undefined)}>Sign out</Button></div>
          </>
        )}
      </div>
    </Shell>
  );
}
