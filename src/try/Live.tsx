// Member events wired to the platform adapter (sample backend when flag off, real API when on).
// Counts come only from the backend. Missing tables / errors fail closed with a message.
import { Link, useParams } from "react-router-dom";
import { api, errText, isSample, useAct, useP, useSession } from "@/lib/platform/client";
import { resetSample } from "@/lib/platform/sample";
import type { PEvent, Rsvp, RsvpStatus } from "@/lib/platform/contract";
import { Ic, I, Shell, useNoindex } from "./ui";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function DemoBanner() {
  if (!isSample) return null;
  return (
    <div role="status" style={{ background: "#000", color: "#fff", fontSize: 12, padding: "8px 14px", display: "flex", gap: 10, alignItems: "center", fontFamily: "'JetBrains Mono', monospace" }}>
      <b>DEMO</b><span style={{ flex: 1 }}>Sample data on this device only. Not the live backend.</span>
      <button style={{ textDecoration: "underline" }} onClick={() => { if (confirm("Reset sample data on this device?")) resetSample(); }}>Reset</button>
    </div>
  );
}

function ErrBox({ e }: { e: unknown }) {
  return <p role="alert" style={{ border: "1px solid #000", borderRadius: 12, padding: 14, fontSize: 14 }}>{errText(e)}</p>;
}

function SignInPrompt() {
  const act = useAct(() => api.signIn("you@sample.local", "sample"), [[]]);
  if (isSample)
    return (
      <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, margin: "12px 0" }}>
        <b>Sign in to RSVP</b>
        <p className="sub" style={{ fontSize: 13, margin: "4px 0 10px" }}>Demo mode: this signs you in as a local sample member.</p>
        <button className="btn" onClick={() => act.mutate(undefined)} disabled={act.isPending}>Continue as sample member</button>
      </div>
    );
  return <Link className="btn" to="/app/login" style={{ margin: "12px 0" }}>Sign in to RSVP</Link>;
}

const LABEL: Record<RsvpStatus, string> = {
  approved: "You're going ✓", pending: "Request sent", waitlisted: "On the waitlist", declined: "Not approved", cancelled: "Cancelled",
};

function spotsLeft(e: PEvent) { return e.capacity == null ? null : Math.max(0, e.capacity - e.goingCount); }

function Capacity({ e }: { e: PEvent }) {
  const left = spotsLeft(e);
  return (
    <span className="num" style={{ fontSize: 12 }}>
      {e.goingCount} going{e.capacity != null ? ` · ${left === 0 ? "full" : `${left} left`}` : ""}{e.waitlistCount ? ` · ${e.waitlistCount} waitlist` : ""}
    </span>
  );
}

function useMine(enabled: boolean) {
  return useP(["myRsvps"], () => api.myRsvps(), enabled);
}

function RsvpButton({ e, mine, compact }: { e: PEvent; mine?: Rsvp; compact?: boolean }) {
  const inv = [["myRsvps"], ["events"], ["event", e.id], ["notifications"]];
  const go = useAct((id: string) => api.rsvp(id), inv);
  const cancel = useAct((id: string) => api.cancelRsvp(id), inv);
  const busy = go.isPending || cancel.isPending;
  const err = go.error || cancel.error;
  const st = mine?.status;
  const active = st && st !== "cancelled";
  const full = spotsLeft(e) === 0;
  const past = Date.parse(e.startsAt) < Date.now();
  const cls = compact ? `go ${active ? "on" : ""}` : `btn ${active ? "ghost" : ""}`;
  let body: JSX.Element;
  if (e.status === "cancelled") body = <span className="sub">Event cancelled</span>;
  else if (st === "declined") body = <span className="sub">{LABEL.declined}</span>;
  else if (active)
    body = (
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, flexWrap: "wrap" }}>
        <span className={cls} style={{ cursor: "default" }}>{LABEL[st!]}</span>
        {!mine?.checkedInAt && !past && <button className="go" disabled={busy} onClick={() => confirm("Cancel your RSVP?") && cancel.mutate(e.id)}>Cancel</button>}
        {mine?.checkedInAt && <span className="sub" style={{ fontSize: 12 }}>Checked in</span>}
      </div>
    );
  else if (past) body = <span className="sub">This event has passed</span>;
  else body = <button className={cls} style={compact ? undefined : { flex: 1 }} disabled={busy} onClick={() => go.mutate(e.id)}>{busy ? "…" : full ? "Join waitlist" : "RSVP, it's free"}</button>;
  return <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: compact ? "none" : 1 }}>{body}{err && <span role="alert" className="sub" style={{ fontSize: 12 }}>{errText(err)}</span>}</div>;
}

