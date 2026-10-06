import { useState } from "react";
import { Link } from "react-router-dom";
import { CountUp, Hud } from "../hud";
import { Head, path } from "../FeaturesApp";
import { ICheck, IArrow, IWatch, IUp, ICal, IUserPlus, ILearn, ITicket, IGift } from "../icons";
import { setState, State, toggle, useStore } from "../store";
import { LEARN } from "../data";

const SECTORS = ["Climate", "Fintech", "AI", "Health", "Hardware", "Consumer", "Software"];

export const STEPS = [
  { id: "photo", t: "Add a profile photo", d: "Helps founders recognize you at events." },
  { id: "bio", t: "Write a one-line bio", d: "What you do and what you're curious about." },
  { id: "interests", t: "Pick your interests", d: "Sectors and cities you want to see." },
  { id: "follow3", t: "Follow 3 companies", d: "Get their founder updates.", to: "search" },
  { id: "learn", t: "Finish the Reg CF basics", d: "Five quick cards.", to: "learn" },
  { id: "notifications", t: "Turn on the investing-opens alert", d: "One ping when the portal goes live.", to: "inbox" },
  { id: "invite", t: "Invite a friend", d: "Unlock waitlist priority.", to: "invite" },
  { id: "event", t: "Save your event pass", d: "Pitch Night, Oct 13.", to: "ticket" },
];

/** Every step is derived from real data. Only invite + event pass are recorded actions. */
export function doneSteps(s: State) {
  const auto = new Set<string>(s.steps.filter((x) => x === "invite" || x === "event"));
  if (s.profile?.photo) auto.add("photo");
  if (s.profile?.bio?.trim()) auto.add("bio");
  if (s.interests.length) auto.add("interests");
  if (s.follows.length >= 3) auto.add("follow3");
  if (LEARN.every((c) => s.learned[c.id])) auto.add("learn");
  if (s.prefs.investing_opens) auto.add("notifications");
  return auto;
}

/** shrink a picked image to a 160px square JPEG data URL so it fits in the profile row */
function toAvatar(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 160; const k = Math.min(img.width, img.height);
      c.getContext("2d")!.drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, 160, 160); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.8)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("not an image")); };
    img.src = url;
  });
}

function Editor({ id, s, close }: { id: string; s: State; close: () => void }) {
  const [bio, setBio] = useState(s.profile?.bio ?? ""); const [err, setErr] = useState("");
  if (id === "photo") return (
    <div className="me-edit">
      <div className="row">{s.profile?.photo && <img className="me-photo" src={s.profile.photo} alt="Your profile photo" />}
        <label className="btn-ink">Choose photo<input type="file" accept="image/*" hidden aria-label="Profile photo" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          try { const photo = await toAvatar(f); setState((x) => ({ ...x, profile: { ...x.profile, photo } })); close(); } catch { setErr("That file isn't an image."); }
        }} /></label>
        {s.profile?.photo && <button type="button" className="chip" onClick={() => setState((x) => ({ ...x, profile: { ...x.profile, photo: "" } }))}>Remove</button>}
      </div>{err && <small role="alert">{err}</small>}
    </div>);
  if (id === "bio") return (
    <form className="me-edit" onSubmit={(e) => { e.preventDefault(); setState((x) => ({ ...x, profile: { ...x.profile, bio: bio.trim().slice(0, 140) } })); close(); }}>
      <input type="text" value={bio} maxLength={140} onChange={(e) => setBio(e.target.value)} placeholder="e.g. Product designer, curious about climate hardware" aria-label="One-line bio" autoFocus />
      <div className="row"><button type="submit" className="btn-ink" disabled={!bio.trim()}>Save bio</button><small className="dim">{bio.length}/140</small></div>
    </form>);
  return (
    <div className="me-edit">
      <div className="row">{SECTORS.map((x) => <button key={x} type="button" className={`chip${s.interests.includes(x) ? " on" : ""}`} aria-pressed={s.interests.includes(x)} onClick={() => setState((st) => ({ ...st, interests: toggle(st.interests, x) }))}>{x}</button>)}</div>
      <div className="row"><button type="button" className="btn-ink" onClick={close}>Done</button></div>
    </div>);
}

