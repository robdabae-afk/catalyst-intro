import { Link } from "react-router-dom";
import { byId, Company, UPDATES } from "./data";
import { IArrow } from "./icons";
import { path } from "./FeaturesApp";
import { Duo, Logo, Face, Meter, Icon } from "./hud";

export const Mark = ({ c, sm }: { c: Company; sm?: boolean }) => <Logo c={c} size={sm ? 34 : 40} />;

export function CompanyRow({ c, right }: { c: Company; right?: React.ReactNode }) {
  return (
    <div className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <Link to={path(`company/${c.id}`)} className="row grow">
        <Duo c={c} size={40} />
        <div className="grow">
          <div className="row" style={{ gap: 8 }}><b className="ell">{c.name}</b><span className="sample">Sample</span></div>
          <div className="dim" style={{ fontSize: 13 }}>{c.sector} · {c.stage} · {c.city}</div>
        </div>
      </Link>
      {right}
    </div>
  );
}

/** Search/discovery result: photo + logo + founder, full tagline (2-line clamp, never cut mid-word on one line). */
export function ResultCard({ c }: { c: Company }) {
  return (
    <Link to={path(`company/${c.id}`)} className="rc">
      <div className="ph"><img src={c.img} alt="" loading="lazy" /></div>
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 8 }}><Logo c={c} size={22} /><b style={{ fontSize: 15 }}>{c.name}</b></div>
        <p className="dim clamp2" style={{ fontSize: 13, lineHeight: 1.4, marginTop: 4 }}>{c.tagline}</p>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <span className="mono dim">{c.sector} · {c.stage} · {c.city}</span>
        </div>
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          {c.raising ? <><span className="row mono" style={{ gap: 6 }}><span className="blink" />Raising</span><span className="grow"><Meter pct={c.progress} /></span></> : <span className="mono dim">Not raising</span>}
          <span className="sample">Sample</span>
        </div>
      </div>
    </Link>
  );
}

export function UpdateCard({ id }: { id: string }) {
  const u = UPDATES.find((x) => x.id === id)!;
  const c = byId(u.company)!;
  return (
    <article className="card hud hov" style={{ padding: 0, overflow: "hidden" }}>
      <div className="ph" style={{ height: 150, borderRadius: 0 }}>
        <img src={c.img} alt="" loading="lazy" />
        <div className="ph-body" style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
          <div className="row" style={{ gap: 8 }}><span className="chip-d">{u.tag}</span><span className="sample inv" style={{ marginLeft: "auto" }}>Sample</span></div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div className="row" style={{ marginBottom: 10, gap: 10 }}>
          <Duo c={c} size={34} />
          <div className="grow"><b style={{ fontSize: 14 }}>{c.name}</b><div className="mono dim">{c.founder} · {u.ago} ago</div></div>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em" }}>{u.title}</h3>
        <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>{u.body}</p>
        <Link to={path(`company/${c.id}`)} className="row mono" style={{ marginTop: 12, gap: 6 }}>View company <IArrow size={14} /></Link>
      </div>
    </article>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return msg ? <div className="toast row" role="status" style={{ gap: 8 }}><Icon name="check" size={15} />{msg}</div> : null;
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button className="sw" role="switch" aria-checked={on} aria-label={label} onClick={onChange} />;
}

export { Face };