export function Events() {
  const { session, loading } = useSession();
  const evs = useP(["events"], () => api.listEvents({ upcoming: true }));
  const mine = useMine(!!session);
  const byEvent = new Map((mine.data || []).map((r) => [r.eventId, r]));
  const going = (mine.data || []).filter((r) => r.status !== "cancelled" && r.status !== "declined");
  return (
    <Shell title="Events">
      <DemoBanner />
      <div className="pad">
        <p className="sub" style={{ marginBottom: 14 }}>Meet founders in person with the Catalyst community.</p>
        {!loading && !session && <SignInPrompt />}
        {session && going.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <span className="lbl">Your RSVPs</span>
            {going.map((r) => (
              <Link key={r.id} to={`/app/events/${r.eventId}`} className="it">{r.event.title}<span>{LABEL[r.status]} →</span></Link>
            ))}
          </div>
        )}
        <span className="lbl">Coming up</span>
        {evs.isLoading && <p className="sub">Loading events…</p>}
        {evs.error && <ErrBox e={evs.error} />}
        {evs.data && evs.data.length === 0 && <p className="sub">No upcoming events yet.</p>}
        {evs.data?.map((e) => (
          <div className="ev" key={e.id}>
            {e.coverUrl ? <div className="photo" style={{ backgroundImage: `url(${e.coverUrl})` }} role="img" aria-label="Event photo" /> : <div className="photo" style={{ background: "#000", display: "grid", placeItems: "center", color: "#fff" }}><Ic d={I.cal} /></div>}
            <Link to={`/app/events/${e.id}`} style={{ minWidth: 0, flex: 1 }}>
              <div className="dt">{fmt(e.startsAt)}</div><b style={{ display: "block" }}>{e.title}</b>
              <div className="sub" style={{ fontSize: 13 }}>{e.venue}</div><Capacity e={e} />
            </Link>
            {session && <RsvpButton e={e} mine={byEvent.get(e.id)} compact />}
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function EventPage() {
  const id = useParams().id!;
  const { session, loading } = useSession();
  const ev = useP(["event", id], () => api.getEvent(id));
  const mine = useMine(!!session);
  useNoindex(ev.data?.title || "Event");
  const e = ev.data;
  const r = mine.data?.find((x) => x.eventId === id);
  return (
    <div className="cx"><div className="page" style={{ paddingBottom: 40 }}>
      <DemoBanner />
      <div className="evhero photo" style={{ backgroundImage: e?.coverUrl ? `url(${e.coverUrl})` : undefined, background: e?.coverUrl ? undefined : "#000", borderRadius: 0, height: 260 }}><div className="ov" />
        <Link to="/app/events" className="ic" aria-label="Back" style={{ position: "absolute", top: 16, left: 16, background: "#fff" }}><Ic d={I.back} size={18} /></Link>
        {e && <div className="tx"><span className="dt" style={{ color: "#ddd" }}>{fmt(e.startsAt)}</span><b style={{ display: "block", fontSize: 28, letterSpacing: "-.03em", marginTop: 4 }}>{e.title}</b></div>}
      </div>
      <div style={{ padding: "6px 20px" }}>
        {ev.isLoading && <p className="sub">Loading…</p>}
        {ev.error && <ErrBox e={ev.error} />}
        {e && (
          <>
            {e.status === "cancelled" && <p role="alert" style={{ fontWeight: 600 }}>This event was cancelled.</p>}
            <div className="it" style={{ cursor: "default" }}>Where<span>{e.venue}{e.address ? `, ${e.address}` : ""}</span></div>
            <div className="it" style={{ cursor: "default" }}>When<span>{fmt(e.startsAt)}</span></div>
            <div className="it" style={{ cursor: "default" }}>Spots<span><Capacity e={e} /></span></div>
            <div className="sec"><h2>What to expect</h2><p style={{ whiteSpace: "pre-wrap" }}>{e.description}</p></div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
              {!loading && !session ? <SignInPrompt /> : session && <RsvpButton e={e} mine={r} />}
            </div>
            {r?.status === "pending" && <p className="sub" style={{ fontSize: 12 }}>The host reviews requests. You'll get a notification.</p>}
            {r?.status === "waitlisted" && <p className="sub" style={{ fontSize: 12 }}>Event is full. You'll be notified if a spot opens.</p>}
          </>
        )}
      </div>
    </div></div>
  );
}
