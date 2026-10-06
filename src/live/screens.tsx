import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/brand/icons";
import { Button, Chip, IconButton } from "@/brand/Button";
import { DEALS, EVENTS, NOTIFS, catalogStatus, loadCatalog, useCatalog } from "@/features/catalog";
import { requireAccount } from "@/features/sync";
import { usd } from "./data";
import { LiveImage, useClock } from "./parts";
import { useCountUp, useReducedMotion } from "./hooks";
import {
  ago, cancelReservation, checkAdmin, countRows, deleteCompany, deleteEvent, ID_RE, listCompanies, listEvents, listMessages, listMyReservations,
  listMyThreads, logAdmin, myLimit, saveCompany, saveEvent, sendMessage, slugify, uploadMedia, useAdmin, useUid,
  type CompanyRow, type CompanyStatus, type EventRow, type EventStatus, type MRow, type ReservationRow,
} from "./db";

/* Production screens. Every number here comes from the database; nothing is invented. */

function Top({ l, r }: { l: string; r?: string }) { const c = useClock(); return <header className="lv-top"><div className="lv-mono">{l}</div><div className="lv-mono dim">{r ?? c}</div></header>; }
function Empty({ icon = "discover", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return <div className="lv-empty"><Icon name={icon} size={30} /><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}
function SignInPrompt({ what }: { what: string }) {
  return <Empty icon="profile" title="Sign in to continue"><>{what}</><br /><br /><Button onClick={() => requireAccount()}>Create account</Button></Empty>;
}
const dealName = (id: string) => DEALS.find((d) => d.id === id)?.name ?? id;
const dealImg = (id: string) => DEALS.find((d) => d.id === id)?.img ?? "";

/* ---------- PORTFOLIO: interest reservations only (no money moves) ---------- */
export function PortfolioView() {
  useCatalog();
  const uid = useUid();
  const [rows, setRows] = useState<ReservationRow[] | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const r = await listMyReservations();
    setRows(r.data ?? []); if (!r.ok) setNote(r.error ?? "");
    setLimit(await myLimit());
  }, []);
  useEffect(() => { if (uid) void load(); }, [uid, load]);
  if (uid === undefined) return <div className="lv-pf"><Top l="PORTFOLIO" /><Empty title="Loading…" /></div>;
  if (!uid) return <div className="lv-pf"><Top l="PORTFOLIO" /><SignInPrompt what="Your reserved interest in companies shows up here." /></div>;
  const list = rows ?? [];
  const total = list.reduce((s, h) => s + Number(h.amount), 0);
  return (
    <div className="lv-pf">
      <Top l="PORTFOLIO" />
      <div className="lv-pf-hero">
        <span className="lv-pill dk"><i />RESERVED INTEREST</span>
        <div className="lv-big xl">{usd(total)}</div>
        <div className="lv-mono dim">{list.length} {list.length === 1 ? "COMPANY" : "COMPANIES"} · NO MONEY HAS MOVED</div>
      </div>
      {rows === null && <Empty title="Loading…" />}
      {rows !== null && !list.length && <Empty icon="deals" title="Nothing reserved yet">{note || "Reserve interest from a company page. Nothing is charged."}</Empty>}
      <ul className="lv-list">
        {list.map((h) => (
          <li key={h.id} className="lv-li">
            <LiveImage src={dealImg(h.company_id)} intro={false} className="lv-thumb" />
            <div className="lv-li-m"><strong>{dealName(h.company_id)}</strong><span className="lv-mono dim">INTEREST · {ago(h.created_at)}</span></div>
            <div className="lv-li-r"><b>{usd(Number(h.amount))}</b>
              <Button size="sm" variant="ghost" onClick={async () => { const r = await cancelReservation(h.company_id); if (r.ok) void load(); else setNote(r.error ?? ""); }}>Cancel</Button></div>
          </li>
        ))}
      </ul>
      <div className="lv-tele lv-mono">
        {limit !== null ? <><span>REG CF LIMIT <b>{usd(limit)}</b></span><span>RESERVED <b>{Math.round((total / limit) * 100)}%</b></span></> : <span className="dim">SET YOUR REG CF LIMIT IN ONBOARDING</span>}
      </div>
      <p className="lv-fine pad">Reservations are non-binding interest. Catalyst's funding-portal registration is pending; investing opens only through a registered portal.</p>
    </div>
  );
}

