import { Link } from "react-router-dom";
import { Head, path } from "../FeaturesApp";
import { byId, COMPANIES } from "../data";
import { IClock, IX } from "../icons";
import { setState, useStore } from "../store";
import { Mark, Switch } from "../parts";

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
              <article className="card" key={id}>
                <div className="row">
                  <Link to={path(`company/${id}`)} className="row grow"><Mark c={c} />
                    <div className="grow"><div className="row" style={{ gap: 8 }}><b className="ell">{c.name}</b><span className="sample">Sample</span></div>
                      <div className="dim ell" style={{ fontSize: 13 }}>{c.tagline}</div></div></Link>
                  <button className="btn ghost sm" onClick={() => remove(id)} aria-label={`Remove ${c.name}`}><IX size={14} /></button>
                </div>
                {c.raising && (
                  <div style={{ marginTop: 14 }}>
                    <div className="row mono" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                      <span>{c.progress}% of sample goal</span>
                      {c.daysLeft !== null && <span className="row" style={{ gap: 5, fontWeight: c.daysLeft <= 7 ? 700 : 500 }}><IClock size={13} />{c.daysLeft <= 7 ? "Closing soon · " : ""}{c.daysLeft}d</span>}
                    </div>
                    <div className="bar"><b style={{ width: `${c.progress}%` }} /></div>
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  {ALERTS.map(({ k, label }) => (
                    <div className="set" key={k} style={{ padding: "9px 0" }}><span className="grow" style={{ fontSize: 13.5 }}>{label}</span>
                      <Switch label={`${label} alerts for ${c.name}`} on={w[k]} onChange={() => set(id, k)} /></div>
                  ))}
                </div>
              </article>
            );
          })}
          {!ids.length && <div className="card dim">Nothing watched. Add a company to get alerts.</div>}
        </div>
        <p className="note" style={{ marginTop: 16 }}>Progress figures are illustrative samples. Investing opens soon; no live raises yet.</p>
      </div>
      <aside>
        <div className="sec" style={{ marginTop: 22 }}><h2>Raising now</h2></div>
        {suggest.map((c) => (
          <div key={c.id} className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <Mark c={c} sm /><div className="grow"><b className="ell" style={{ display: "block" }}>{c.name}</b><span className="dim" style={{ fontSize: 12.5 }}>{c.sector} · {c.city}</span></div>
            <button className="btn sm" onClick={() => add(c.id)}>Watch</button>
          </div>
        ))}
      </aside>
    </div>
  );
}
