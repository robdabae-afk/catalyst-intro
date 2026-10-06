import { Link } from "react-router-dom";
import { CountUp, Hud } from "../hud";
import { Head, path } from "../FeaturesApp";
import { ICheck, IArrow } from "../icons";
import { setState, State, toggle, useStore } from "../store";

export const STEPS = [
  { id: "photo", t: "Add a profile photo", d: "Helps founders recognize you at events." },
  { id: "bio", t: "Write a one-line bio", d: "What you do and what you're curious about." },
  { id: "interests", t: "Pick your interests", d: "Sectors and cities you want to see." },
  { id: "follow3", t: "Follow 3 companies", d: "Get their founder updates." },
  { id: "learn", t: "Finish the Reg CF basics", d: "Five quick cards.", to: "learn" },
  { id: "notifications", t: "Turn on the investing-opens alert", d: "One ping when the portal goes live.", to: "inbox" },
  { id: "invite", t: "Invite a friend", d: "Unlock waitlist priority.", to: "invite" },
  { id: "event", t: "Save your event pass", d: "Pitch Night, Oct 13.", to: "ticket" },
];

export function doneSteps(s: State) {
  const auto = new Set(s.steps);
  if (s.follows.length >= 3) auto.add("follow3");
  if (s.prefs.investing_opens) auto.add("notifications");
  return auto;
}

export default function Me() {
  const [s] = useStore();
  const auto = doneSteps(s);
  const done = STEPS.filter((x) => auto.has(x.id)).length;
  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="g-side">
      <div>
        <Head title="Me" />
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
          <div><span className="mono dim">Learned</span><CountUp to={Object.keys(s.learned).length} suffix="/5" /></div>
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
            return x.to && !d
              ? <Link key={x.id} to={path(x.to)} className="step">{inner}</Link>
              : <button key={x.id} className={`step${d ? " done" : ""}`} aria-pressed={d} onClick={() => setState((st) => ({ ...st, steps: toggle(st.steps, x.id) }))}>{inner}</button>;
          })}
        </div>
      </div>
      <aside className="card hud" style={{ marginTop: 22, alignSelf: "start" }}>
        <div className="mono dim">Account</div>
        <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>Investing opens soon. Portal registration is pending, so there's nothing to fund yet and no payment info is collected.</p>
        <Link to={path("invite")} className="btn ghost" style={{ width: "100%", marginTop: 14 }}>Invite friends</Link>
        <div className="me-links">
          <Link to={path("portfolio")} className="btn ghost">Portfolio</Link>
          <Link to={path("watchlist")} className="btn ghost">Watchlist</Link>
          <Link to={path("events")} className="btn ghost">Events</Link>
          <Link to={path("ticket")} className="btn ghost">Event pass</Link>
          <Link to={path("people")} className="btn ghost">People</Link>
          <Link to={path("learn")} className="btn ghost">Learn about Reg CF</Link>
          {(sessionStorage.getItem("cat-role") === "admin" || new URLSearchParams(location.search).get("role") === "admin") && <Link to={path("admin")} className="btn ghost">Admin</Link>}
        </div>
      </aside>
    </div>
  );
}