/* ---------- PROFILE (standalone page only) ---------- */
export function ProfileView({ isAdmin = false, onAdmin }: { isAdmin?: boolean; onAdmin?: () => void }) {
  const uid = useUid();
  return (
    <div className="lv-prof">
      <Top l="PROFILE" />
      {uid ? <div className="lv-sec"><p className="dim">Manage your profile from the Me tab.</p></div> : <SignInPrompt what="Create an account to save companies and RSVP." />}
      <div className="lv-sec lv-pmenu">{onAdmin && <Button variant="secondary" icon="dashboard" block onClick={onAdmin}>{isAdmin ? "Admin" : "List your company"}</Button>}</div>
    </div>
  );
}

/* ---------- INBOX + THREAD (thread id = company id) ---------- */
type ThreadSum = { key: string; company: string; investor: string; last: MRow; count: number };
function summarize(rows: MRow[]): ThreadSum[] {
  const m = new Map<string, ThreadSum>();
  for (const r of rows) {
    const key = `${r.thread_id}:${r.user_id}`;
    const cur = m.get(key);
    if (!cur) m.set(key, { key, company: r.thread_id, investor: r.user_id, last: r, count: 1 });
    else { cur.count++; if (r.created_at > cur.last.created_at) cur.last = r; }
  }
  return [...m.values()].sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
}
export function InboxView({ onOpen }: { onOpen: (id: string) => void }) {
  useCatalog();
  const uid = useUid();
  const [rows, setRows] = useState<MRow[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { if (!uid) return; void listMyThreads().then((r) => { setRows(r.data ?? []); if (!r.ok) setErr(r.error ?? ""); }); }, [uid]);
  if (uid === undefined) return <div className="lv-inbox"><Top l="INBOX" /><Empty title="Loading…" /></div>;
  if (!uid) return <div className="lv-inbox"><Top l="INBOX" /><SignInPrompt what="Message founders directly once you're signed in." /></div>;
  const threads = summarize(rows ?? []);
  return (
    <div className="lv-inbox">
      <Top l="INBOX" r={`${threads.length} ${threads.length === 1 ? "THREAD" : "THREADS"}`} />
      {rows === null && <Empty title="Loading…" />}
      {rows !== null && !threads.length && <Empty icon="send" title="No messages yet">{err || "Open a company and message the founder. Replies land here."}</Empty>}
      <ul className="lv-list">
        {threads.map((t, k) => {
          const founderView = t.investor !== uid;
          return (
            <li key={t.key}><button type="button" className="lv-li lv-libtn" style={{ animationDelay: `${k * 60}ms` }}
              onClick={() => onOpen(founderView ? `${t.company}?u=${t.investor}` : t.company)}>
              <LiveImage src={dealImg(t.company)} intro={false} className="lv-thumb round" />
              <div className="lv-li-m"><strong>{dealName(t.company)}{founderView ? " · investor" : ""}</strong><span className="lv-snip">{t.last.sender_id === uid ? "You: " : ""}{t.last.body}</span></div>
              <div className="lv-li-r"><span className="lv-mono dim">{ago(t.last.created_at)}</span><Icon name="forward" size={14} /></div>
            </button></li>
          );
        })}
      </ul>
    </div>
  );
}
export function ThreadView({ id, onBack }: { id: string; onBack?: () => void }) {
  useCatalog();
  const uid = useUid();
  // id may be "company" (investor view) or "company?u=<investor uuid>" (founder replying)
  const [company, q] = id.split("?");
  const investor = new URLSearchParams(q ?? (typeof window !== "undefined" ? window.location.search : "")).get("u") || undefined;
  const [rows, setRows] = useState<MRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const load = useCallback(async () => { const r = await listMessages(company, investor ?? uid ?? undefined); setRows(r.data ?? []); if (!r.ok) setErr(r.error ?? ""); }, [company, investor, uid]);
  useEffect(() => { if (uid) void load(); }, [uid, load]);
  const send = async () => {
    const b = draft.trim(); if (!b || busy || !requireAccount()) return;
    setBusy(true); setErr("");
    const r = await sendMessage(company, b, investor && investor !== uid ? investor : undefined);
    setBusy(false);
    if (r.ok) { setDraft(""); void load(); } else setErr(r.error ?? "Couldn't send.");
  };
  const valid = ID_RE.test(company);
  return (
    <div className="lv-thread">
      <header className="lv-thread-h">
        {onBack && <IconButton icon="back" label="Back" variant="ghost" onClick={onBack} />}
        <LiveImage src={dealImg(company)} intro={false} className="lv-thumb round sm" />
        <div><strong>{valid ? dealName(company) : "Conversation"}</strong><div className="lv-mono dim">{investor && investor !== uid ? "INVESTOR THREAD" : "FOUNDER"}</div></div>
      </header>
      <div className="lv-msgs" aria-live="polite">
        {uid === null && <SignInPrompt what="Sign in to message this founder." />}
        {uid && rows === null && <Empty title="Loading…" />}
        {uid && rows !== null && !rows.length && <Empty icon="send" title="Start the conversation">Questions go straight to the founder.</Empty>}
        {(rows ?? []).map((m) => <div key={m.id} className={`lv-msg${(m.sender_id ?? m.user_id) === uid ? " me" : ""}`}>{m.body}</div>)}
        {err && <p className="lv-fine" role="alert">{err}</p>}
      </div>
      {valid && <form className="lv-compose" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder={investor ? "Reply…" : "Ask the founder…"} aria-label="Message" />
        <IconButton type="submit" icon="send" label="Send" variant="primary" className="lv-send" disabled={!draft.trim() || busy} />
      </form>}
    </div>
  );
}

