import { useMemo, useState } from "react";
import { Head } from "../FeaturesApp";
import { COMPANIES, Sector, Stage } from "../data";
import { ISearch, IX, IClock } from "../icons";
import { setState, toggle, useStore } from "../store";
import { CompanyRow } from "../parts";

const SECTORS: Sector[] = ["Fintech", "Climate", "Food", "Health", "Consumer", "AI"];
const STAGES: Stage[] = ["Pre-seed", "Seed", "Series A"];
const CITIES = [...new Set(COMPANIES.map((c) => c.city))];

export default function Search() {
  const [s] = useStore();
  const [q, setQ] = useState("");
  const [sec, setSec] = useState<Sector[]>([]);
  const [st, setSt] = useState<Stage[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [raising, setRaising] = useState(false);
  const active = q || sec.length || st.length || city.length || raising;

  const res = useMemo(() => COMPANIES.filter((c) => {
    const t = q.trim().toLowerCase();
    const words = t ? t.split(/\s+/) : [];
    const hay = `${c.name} ${c.tagline} ${c.sector} ${c.city} ${c.stage}`.toLowerCase();
    return words.every((w) => hay.includes(w)) && (!sec.length || sec.includes(c.sector)) && (!st.length || st.includes(c.stage)) && (!city.length || city.includes(c.city)) && (!raising || c.raising);
  }), [q, sec, st, city, raising]);

  const commit = () => { const t = q.trim(); if (t) setState((x) => ({ ...x, recent: [t, ...x.recent.filter((r) => r !== t)].slice(0, 6) })); };
  const clear = () => { setQ(""); setSec([]); setSt([]); setCity([]); setRaising(false); };

  return (
    <div>
      <Head title="Search" />
      <form className="sbox" role="search" onSubmit={(e) => { e.preventDefault(); commit(); }}>
        <ISearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Companies, sectors, cities" aria-label="Search" enterKeyHint="search" />
        {q && <button type="button" className="btn ghost sm" onClick={() => setQ("")} aria-label="Clear"><IX size={14} /></button>}
      </form>

      <div className="fl"><span className="mono dim">Sector</span><div className="chips">{SECTORS.map((x) => <button key={x} className={`chip${sec.includes(x) ? " on" : ""}`} aria-pressed={sec.includes(x)} onClick={() => setSec(toggle(sec, x))}>{x}</button>)}</div></div>
      <div className="fl"><span className="mono dim">Stage</span><div className="chips">{STAGES.map((x) => <button key={x} className={`chip${st.includes(x) ? " on" : ""}`} aria-pressed={st.includes(x)} onClick={() => setSt(toggle(st, x))}>{x}</button>)}</div></div>
      <div className="fl"><span className="mono dim">City</span><div className="chips">
        <button className={`chip${raising ? " on" : ""}`} aria-pressed={raising} onClick={() => setRaising(!raising)}>Raising now</button>
        {CITIES.map((x) => <button key={x} className={`chip${city.includes(x) ? " on" : ""}`} aria-pressed={city.includes(x)} onClick={() => setCity(toggle(city, x))}>{x}</button>)}</div></div>

      {!active && s.recent.length > 0 && (<>
        <div className="sec"><h2>Recent</h2><button className="mono dim" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => setState((x) => ({ ...x, recent: [] }))}>Clear</button></div>
        {s.recent.map((r) => (
          <div key={r} className="row" style={{ padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
            <IClock /><button className="grow ell" style={{ background: "none", border: 0, textAlign: "left", fontSize: 15, cursor: "pointer", padding: 0 }} onClick={() => setQ(r)}>{r}</button>
            <button className="btn ghost sm" aria-label={`Remove ${r}`} onClick={() => setState((x) => ({ ...x, recent: x.recent.filter((y) => y !== r) }))}><IX size={13} /></button>
          </div>
        ))}
      </>)}

      <div className="sec"><h2>{active ? `${res.length} result${res.length === 1 ? "" : "s"}` : "All companies"}</h2>{active ? <button className="mono dim" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={clear}>Reset</button> : null}</div>
      <div className="st">{res.map((c) => <CompanyRow key={c.id} c={c} right={c.raising ? <span className="mono">Raising</span> : <span className="mono dim">Not raising</span>} />)}</div>
      {!res.length && <p className="dim">No sample companies match. Try fewer filters.</p>}
    </div>
  );
}
