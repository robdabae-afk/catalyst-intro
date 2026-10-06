import { useParams } from "react-router-dom";
import { Head } from "../FeaturesApp";
import { byId, UPDATES } from "../data";
import { IWatch } from "../icons";
import { setState, toggle, useStore, useToast } from "../store";
import { Mark, Toast, UpdateCard } from "../parts";

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
      <div className="g-side">
        <div>
          <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
            <span className="mark" style={{ width: 64, height: 64, borderRadius: 18, fontSize: 28 }}>{c.name[0]}</span>
            <div className="grow">
              <div className="row" style={{ gap: 8 }}><h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.035em" }} className="ell">{c.name}</h1><span className="sample">Sample</span></div>
              <p className="dim" style={{ marginTop: 4 }}>{c.tagline}</p>
              <p className="mono dim" style={{ marginTop: 8 }}>{c.sector} · {c.stage} · {c.city}</p>
            </div>
          </div>
          <div className="row" style={{ marginTop: 18, gap: 8, flexWrap: "wrap" }}>
            <button className={`btn${following ? " ghost" : ""}`} aria-pressed={following}
              onClick={() => { setState((x) => ({ ...x, follows: toggle(x.follows, c.id) })); t.show(following ? `Unfollowed ${c.name}` : `Following ${c.name}`); }}>
              {following ? "Following" : "Follow"}</button>
            <button className="btn ghost" aria-pressed={watching}
              onClick={() => { setState((x) => { const w = { ...x.watch }; if (watching) delete w[c.id]; else w[c.id] = { raise: true, closing: true, update: true }; return { ...x, watch: w }; }); t.show(watching ? "Removed from watchlist" : "Added to watchlist"); }}>
              <IWatch size={18} />{watching ? "Watching" : "Watch"}</button>
          </div>
          <div className="sec"><h2>Founder updates</h2><span className="mono dim">{ups.length}</span></div>
          <div className="st" style={{ display: "grid", gap: 12 }}>
            {ups.map((u) => <UpdateCard key={u.id} id={u.id} />)}
            {!ups.length && <div className="card dim">No updates yet. Follow to hear first.</div>}
          </div>
        </div>
        <aside className="card" style={{ marginTop: 22 }}>
          <div className="row"><Mark c={c} sm /><b className="grow">{c.founder}</b></div>
          {c.raising ? (<>
            <div className="mono" style={{ marginTop: 16 }}>{c.progress}% of sample goal</div>
            <div className="bar" style={{ marginTop: 8 }}><b style={{ width: `${c.progress}%` }} /></div>
          </>) : <p className="mono dim" style={{ marginTop: 16 }}>Not raising</p>}
          <button className="btn" style={{ width: "100%", marginTop: 16 }} disabled>Investing opens soon</button>
          <p className="note" style={{ marginTop: 10 }}>Sample company. Portal registration pending; no investments are offered.</p>
        </aside>
      </div>
      <Toast msg={t.msg} />
    </div>
  );
}