/* ---------- NOTIFICATIONS ---------- */
export function NotificationsView() {
  useCatalog();
  return (
    <div className="lv-notes">
      <Top l="NOTIFICATIONS" r={`${NOTIFS.length} NEW`} />
      {!NOTIFS.length ? <Empty icon="bell" title="You're all caught up">Updates from companies you save show up here.</Empty> : (
        <ul className="lv-list">{NOTIFS.map((n) => <li key={n.id} className="lv-note"><span className="lv-note-ic"><Icon name="announce" size={18} /></span><span className="lv-note-t">{(n as { title?: string }).title ?? ""}</span></li>)}</ul>
      )}
    </div>
  );
}

/* ---------- ONBOARDING (standalone page only) ---------- */
const STEPS = [
  { k: "WELCOME", h: "Back the startups on your block.", p: "Catalyst is a startup-investing app for everyday people." },
  { k: "INTERESTS", h: "What do you want to see?", p: "Pick a few. You can change these later." },
  { k: "LIMITS", h: "Know your limit.", p: "Reg CF caps how much non-accredited investors can put in each year. The floor is $2,500; this is an example." },
  { k: "RISK", h: "Startups are risky.", p: "Most fail. Only invest money you can afford to lose." },
];
export function OnboardingView() {
  const [s, setS] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
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
      <div key={s} className="lv-onb-txt"><div className="lv-mono dim">{st.k.charAt(0) + st.k.slice(1).toLowerCase()}</div><h2>{st.h}</h2><p>{st.p}</p></div>
      <div className="lv-onb-cta">
        {s > 0 && <Button variant="ghost" onClick={() => setS(s - 1)}>Back</Button>}
        <Button iconRight="forward" block onClick={() => (s === STEPS.length - 1 ? requireAccount() && window.location.assign("/") : setS(s + 1))}>{s === STEPS.length - 1 ? "Get started" : "Continue"}</Button>
      </div>
    </div>
  );
}

/* ---------- ADMIN + FOUNDER LISTINGS ---------- */
const COMPANY_TEMPLATE = {
  name: "", line: "", sector: "", stage: "Pre-seed", city: "New York, NY", about: "", problem: "", solution: "",
  minCheck: 0, valuationCap: "", goal: 0, instrument: "SAFE", coverUrl: "", pitchUrl: "",
  traction: [] as string[], useOfFunds: [] as string[], milestones: [] as string[], risks: [] as string[],
  team: [{ name: "", bio: "", photo: "" }], updates: [] as { title: string; body: string; when: string }[],
};
type Draft = { id: string; status: CompanyStatus; sort: number; json: string; isNew: boolean; owner_id?: string | null };
const toDraft = (r?: CompanyRow): Draft => r
  ? { id: r.id, status: r.status, sort: r.sort ?? 0, json: JSON.stringify({ ...COMPANY_TEMPLATE, ...r.data }, null, 2), isNew: false, owner_id: r.owner_id }
  : { id: "", status: "pending", sort: 0, json: JSON.stringify(COMPANY_TEMPLATE, null, 2), isNew: true };

