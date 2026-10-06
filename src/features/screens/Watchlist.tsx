import { Link } from "react-router-dom";
import { Head, path } from "../FeaturesApp";
import { byId, COMPANIES } from "../data";
import { IClock, IX } from "../icons";
import { setState, useStore } from "../store";
import { Switch } from "../parts";
import { Duo, Icon, Meter, CountUp } from "../hud";

type Key = "raise" | "closing" | "update";
const ALERTS: { k: Key; label: string }[] = [
  { k: "raise", label: "Raise progress" }, { k: "closing", label: "Closing soon" }, { k: "update", label: "New update" },
];

export default function Watchlist() {
  const [s] = useStore();
  const ids = Object.keys(s.watch);
  const suggest = COMPANIES.filter((c) => !s.watch[c.id] && c.raising).slice(0, 3);
  const set = (id: string, k: Key) => setState((x) => ({ ...x, watch: { ...x.watch, [id]: { ...x.watch[id], [k]: !x.watch[id][k] } } }));
  const remove = (id: string) => setState((x) => { const w = { ...x.watch }; delete w[id]; return { ...x, watch: w }; });
  const add = (id: string) => setState((x) => ({ ...x, watch: { ...x.watch, [id]: { raise: true, closing: true, update: true } } }));

  return (
    <div className="g-side">
      <div>
        <Head title="Watchlist" right={<span className="mono dim">{ids.length} watching</span>} />
        <div className="st" style={{ display: "grid", gap: 12 }}>
          {ids.map((id) => {
            const c = byId(id)!; const w = s.watch[id];
            return (
              <article className="card hov" key={id} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: 14 }}>
                <div className="row">
                  <Link to={path(`company/${id}`)} className="row grow"><Duo c={c} size={32} />
                    <div className="grow"><div className="row" style={{ gap: 8 }}><b>{c.name}</b></div>
                      <div className="dim" style={{ fontSize: 13, lineHeight: 1.35 }}>{c.tagline}</div></div></Link>
                  <button className="btn ghost sm" onClick={() => remove(id)} aria-label={`Remove ${c.name}`}><IX size={14} /></button>
                </div>
                {c.raising && (
                  <div style={{ marginTop: 12 }}>
                    <div className="row mono" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                      <span><CountUp to={c.progress} suffix="%" /> of sample goal</span>
                      {c.daysLeft !== null && <span className="row" style={{ gap: 5, fontWeight: c.daysLeft <= 7 ? 700 : 500 }}><IClock size={13} />{c.daysLeft <= 7 ? "Closing soon · " : ""}{c.daysLeft}d</span>}
                    </div>
                    <Meter pct={c.progress} />
                  </div>
                )}
                <div className="row" style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}><span className="dim" style={{ fontSize: 12, marginRight: 2 }}>Alerts</span>
                  {ALERTS.map(({ k, label }) => (
                    <button key={k} className={`chip al${w[k] ? " on" : ""}`} aria-pressed={w[k]} aria-label={`${label} alerts for ${c.name}`} onClick={() => set(id, k)}>{label}</button>
                  ))}
                </div>
                </div>
              </article>
            );
          })}
          {!ids.length && <div className="card dim">Nothing watched. Add a company to get alerts.</div>}
        </div>
        <p className="note" style={{ marginTop: 16 }}>Progress figures are illustrative samples. Investing opens soon; no live raises yet.</p>
      </div>
      <aside>
        <div className="sec" style={{ marginTop: 22 }}><h2><span className="ix">+</span>Raising now</h2></div>
        {suggest.map((c) => (
          <div key={c.id} className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <Duo c={c} size={36} /><div className="grow"><b style={{ display: "block" }}>{c.name}</b><span className="dim" style={{ fontSize: 12.5 }}>{c.sector} · {c.city}</span></div>
            <button className="btn sm" onClick={() => add(c.id)}><Icon name="save" size={14} />Watch</button>
          </div>
        ))}
      </aside>
    </div>
  );
}
