import { Link } from "react-router-dom";
import { Head, path } from "../FeaturesApp";
import { byId, COMPANIES, EVENT, UPDATES } from "../data";
import { IArrow } from "../icons";
import { setState, useStore } from "../store";
import { UpdateCard } from "../parts";
import { CountUp, Hud, Icon, Meter, Duo } from "../hud";
import { STEPS, doneSteps } from "./Me";

export default function Home() {
  const [s] = useStore();
  const pct = Math.round((doneSteps(s).size / STEPS.length) * 100);
  const feed = UPDATES.filter((u) => s.follows.includes(u.company));
  const top = byId("brightyard")!;
  const raising = COMPANIES.filter((c) => c.raising);
  return (
    <div className="st">
      <Head title="Today" right={<span className="row mono" style={{ gap: 6 }}><span className="blink" />Sample feed</span>} />

      <Hud className="in" scan tag="Spotlight / 01">
        <Link to={path(`company/${top.id}`)} className="ph kb" style={{ display: "block", minHeight: 300, color: "#fff" }}>
          <img src={top.img} alt="" />
          <div className="ph-body" style={{ position: "absolute", left: 22, right: 22, bottom: 20 }}>
            <div className="row" style={{ gap: 10, marginBottom: 10 }}><Duo c={top} size={36} /><span className="mono" style={{ opacity: .8 }}>{top.sector} · {top.city}</span><span className="sample inv" style={{ marginLeft: "auto" }}>Sample</span></div>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.05 }}>{top.name}</h2>
            <p style={{ opacity: .8, fontSize: 14, marginTop: 4 }}>{top.tagline}</p>
            <div className="row" style={{ marginTop: 14, gap: 14 }}>
              <span className="mono"><CountUp to={top.progress} suffix="%" /> of goal</span>
              <span className="grow"><Meter pct={top.progress} /></span>
              <span className="mono"><CountUp to={top.backers} /> backers</span>
            </div>
          </div>
        </Link>
      </Hud>
      <p className="note" style={{ marginTop: 8 }}>Illustrative figures for a sample company.</p>

      {!s.prefs.investing_opens ? (
        <div className="banner" style={{ marginTop: 14 }}>
          <span className="ib" style={{ background: "transparent", borderColor: "rgba(255,255,255,.35)", color: "#fff" }}><Icon name="bell" size={20} /></span>
          <div className="grow">
            <b style={{ fontSize: 16 }}>Investing opens soon</b>
            <p style={{ fontSize: 13, opacity: .75, marginTop: 3 }}>Portal registration pending. Get one heads up when it's live.</p>
          </div>
          <button className="btn sm" onClick={() => setState((x) => ({ ...x, prefs: { ...x.prefs, investing_opens: true } }))}>Notify me</button>
        </div>
      ) : (
        <div className="card row" style={{ marginTop: 14 }}><Icon name="check" size={18} /><b className="grow">You'll be alerted when investing opens.</b><span className="mono dim">On</span></div>
      )}

      <div className="g2" style={{ marginTop: 12 }}>
        <Link to={path("me")} className="card row hud hov">
          <div className="grow">
            <div className="row mono" style={{ justifyContent: "space-between" }}><span className="dim">Profile</span><span><CountUp to={pct} suffix="%" /></span></div>
            <div style={{ marginTop: 10 }}><Meter pct={pct} /></div>
            <p style={{ fontSize: 13, marginTop: 10 }}>{STEPS.length - doneSteps(s).size} steps left to finish setting up</p>
          </div>
          <IArrow />
        </Link>
        <Link to={path("ticket")} className="ph hud hov" style={{ minHeight: 120, display: "block" }}>
          <img src="/x/ev-2.jpg" alt="" />
          <div className="ph-body" style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
            <div className="row"><Icon name="ticket" size={20} /><b className="grow">Your pass</b><IArrow size={14} /></div>
            <div className="mono" style={{ opacity: .8, marginTop: 4 }}>{EVENT.title} · Oct 13</div>
          </div>
        </Link>
        <Link to={path("learn")} className="card row hud hov"><span className="ib"><Icon name="edu" size={20} /></span><div className="grow"><b>Learn</b><div className="dim" style={{ fontSize: 13 }}>Reg CF in 5 swipeable cards</div></div><span className="mono">{Object.keys(s.learned).length}/5</span></Link>
        <Link to={path("invite")} className="card row hud hov"><span className="ib"><Icon name="mutual" size={20} /></span><div className="grow"><b>Invite friends</b><div className="dim" style={{ fontSize: 13 }}>Skip the waitlist together</div></div><IArrow size={14} /></Link>
      </div>

      <div className="sec"><h2><span className="ix">02</span>Raising now</h2><Link to={path("search")} className="mono dim">See all</Link></div>
      <div className="chips" style={{ gap: 12 }}>
        {raising.map((c) => (
          <Link key={c.id} to={path(`company/${c.id}`)} className="ph" style={{ width: 200, height: 240, flex: "none" }}>
            <img src={c.img} alt="" loading="lazy" />
            <div className="ph-body" style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
              <Duo c={c} size={30} />
              <b style={{ display: "block", marginTop: 8, fontSize: 15 }}>{c.name}</b>
              <div className="mono" style={{ opacity: .75, margin: "4px 0 8px" }}>{c.progress}% · {c.daysLeft}d left</div>
              <Meter pct={c.progress} />
            </div>
          </Link>
        ))}
      </div>

      <div className="sec"><h2><span className="ix">03</span>From companies you follow</h2><span className="mono dim">{feed.length}</span></div>
      <div className="g2">{feed.map((u) => <UpdateCard key={u.id} id={u.id} />)}</div>
      {!feed.length && <p className="dim">Follow a company to see founder updates here.</p>}
    </div>
  );
}