function UploadField({ onUrl }: { onUrl: (u: string) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <label>Upload photo or video
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return; setMsg("Uploading…");
        const r = await uploadMedia(f); e.target.value = "";
        if (r.ok && r.data) { onUrl(r.data); setMsg("Uploaded. URL copied into the field."); } else setMsg(r.error ?? "Upload failed.");
      }} />
      {msg && <span className="dim" role="status">{msg}</span>}
    </label>
  );
}

function CompanyEditor({ draft, admin, onDone }: { draft: Draft; admin: boolean; onDone: (saved: boolean) => void }) {
  const [d, setD] = useState(draft);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => { try { const v = JSON.parse(d.json); return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null; } catch { return null; } }, [d.json]);
  const setField = (k: string, v: unknown) => parsed && setD({ ...d, json: JSON.stringify({ ...parsed, [k]: v }, null, 2) });
  const statuses: CompanyStatus[] = admin ? ["draft", "pending", "published", "archived"] : ["draft", "pending", "archived"];
  const save = async () => {
    setErr("");
    if (!parsed) return setErr("Details must be valid JSON.");
    const name = String(parsed.name ?? "").trim();
    if (!name) return setErr("Company name is required.");
    if (!String(parsed.line ?? "").trim()) return setErr("One-line description is required.");
    const id = d.isNew ? (d.id || slugify(name)) : d.id;
    if (!ID_RE.test(id)) return setErr("ID must be 3–60 lowercase letters, numbers or dashes.");
    if (!admin && d.status === "published") return setErr("Only Catalyst can publish.");
    setBusy(true);
    const r = await saveCompany({ id, status: d.status, data: parsed, sort: admin ? d.sort : undefined }, d.isNew);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Couldn't save.");
    if (admin && draft.status !== d.status) {
      const action = d.status === "published" ? (draft.status === "pending" ? "approve" : "publish") : d.status === "archived" ? "archive" : draft.status === "published" ? "unpublish" : draft.status === "pending" && d.status === "draft" ? "reject" : null;
      if (action) await logAdmin(action, id, name);
    }
    if (d.status === "published" || draft.status === "published") void loadCatalog();
    onDone(true);
  };
  return (
    <div className="lv-form">
      <div className="lv-mono dim">{d.isNew ? "NEW COMPANY" : `EDIT · ${d.id}`}</div>
      <label>Company name *<input value={String(parsed?.name ?? "")} disabled={!parsed} onChange={(e) => setField("name", e.target.value)} maxLength={80} /></label>
      <label>One-liner *<input value={String(parsed?.line ?? "")} disabled={!parsed} onChange={(e) => setField("line", e.target.value)} maxLength={140} /></label>
      {d.isNew && <label>ID (url)<input value={d.id} placeholder={parsed?.name ? slugify(String(parsed.name)) : "my-company"} onChange={(e) => setD({ ...d, id: e.target.value.toLowerCase() })} maxLength={60} /></label>}
      <label>Status<select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as CompanyStatus })}>{statuses.map((s) => <option key={s} value={s}>{s === "pending" ? "pending review" : s}</option>)}</select></label>
      {admin && <label>Sort order<input type="number" value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value) || 0 })} /></label>}
      <UploadField onUrl={(u) => setField(/\.(mp4|mov)$/i.test(u) ? "pitchUrl" : "coverUrl", u)} />
      <label>All details (JSON)<textarea className="json" spellCheck={false} value={d.json} onChange={(e) => setD({ ...d, json: e.target.value })} aria-invalid={!parsed} /></label>
      {!parsed && <span className="err">JSON has a syntax error.</span>}
      {err && <span className="err" role="alert">{err}</span>}
      <div className="row">
        <Button icon="check" disabled={busy || !parsed} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button>
        <Button variant="ghost" onClick={() => onDone(false)}>Cancel</Button>
        {!d.isNew && (admin || draft.status !== "published") && <Button variant="ghost" icon="close" onClick={async () => {
          if (!window.confirm(`Delete ${d.id}? This can't be undone.`)) return;
          const r = await deleteCompany(d.id); if (!r.ok) return setErr(r.error ?? "");
          if (admin) await logAdmin("archive", d.id, "deleted");
          void loadCatalog(); onDone(true);
        }}>Delete</Button>}
      </div>
    </div>
  );
}

