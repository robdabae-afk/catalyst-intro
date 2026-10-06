import { useParams } from "react-router-dom";
import { Head } from "../FeaturesApp";
import { byId, UPDATES } from "../data";
import { setState, toggle, useStore, useToast } from "../store";
import { Toast, UpdateCard } from "../parts";
import { CountUp, Face, Hud, Icon, Logo, Meter } from "../hud";

export default function Company() {
  const { id = "" } = useParams();
  const c = byId(id);
  const [s] = useStore();
  const t = useToast();
  if (!c) return <Head title="Not found" back />;
  const following = s.follows.includes(c.id);
  const watching = !!s.watch[c.id];
  const ups = UPDATES.filter((u) => u.company === c.id);

  return (
    <div>
      <Head title="" back />
      <Hud className="in" scan tag={`${c.sector} / ${c.stage}`}>
        <div className="ph kb" style={{ minHeight: 320 }}>
          {c.pitch ? <video src={c.pitch} poster={c.img} muted loop playsInline autoPlay preload="metadata" /> : <img src={c.img} alt="" />}
          <div className="ph-body" style={{ position: "absolute", left: 22, right: 22, bottom: 20 }}>
            <div className="row" style={{ alignItems: "flex-end", gap: 14 }}>
              <Logo c={c} size={60} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}><span className="sample inv">Sample</span>{c.pitch && <span className="chip-d"><Icon name="play" size={11} />Pitch · 1:30</span>}</div>
                <h1 style={{ fontSize: "clamp(26px,6vw,36px)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.05, marginTop: 8 }}>{c.name}</h1>
                <p style={{ opacity: .82, marginTop: 4 }}>{c.tagline}</p>
              </div>
            </div>
          </div>
        </div>
      </Hud>
      <div className="g-side" style={{ marginTop: 6 }}>
        <div>
          <p className="mono dim" style={{ marginTop: 16 }}>{c.sector} · {c.stage} · {c.city}</p>
          <div className="row" style={{ marginTop: 18, gap: 8, flexWrap: "wrap" }}>
            <button className={`btn${following ? " ghost" : ""}`} aria-pressed={following}
              onClick={() => { setState((x) => ({ ...x, follows: toggle(x.follows, c.id) })); t.show(following ? `Unfollowed ${c.name}` : `Following ${c.name}`); }}>
              {following ? <><Icon name="check" size={16} />Following</> : <><Icon name="plus" size={16} />Follow</>}</button>
            <button className="btn ghost" aria-pressed={watching}
              onClick={() => { setState((x) => { const w = { ...x.watch }; if (watching) delete w[c.id]; else w[c.id] = { raise: true, closing: true, update: true }; return { ...x, watch: w }; }); t.show(watching ? "Removed from watchlist" : "Added to watchlist"); }}>
              <Icon name="save" size={18} />{watching ? "Watching" : "Watch"}</button>
          </div>
          <div className="sec"><h2><span className="ix">01</span>Founder updates</h2><span className="mono dim">{ups.length}</span></div>
          <div className="st" style={{ display: "grid", gap: 12 }}>
            {ups.map((u) => <UpdateCard key={u.id} id={u.id} />)}
            {!ups.length && <div className="card dim">No updates yet. Follow to hear first.</div>}
          </div>
        </div>
        <aside className="card hud" style={{ marginTop: 22, alignSelf: "start" }}>
          <div className="row"><Face c={c} size={48} /><div className="grow"><b>{c.founder}</b><div className="mono dim">Founder · {c.city}</div></div></div>
          {c.raising ? (<>
            <div className="row" style={{ marginTop: 18, alignItems: "baseline" }}><span style={{ fontSize: 34, letterSpacing: "-.03em" }}><CountUp to={c.progress} suffix="%" /></span><span className="mono dim grow" style={{ marginLeft: 8 }}>of sample goal</span></div>
            <div style={{ marginTop: 10 }}><Meter pct={c.progress} /></div>
            <div className="row mono dim" style={{ marginTop: 10, justifyContent: "space-between" }}><span><CountUp to={c.backers} /> backers</span><span>{c.daysLeft}d left</span></div>
          </>) : <p className="mono dim" style={{ marginTop: 16 }}>Not raising</p>}
          <button className="btn" style={{ width: "100%", marginTop: 16 }} disabled>Investing opens soon</button>
          <p className="note" style={{ marginTop: 10 }}>Sample company. Portal registration pending; no investments are offered.</p>
        </aside>
      </div>
      <Toast msg={t.msg} />
    </div>
  );
}
