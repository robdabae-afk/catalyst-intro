import { Link } from "react-router-dom";
import { Head, path } from "../FeaturesApp";
import { UPDATES } from "../data";
import { IGift, ILearn, ITicket, IArrow } from "../icons";
import { setState, useStore } from "../store";
import { UpdateCard } from "../parts";
import { STEPS, doneSteps } from "./Me";

export default function Home() {
  const [s] = useStore();
  const pct = Math.round((doneSteps(s).size / STEPS.length) * 100);
  const feed = UPDATES.filter((u) => s.follows.includes(u.company));
  return (
    <div className="st">
      <Head title="Today" />
      {!s.prefs.investing_opens ? (
        <div className="banner">
          <div className="grow">
            <b style={{ fontSize: 16 }}>Investing opens soon</b>
            <p style={{ fontSize: 13, opacity: .75, marginTop: 3 }}>Get a heads up the moment the portal is live.</p>
          </div>
          <button className="btn sm" onClick={() => setState((x) => ({ ...x, prefs: { ...x.prefs, investing_opens: true } }))}>Notify me</button>
        </div>
      ) : (
        <div className="card row"><b className="grow">You'll be alerted when investing opens.</b><span className="mono dim">On</span></div>
      )}

      <Link to={path("me")} className="card row" style={{ marginTop: 12 }}>
        <div className="grow">
          <div className="mono dim">Profile {pct}% complete</div>
          <div className="bar" style={{ marginTop: 10 }}><b style={{ width: `${pct}%` }} /></div>
          <p style={{ fontSize: 13, marginTop: 10 }}>{STEPS.length - doneSteps(s).size} steps left to finish setting up</p>
        </div>
        <IArrow />
      </Link>

      <div className="g2" style={{ marginTop: 12 }}>
        {[
          { to: "learn", I: ILearn, t: "Learn", d: "Reg CF in 5 cards" },
          { to: "invite", I: IGift, t: "Invite friends", d: "Skip the waitlist" },
          { to: "ticket", I: ITicket, t: "Your pass", d: "Pitch Night · Oct 13" },
        ].map(({ to, I, t, d }) => (
          <Link key={to} to={path(to)} className="card row"><I size={26} /><div className="grow"><b>{t}</b><div className="dim" style={{ fontSize: 13 }}>{d}</div></div><IArrow size={14} /></Link>
        ))}
      </div>

      <div className="sec"><h2>From companies you follow</h2><span className="mono dim">{feed.length}</span></div>
      <div className="g2">{feed.map((u) => <UpdateCard key={u.id} id={u.id} />)}</div>
      {!feed.length && <p className="dim">Follow a company to see founder updates here.</p>}
    </div>
  );
}