type EvDraft = { id?: string; title: string; starts_at: string; ends_at: string; venue: string; city: string; image_url: string; url: string; capacity: string; company_ids: string; status: EventStatus };
const local = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const toEv = (e?: EventRow): EvDraft => e
  ? { id: e.id, title: e.title, starts_at: local(e.starts_at), ends_at: local(e.ends_at), venue: e.venue, city: e.city, image_url: e.image_url ?? "", url: e.url ?? "", capacity: e.capacity ? String(e.capacity) : "", company_ids: (e.company_ids ?? []).join(", "), status: e.status }
  : { title: "", starts_at: "", ends_at: "", venue: "", city: "New York", image_url: "", url: "", capacity: "", company_ids: "", status: "draft" };

function EventEditor({ ev, onDone }: { ev: EvDraft; onDone: (saved: boolean) => void }) {
  const [e, setE] = useState(ev);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const f = (k: keyof EvDraft) => (x: { target: { value: string } }) => setE({ ...e, [k]: x.target.value });
  const save = async () => {
    setErr("");
    if (!e.title.trim()) return setErr("Title is required.");
    if (!e.starts_at) return setErr("Start time is required.");
    const ids = e.company_ids.split(/[\s,]+/).filter(Boolean);
    if (ids.some((x) => !ID_RE.test(x))) return setErr("Company IDs must be lowercase IDs separated by commas.");
    const cap = e.capacity ? Math.floor(Number(e.capacity)) : null;
    if (cap !== null && !(cap > 0)) return setErr("Capacity must be a positive number.");
    setBusy(true);
    const r = await saveEvent({ id: e.id, title: e.title.trim().slice(0, 160), starts_at: new Date(e.starts_at).toISOString(), ends_at: e.ends_at ? new Date(e.ends_at).toISOString() : null, venue: e.venue.trim(), city: e.city.trim(), image_url: e.image_url.trim() || null, url: e.url.trim() || null, capacity: cap, company_ids: ids, status: e.status });
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Couldn't save.");
    if (e.status !== ev.status) await logAdmin(e.status === "published" ? "event_publish" : "event_archive", e.id ?? e.title, e.title);
    void loadCatalog(); onDone(true);
  };
  return (
    <div className="lv-form">
      <div className="lv-mono dim">{e.id ? "EDIT EVENT" : "NEW EVENT"}</div>
      <label>Title *<input value={e.title} onChange={f("title")} maxLength={160} /></label>
      <label>Starts *<input type="datetime-local" value={e.starts_at} onChange={f("starts_at")} /></label>
      <label>Ends<input type="datetime-local" value={e.ends_at} onChange={f("ends_at")} /></label>
      <label>Venue<input value={e.venue} onChange={f("venue")} /></label>
      <label>City<input value={e.city} onChange={f("city")} /></label>
      <label>Event page URL<input type="url" value={e.url} onChange={f("url")} placeholder="https://luma.com/…" /></label>
      <label>Image URL<input type="url" value={e.image_url} onChange={f("image_url")} /></label>
      <UploadField onUrl={(u) => setE((x) => ({ ...x, image_url: u }))} />
      <label>Capacity<input inputMode="numeric" value={e.capacity} onChange={f("capacity")} /></label>
      <label>Company IDs (comma separated)<input value={e.company_ids} onChange={f("company_ids")} /></label>
      <label>Status<select value={e.status} onChange={f("status")}>{(["draft", "published", "archived"] as EventStatus[]).map((s) => <option key={s}>{s}</option>)}</select></label>
      {err && <span className="err" role="alert">{err}</span>}
      <div className="row">
        <Button icon="check" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button>
        <Button variant="ghost" onClick={() => onDone(false)}>Cancel</Button>
        {e.id && <Button variant="ghost" icon="close" onClick={async () => { if (!window.confirm("Delete this event?")) return; const r = await deleteEvent(e.id!); if (!r.ok) return setErr(r.error ?? ""); await logAdmin("event_archive", e.id!, "deleted"); void loadCatalog(); onDone(true); }}>Delete</Button>}
      </div>
    </div>
  );
}

const Status = ({ s }: { s: string }) => <span className={`lv-status ${s}`}>{s === "pending" ? "in review" : s}</span>;