const MORE = [
  { to: "watchlist", t: "Watchlist", d: "Companies you saved", I: IWatch },
  { to: "portfolio", t: "Portfolio", d: "Sample holdings view", I: IUp },
  { to: "events", t: "Events", d: "NYC pitch nights and dinners", I: ICal },
  { to: "ticket", t: "Event pass", d: "Your QR pass for Pitch Night", I: ITicket },
  { to: "people", t: "People", d: "Founders and investors to meet", I: IUserPlus },
  { to: "learn", t: "Learn", d: "Reg CF basics in five cards", I: ILearn },
  { to: "invite", t: "Invite friends", d: "Move up the waitlist", I: IGift },
];
const ACCOUNT = [
  { to: "welcome", t: "Account and setup", d: "Create an account or redo onboarding" },
  { to: "legal/terms", t: "Terms of use", d: "" },
  { to: "legal/privacy", t: "Privacy notice", d: "" },
];

export default function Me() {
  const [s] = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const auto = doneSteps(s);
  const done = STEPS.filter((x) => auto.has(x.id)).length;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="g-side">
      <div>
        <Head title="Me" />
        <nav className="me-more" aria-label="More">
          {MORE.map(({ to, t, d, I }) => (
            <Link key={to} to={path(to)} className="me-row" data-to={to}>
              <I size={22} /><span className="grow"><b>{t}</b><small>{d}</small></span><IArrow size={14} />
            </Link>))}
          {(sessionStorage.getItem("cat-role") === "admin" || new URLSearchParams(location.search).get("role") === "admin") && <Link to={path("admin")} className="me-row" data-to="admin"><span className="grow"><b>Admin</b></span><IArrow size={14} /></Link>}
        </nav>
        <Hud className="me-hero in" scan>
          <div className="cf-ring" style={{ ["--p" as string]: pct }}><span><CountUp to={pct} suffix="%" /></span></div>
          <div className="grow">
            <b style={{ fontSize: 18 }}>{pct === 100 ? "You're all set" : "Finish your profile"}</b>
            <p style={{ fontSize: 13.5, marginTop: 4, opacity: .7 }}>{done} of {STEPS.length} done. Complete profiles get event invites first.</p>
          </div>
        </Hud>
        <div className="stat3">
          <div><span className="mono dim">Following</span><CountUp to={s.follows.length} /></div>
          <div><span className="mono dim">Watching</span><CountUp to={Object.keys(s.watch).length} /></div>
          <div><span className="mono dim">Learned</span><CountUp to={Object.values(s.learned).filter(Boolean).length} suffix="/5" /></div>
        </div>
        <div className="sec"><h2><span className="ix">01</span>Checklist</h2></div>
        <div className="st">
          {STEPS.map((x) => {
            const d = auto.has(x.id);
            const inner = (<>
              <span className="tick">{d && <ICheck size={14} />}</span>
              <span className="grow"><b style={{ fontWeight: 600 }}>{x.t}</b><span className="dim" style={{ display: "block", fontSize: 12.5, textDecoration: "none" }}>{x.d}</span></span>
              {x.to && !d && <IArrow size={14} />}
            </>);
            const editable = x.id === "photo" || x.id === "bio" || x.id === "interests";
            if (editable) return (<div key={x.id}>
              <button className={`step${d ? " done" : ""}`} aria-expanded={open === x.id} onClick={() => setOpen(open === x.id ? null : x.id)}>{inner}</button>
              {open === x.id && <Editor id={x.id} s={s} close={() => setOpen(null)} />}
            </div>);
            return x.to && !d
              ? <Link key={x.id} to={path(x.to)} className="step">{inner}</Link>
              : <div key={x.id} className={`step${d ? " done" : ""}`} aria-label={`${x.t}: ${d ? "done" : "not done"}`}>{inner}</div>;
          })}
        </div>
      </div>
      <nav className="me-more me-acct" aria-label="Account">
        {ACCOUNT.map(({ to, t, d }) => <Link key={to} to={path(to)} className="me-row" data-to={to}><span className="grow"><b>{t}</b>{d && <small>{d}</small>}</span><IArrow size={14} /></Link>)}
      </nav>
      <aside className="card hud" style={{ marginTop: 22, alignSelf: "start" }}>
        <div className="mono dim">Account</div>
        <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>Investing opens soon. Portal registration is pending, so there's nothing to fund yet and no payment info is collected.</p>
      </aside>
    </div>
  );
}
