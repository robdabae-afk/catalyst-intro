import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { COMMUNITY_SIZE, EVENTS, money, regCfLimit, usd } from "./data";
import { THREADS } from "./threads";
import { toggle, useTry } from "./store";
import { Av, I, Ic, SubTop, useNoindex } from "./ui";

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/* ---------------- Inbox ---------------- */
export function Inbox() {
  useNoindex("Messages");
  const [s] = useTry();
  const [f, setF] = useState<"all" | "founder" | "member" | "group">("all");
  const list = THREADS.filter((t) => f === "all" || t.kind === f);
  return (
    <div className="cx"><div className="page">
      <SubTop title="Messages" back="/app/swipe" />
      <div className="chips" style={{ padding: "14px 20px 6px" }}>
        {([["all", "All"], ["founder", "Founders"], ["member", "People"], ["group", "Event groups"]] as const).map(([k, l]) =>
          <button key={k} className={`chip ${f === k ? "on" : ""}`} onClick={() => setF(k)}>{l}</button>)}
      </div>
      {list.map((t) => {
        const mine = s.sent[t.id] || [];
        const last = mine.length ? { text: `You: ${mine[mine.length - 1].text}`, time: "Now" } : t.messages[t.messages.length - 1];
        const un = t.unread && !s.readThreads.includes(t.id);
        const lastText = "who" in last && last.who ? `${last.who}: ${last.text}` : last.text;
        return (
          <Link key={t.id} to={`/app/inbox/${t.id}`} className={`th ${un ? "un" : ""}`}>
            <Av name={t.name} group={t.kind === "group"} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nm"><span><b>{t.name}</b> <span className="sample">Sample</span></span><span className="dt" style={{ fontSize: 11, color: "var(--mute)" }}>{last.time}</span></div>
              <div style={{ fontSize: 12, color: "var(--mute)" }}>{t.sub}{t.members ? ` · ${t.members} members` : ""}</div>
              <div className="pv">{lastText}</div>
            </div>
            {un && <i className="udot" aria-label="Unread" />}
          </Link>
        );
      })}
      <p className="sub" style={{ fontSize: 12, padding: "16px 20px" }}>Preview. Everyone here is a made-up sample, and messages stay on this device. Questions about a deal go in that deal's public Questions tab.</p>
    </div></div>
  );
}

