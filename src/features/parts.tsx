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
    <article className="card hov upd">
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row" style={{ gap: 8, marginBottom: 6 }}><Duo c={c} size={22} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</span><span className="dim" style={{ fontSize: 12 }}>{u.tag} · {u.ago}</span></div>
        <h3 style={{ fontSize: 14.5, fontWeight: 650, letterSpacing: "-.01em", lineHeight: 1.3 }}>{u.title}</h3>
        <p className="dim" style={{ fontSize: 13, lineHeight: 1.45, marginTop: 3 }}>{u.body}</p>
        <Link to={path(`company/${c.id}`)} className="row" style={{ marginTop: 8, gap: 4, fontSize: 12, fontWeight: 600 }}>View company <IArrow size={12} /></Link>
      </div>
      <div className="ph upd-th"><img src={c.img} alt="" loading="lazy" /></div>
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