export function AdminView() {
  useCatalog();
  const uid = useUid();
  const admin = useAdmin();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [rows, setRows] = useState<CompanyRow[] | null>(null);
  const [evs, setEvs] = useState<EventRow[] | null>(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [evEdit, setEvEdit] = useState<EvDraft | null>(null);
  const [kpi, setKpi] = useState<{ q: number | null; r: number | null }>({ q: null, r: null });
  useEffect(() => { if (admin) setScope("all"); }, [admin]);
  const load = useCallback(async () => {
    const r = await listCompanies(scope); setRows(r.data ?? []); setErr(r.ok ? "" : r.error ?? "");
    if (await checkAdmin()) {
      const e = await listEvents(); setEvs(e.data ?? []);
      setKpi({ q: await countRows("app_questions"), r: await countRows("app_reservations") });
    }
  }, [scope]);
  useEffect(() => { if (uid) void load(); }, [uid, load]);
  if (uid === undefined || (uid && admin === null)) return <div className="lv-admin"><Top l="COMPANIES" /><Empty title="Loading…" /></div>;
  if (!uid) return <div className="lv-admin"><Top l="LIST YOUR COMPANY" /><SignInPrompt what="Founders can submit their company for review once signed in." /></div>;
  if (edit) return <div className="lv-admin"><Top l={admin ? "ADMIN / COMPANY" : "YOUR COMPANY"} /><CompanyEditor draft={edit} admin={!!admin} onDone={(s) => { setEdit(null); if (s) void load(); }} /></div>;
  if (evEdit) return <div className="lv-admin"><Top l="ADMIN / EVENT" /><EventEditor ev={evEdit} onDone={(s) => { setEvEdit(null); if (s) void load(); }} /></div>;
  const list = rows ?? [];
  const pending = list.filter((r) => r.status === "pending");
  return (
    <div className="lv-admin">
      <Top l={admin ? "ADMIN / OVERVIEW" : "YOUR COMPANIES"} r={catalogStatus === "missing" ? "NOT LIVE YET" : undefined} />
      {admin && <div className="lv-kpis">
        <div><em>LIVE COMPANIES</em><b>{DEALS.length}</b></div>
        <div><em>IN REVIEW</em><b>{scope === "all" ? pending.length : "–"}</b></div>
        <div><em>QUESTIONS</em><b>{kpi.q ?? "–"}</b></div>
        <div><em>RESERVATIONS</em><b>{kpi.r ?? "–"}</b></div>
      </div>}
      <div className="lv-sec">
        <div className="lv-form" style={{ padding: 0 }}>
          <div className="row">
            <Button icon="plus" onClick={() => setEdit(toDraft())}>{admin ? "Add company" : "List your company"}</Button>
            {admin && <Button variant="secondary" onClick={() => setScope(scope === "all" ? "mine" : "all")}>{scope === "all" ? "Show mine" : "Show all"}</Button>}
          </div>
        </div>
      </div>
      {err && <Empty title="Companies aren't available yet">{err}</Empty>}
      {!err && rows === null && <Empty title="Loading…" />}
      {!err && rows !== null && !list.length && <Empty icon="deals" title={admin ? "No companies yet" : "You haven't listed a company"}>{admin ? "Add the first one." : "Submit it and Catalyst reviews it before it goes live."}</Empty>}
      {list.map((r) => (
        <div key={r.id} className="lv-adm-row">
          <div className="m"><strong>{String(r.data?.name ?? r.id)}</strong><span className="lv-mono dim">{r.id} · {ago(r.updated_at)}</span></div>
          <Status s={r.status} />
          {admin && r.status === "pending" && <Button size="sm" icon="check" onClick={async () => { const x = await saveCompany({ id: r.id, status: "published", data: r.data }, false); if (x.ok) { await logAdmin("approve", r.id, String(r.data?.name ?? "")); void loadCatalog(); void load(); } else setErr(x.error ?? ""); }}>Approve</Button>}
          <Button size="sm" variant="ghost" onClick={() => setEdit(toDraft(r))}>Edit</Button>
        </div>
      ))}
      {admin && <>
        <div className="lv-sec"><div className="lv-mono dim">EVENTS</div><div className="lv-form" style={{ padding: 0 }}><div className="row"><Button icon="plus" variant="secondary" onClick={() => setEvEdit(toEv())}>Add event</Button></div></div></div>
        {evs !== null && !evs.length && <Empty icon="events" title="No events yet" />}
        {(evs ?? []).map((e) => (
          <div key={e.id} className="lv-adm-row">
            <div className="m"><strong>{e.title}</strong><span className="lv-mono dim">{new Date(e.starts_at).toLocaleString()} · {e.venue || e.city}</span></div>
            <Status s={e.status} />
            <Button size="sm" variant="ghost" onClick={() => setEvEdit(toEv(e))}>Edit</Button>
          </div>
        ))}
        <p className="lv-fine pad">Live: {EVENTS.length} published events. Every status change is logged.</p>
      </>}
    </div>
  );
}