/* ---------------- Thread ---------------- */
export function ThreadPage() {
  const t = THREADS.find((x) => x.id === useParams().id);
  const [s, set] = useTry();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useNoindex(t?.name || "Message");
  useEffect(() => { if (t && !s.readThreads.includes(t.id)) set((x) => ({ ...x, readThreads: [...x.readThreads, t.id] })); }, [t?.id]);
  const mine = t ? s.sent[t.id] || [] : [];
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [mine.length]);
  if (!t) return <Navigate to="/app/inbox" replace />;
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    set((x) => ({ ...x, sent: { ...x.sent, [t.id]: [...(x.sent[t.id] || []), { text: v, at: Date.now() }] } }));
    setText("");
  };
  let prevWho = "";
  return (
    <div className="cx"><div className="page">
      <SubTop title={t.name} back="/app/inbox" right={<Av name={t.name} size={36} group={t.kind === "group"} />} />
      <div style={{ textAlign: "center", padding: "18px 20px 0" }}>
        <div style={{ fontSize: 13, color: "var(--mute)" }}>{t.sub}{t.members ? ` · ${t.members} members` : ""} · <span className="sample">Sample</span></div>
        {t.kind === "founder" && <div className="pub" style={{ textAlign: "left", marginTop: 12 }}><Ic d={I.shield} size={16} /><span>Founders can't discuss their raise in DMs. Ask about the deal in its public Questions tab so every investor sees the answer.</span></div>}
      </div>
      <div className="msgs">
        <div className="tm">{t.messages[0].time}</div>
        {t.messages.map((m, i) => {
          const showWho = t.kind === "group" && m.from === "them" && m.who !== prevWho;
          prevWho = m.who || "";
          return <div key={i} style={{ display: "contents" }}>
            {showWho && <div className="who">{m.who}</div>}
            <div className={`bub ${m.from === "me" ? "me" : ""}`}>{m.text}</div>
          </div>;
        })}
        {mine.length > 0 && <div className="tm">Today</div>}
        {mine.map((m) => <div key={m.at} className="bub me">{m.text}</div>)}
        {mine.length > 0 && <div style={{ alignSelf: "flex-end", fontSize: 11, color: "var(--mute)" }}>Saved on this device · not sent</div>}
        <div ref={end} />
      </div>
      <div className="composer"><form onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${t.kind === "group" ? "the group" : t.name.split(" ")[0]}`} aria-label="Message" />
        <button type="submit" disabled={!text.trim()} aria-label="Send"><Ic d={I.send} size={18} /></button>
      </form></div>
    </div></div>
  );
}

/* ---------------- Event detail ---------------- */
export function EventPage() {
  const e = EVENTS.find((x) => x.id === useParams().id);
  const [s, set] = useTry();
  useNoindex(e?.title || "Event");
  if (!e) return <Navigate to="/app/events" replace />;
  const going = s.rsvps.includes(e.id);
  const group = THREADS.find((t) => t.kind === "group" && t.name.toLowerCase().includes(e.title.split(" ")[0].toLowerCase()));
  return (
    <div className="cx"><div className="page" style={{ paddingBottom: 110 }}>
      <div className="evhero photo" style={{ backgroundImage: `url(${e.photo})`, borderRadius: 0, height: 300 }}><div className="ov" />
        <Link to="/app/events" className="ic" aria-label="Back" style={{ position: "absolute", top: 16, left: 16, background: "#fff" }}><Ic d={I.back} size={18} /></Link>
        <div className="tx"><span className="dt" style={{ color: "#ddd" }}>{e.date}</span><b style={{ display: "block", fontSize: 28, letterSpacing: "-.03em", marginTop: 4 }}>{e.title}</b></div>
      </div>
      <div style={{ padding: "6px 20px" }}>
        <p className="sub" style={{ fontSize: 12, margin: "8px 0 4px" }}>Photo from a past Catalyst event</p>
        <div className="it" style={{ cursor: "default" }}>Where<span>{e.place}</span></div>
        <div className="it" style={{ cursor: "default" }}>When<span>{e.date.replace(/ · /g, ", ")}</span></div>
        <div className="it" style={{ cursor: "default" }}>Cost<span>Free</span></div>
        <div className="sec"><h2>What to expect</h2><p>{e.blurb} Hosted by the Catalyst community, {COMMUNITY_SIZE} people in NYC. No pitch to you, no pressure to invest. Come to learn and meet people.</p></div>
        {group && <Link to={`/app/inbox/${group.id}`} className="th" style={{ padding: "14px 0" }}><Av name={group.name} group /><div style={{ flex: 1 }}><b>Event group chat</b><div className="pv">{group.members} people going are chatting</div></div><span>→</span></Link>}
        <p className="sub" style={{ fontSize: 12, marginTop: 10 }}>Preview schedule. RSVPs stay on this device.</p>
      </div>
      <div className="sticky"><div className="wrap">
        <button className={`btn ${going ? "ghost" : ""}`} style={{ flex: 1 }} aria-pressed={going} onClick={() => set((x) => ({ ...x, rsvps: toggle(x.rsvps, e.id) }))}>{going ? "You're going ✓" : "RSVP, it's free"}</button>
      </div></div>
    </div></div>
  );
}

/* ---------------- Settings ---------------- */
export function Settings() {
  useNoindex("Settings");
  const [s] = useTry();
  const lim = regCfLimit(s.income, s.netWorth);
  const Row = ({ to, d, label, val, ok }: { to: string; d: JSX.Element; label: string; val: string; ok?: boolean }) => (
    <Link to={to} className="it" style={{ gap: 14 }}><Ic d={d} size={20} /><span style={{ flex: 1, color: "var(--ink)", fontSize: 15 }}>{label}</span><span className={`stat ${ok ? "ok" : ""}`}>{val} →</span></Link>
  );
  return (
    <div className="cx"><div className="page">
      <SubTop title="Settings" back="/app/profile" />
      <div style={{ padding: "8px 20px" }}>
        <Row to="/app/account/identity" d={I.shield} label="Verify identity" val={s.idVerified ? "Verified" : "Not yet"} ok={s.idVerified} />
        <Row to="/app/account/limit" d={I.limit} label="Investing limit estimate" val={money(lim)} ok />
        <Row to="/app/account/bank" d={I.bank} label="Bank account" val={s.bankLinked ? "Linked" : "Not linked"} ok={s.bankLinked} />
        <Row to="/app/account/notifications" d={I.bell} label="Notifications" val={`${s.notifPrefs.length} on`} ok />
        <p className="sub" style={{ fontSize: 12, marginTop: 16 }}>Preview. Nothing here is sent anywhere or saved to a server.</p>
      </div>
    </div></div>
  );
}

function SetPage({ title, children }: { title: string; children: React.ReactNode }) {
  useNoindex(title);
  return <div className="cx"><div className="page"><SubTop title={title} back="/app/account" /><div style={{ padding: "18px 20px 40px" }}>{children}</div></div></div>;
}

export function SetIdentity() {
  const [s, set] = useTry();
  const nav = useNavigate();
  const [name, setName] = useState(""); const [dob, setDob] = useState(""); const [ssn, setSsn] = useState("");
  if (s.idVerified) return <SetPage title="Verify identity">
    <div className="h1" style={{ fontSize: 28 }}>You're verified.</div>
    <p className="sub" style={{ margin: "8px 0 20px" }}>In the preview this is just a checkmark on your device. Nothing was checked.</p>
    <button className="btn ghost" onClick={() => set((x) => ({ ...x, idVerified: false }))}>Reset</button>
  </SetPage>;
  return <SetPage title="Verify identity">
    <div className="h1" style={{ fontSize: 28 }}>Confirm it's you.</div>
    <p className="sub" style={{ marginTop: 8 }}>The law requires the funding portal to check who you are before you invest. It takes about two minutes.</p>
    <label className="field"><span className="lbl">Legal name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last" /></label>
    <label className="field"><span className="lbl">Date of birth</span><input value={dob} onChange={(e) => setDob(e.target.value)} placeholder="MM / DD / YYYY" inputMode="numeric" /></label>
    <label className="field"><span className="lbl">Last 4 of SSN</span><input value={ssn} onChange={(e) => setSsn(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" inputMode="numeric" /></label>
    <div className="pub"><Ic d={I.shield} size={16} /><span>Preview only. Please don't type real details. Nothing you enter leaves this page or gets saved.</span></div>
    <button className="btn" style={{ marginTop: 16 }} disabled={!name || dob.length < 6 || ssn.length < 4} onClick={() => { set((x) => ({ ...x, idVerified: true })); nav("/app/account"); }}>Verify</button>
  </SetPage>;
}

export function SetLimit() {
  const [s, set] = useTry();
  const lim = regCfLimit(s.income, s.netWorth);
  const invested = s.intents.reduce((a, b) => a + b.amount, 0);
  return <SetPage title="Investing limit">
    <span className="lbl">Estimated 12-month limit</span>
    <div className="amt num" style={{ textAlign: "left", margin: "6px 0 4px" }}>{usd(lim)}</div>
    <p className="sub">{usd(Math.max(0, lim - invested))} left after the interest you've noted on this device.</p>
    <label className="field" style={{ marginTop: 22 }}><span className="lbl">Yearly income</span><input className="num" inputMode="numeric" value={s.income || ""} onChange={(e) => set((x) => ({ ...x, income: Number(e.target.value.replace(/\D/g, "")) }))} /></label>
    <label className="field"><span className="lbl">Net worth, not counting your home</span><input className="num" inputMode="numeric" value={s.netWorth || ""} onChange={(e) => set((x) => ({ ...x, netWorth: Number(e.target.value.replace(/\D/g, "")) }))} /></label>
    <div className="soon" style={{ marginTop: 14, lineHeight: 1.45 }}>If your income or net worth is under $124,000, you can invest the greater of $2,500 or 5% of the higher one. If both are $124,000 or more, it's 10% of the higher one, capped at $124,000. This counts across all startup investments over 12 months. It's an estimate, not advice.</div>
  </SetPage>;
}

export function SetBank() {
  const [s, set] = useTry();
  return <SetPage title="Bank account">
    <div className="h1" style={{ fontSize: 28 }}>{s.bankLinked ? "Sample bank linked." : "Link a bank."}</div>
    <p className="sub" style={{ margin: "8px 0 20px" }}>When investing opens, money moves through the SEC-registered funding portal and its escrow account, never through Catalyst directly. If a raise misses its goal, you get it back.</p>
    {s.bankLinked ? (
      <>
        <div className="th" style={{ padding: "14px 0" }}><span className="lav grp" style={{ width: 44, height: 44 }}><Ic d={I.bank} size={20} /></span><div style={{ flex: 1 }}><b>Sample Bank ····0000</b><div className="pv">Checking · preview only</div></div></div>
        <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => set((x) => ({ ...x, bankLinked: false }))}>Unlink</button>
      </>
    ) : (
      <>
        <button className="btn" onClick={() => set((x) => ({ ...x, bankLinked: true }))}>Link a sample bank</button>
        <p className="fine">Preview. No bank login, no account numbers, nothing connected.</p>
      </>
    )}
  </SetPage>;
}

export function SetNotifications() {
  const [s, set] = useTry();
  const OPTS = [["deals", "New deals that match your interests"], ["updates", "Updates from companies you saved"], ["answers", "Answers to your questions"], ["messages", "Messages"], ["events", "Events near you"]];
  return <SetPage title="Notifications">
    {OPTS.map(([k, l]) => {
      const on = s.notifPrefs.includes(k);
      return <button key={k} className="it" aria-pressed={on} onClick={() => set((x) => ({ ...x, notifPrefs: toggle(x.notifPrefs, k) }))}>{l}<i className={`sw ${on ? "on" : ""}`} /></button>;
    })}
    <p className="sub" style={{ fontSize: 12, marginTop: 14 }}>Preview. No real notifications are sent.</p>
  </SetPage>;
}
