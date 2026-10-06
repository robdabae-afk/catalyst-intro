import { Link } from "react-router-dom";
import { byId, Company, UPDATES } from "./data";
import { IArrow } from "./icons";
import { path } from "./FeaturesApp";

export const Mark = ({ c, sm }: { c: Company; sm?: boolean }) => <span className={`mark${sm ? " sm" : ""}`} aria-hidden>{c.name[0]}</span>;

export function CompanyRow({ c, right }: { c: Company; right?: React.ReactNode }) {
  return (
    <div className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <Link to={path(`company/${c.id}`)} className="row grow">
        <Mark c={c} />
        <div className="grow">
          <div className="row" style={{ gap: 8 }}><b className="ell">{c.name}</b><span className="sample">Sample</span></div>
          <div className="dim ell" style={{ fontSize: 13 }}>{c.sector} · {c.stage} · {c.city}</div>
        </div>
      </Link>
      {right}
    </div>
  );
}

export function UpdateCard({ id }: { id: string }) {
  const u = UPDATES.find((x) => x.id === id)!;
  const c = byId(u.company)!;
  return (
    <article className="card">
      <div className="row" style={{ marginBottom: 10 }}>
        <Mark c={c} sm />
        <div className="grow"><b style={{ fontSize: 14 }}>{c.name}</b><div className="mono dim">{u.tag} · {u.ago} ago</div></div>
        <span className="sample">Sample</span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em" }}>{u.title}</h3>
      <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>{u.body}</p>
      <Link to={path(`company/${c.id}`)} className="row mono" style={{ marginTop: 12, gap: 6 }}>View company <IArrow size={14} /></Link>
    </article>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button className="sw" role="switch" aria-checked={on} aria-label={label} onClick={onChange} />;
}
