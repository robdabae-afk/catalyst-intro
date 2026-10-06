import { useEffect, useRef, useState } from "react";
import { Icon } from "@/brand/icons";
import { regCfLimit, usd } from "@/try/data";
import { EVENTS, MATCH } from "./data";
import { COMPANIES, SECTIONS, companyQuestions, type SectionId } from "./company";
import { useCountUp, useInView, useReducedMotion } from "./hooks";
import { Avatar, PEOPLE, type ProfRef } from "./profiles";

/* Full company detail. One focal point per section, more behind taps. All content SAMPLE. */

function Sec({ id, k, title, children }: { id: SectionId; k: number; title: string; children: React.ReactNode }) {
  return (
    <section id={`cd-${id}`} data-sec={id} className="cd-sec" aria-labelledby={`cd-h-${id}`}>
      <span className="lv-mono cd-k">{String(k).padStart(2, "0")}</span>
      <h2 id={`cd-h-${id}`}>{title}</h2>
      {children}
    </section>
  );
}
function More({ label = "More", children }: { label?: string; children: React.ReactNode }) {
  const [o, setO] = useState(false);
  return (<>
    <button type="button" className="cd-more" aria-expanded={o} onClick={() => setO(!o)}>{o ? "Less" : label}<Icon name="forward" size={12} /></button>
    <div className={`cd-x${o ? " open" : ""}`} aria-hidden={!o}><div>{children}</div></div>
  </>);
}
function Chart({ s }: { s: number[] }) {
  const [ref, seen] = useInView<HTMLDivElement>(); const max = Math.max(...s);
  return <div ref={ref} className={`cd-bars${seen ? " in" : ""}`} aria-hidden>{s.map((v, i) => <i key={i} style={{ height: `${(v / max) * 100}%`, transitionDelay: `${i * 35}ms` }} />)}</div>;
}
function Big({ n }: { n: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(); const r = useReducedMotion();
  return <div ref={ref} className="cd-big">{Math.round(useCountUp(n, seen, r)).toLocaleString("en-US")}</div>;
}

export function CompanyDetail({ id, start, onClose, onProfile, onPitch }: { id: string; start?: SectionId; onClose: () => void; onProfile: (r: ProfRef) => void; onPitch?: (id: string) => void }) {
  const c = COMPANIES[id]; const m = MATCH[id];
  const team = PEOPLE.filter((p) => p.at === id); const founder = PEOPLE.find((p) => p.id === m.founder)!;
  const mut = m.mutuals.map((x) => PEOPLE.find((p) => p.id === x)!).filter(Boolean);
  const qs = companyQuestions(c, founder.name);
  const scroller = useRef<HTMLDivElement>(null); const nav = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState<SectionId>(start ?? "overview");
  const [inc, setInc] = useState(60000); const [nw, setNw] = useState(40000);
  const [saved, setSaved] = useState(false); const [ask, setAsk] = useState(""); const [mine, setMine] = useState<string[]>([]);
  const reduced = useReducedMotion();
  const last = c.metric.series[c.metric.series.length - 1];

  const lock = useRef(0);
  const go = (s: SectionId, smooth = true) => {
    const el = scroller.current?.querySelector<HTMLElement>(`#cd-${s}`); const sc = scroller.current;
    if (el && sc) sc.scrollTo({ top: s === "overview" ? 0 : el.offsetTop - 52, behavior: smooth && !reduced ? "smooth" : "auto" });
    setCur(s); lock.current = Date.now() + 900;
  };
  useEffect(() => { if (start) requestAnimationFrame(() => go(start, false)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    const sc = scroller.current; if (!sc) return;
    const f = () => { if (Date.now() < lock.current) return; let best: SectionId = "overview"; sc.querySelectorAll<HTMLElement>("[data-sec]").forEach((e) => { if (e.offsetTop - 70 <= sc.scrollTop) best = e.dataset.sec as SectionId; }); if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) best = "limit"; setCur(best); };
    sc.addEventListener("scroll", f, { passive: true }); return () => sc.removeEventListener("scroll", f);
  }, []);
  useEffect(() => { nav.current?.querySelector<HTMLElement>(`[data-n="${cur}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" }); }, [cur, reduced]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);

  return (
    <div className="cd" role="dialog" aria-modal aria-label={`${c.name}, sample company`}>
      <div className="cd-scroll" ref={scroller}>
        <header className="cd-hero">
          <img src={c.coverUrl} alt="" />
          <div className="cd-hero-top">
            <button type="button" className="cd-ic" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
            <span className="cd-sample lv-mono">SAMPLE COMPANY</span>
          </div>
          <div className="cd-hero-b">
            <span className="lv-mono">{c.sector.toUpperCase()} · {c.city.split(",")[0].toUpperCase()} · {c.stage.toUpperCase()}</span>
            <h1>{c.name}</h1>
            <p>{c.line}</p>
            {onPitch && m.pitch && <button type="button" className="cd-play" onClick={() => onPitch(id)}><Icon name="pitch" size={16} />Watch pitch · {m.pitchLen}</button>}
          </div>
        </header>

        <nav className="cd-nav" ref={nav} aria-label="Sections">
          {SECTIONS.map(([s, l]) => <button key={s} type="button" data-n={s} className={cur === s ? "on" : ""} aria-current={cur === s} onClick={() => go(s)}>{l}</button>)}
        </nav>

        <Sec id="overview" k={1} title="The problem">
          <p className="cd-lead">{c.problem}</p>
          <More label="Their solution"><p className="cd-p">{c.solution}</p><p className="cd-p dim">{c.about}</p></More>
        </Sec>

        <Sec id="product" k={2} title="Product">
          <div className="cd-media">{c.media.map((x) => (
            <figure key={x.src}>{x.kind === "video" ? <video src={x.src} muted loop playsInline autoPlay={!reduced} poster={c.coverUrl} /> : <img src={x.src} alt={x.caption} />}<figcaption className="lv-mono">{x.caption}</figcaption></figure>
          ))}</div>
        </Sec>

        <Sec id="traction" k={3} title="Traction">
          <Big n={last} /><p className="cd-sub">{c.metric.unit} · {c.metric.label.toLowerCase()} · last 12 mo</p>
          <Chart s={c.metric.series} />
          <More label="Milestones"><ul className="cd-list">{[...c.traction, ...c.milestones].map((t) => <li key={t}>{t}</li>)}</ul></More>
          <p className="cd-fine lv-mono">SAMPLE · ILLUSTRATIVE METRICS</p>
        </Sec>

        <Sec id="team" k={4} title="Team">
          <div className="cd-team">{team.map((p) => (
            <button key={p.id} type="button" className="cd-person" onClick={() => onProfile({ kind: "person", id: p.id })}>
              <Avatar p={p} size={52} /><span><b>{p.name}</b><small>{p.bio.replace(/^Sample \w+\. /, "")}</small></span><Icon name="forward" size={14} />
            </button>))}
          </div>
          {mut.length > 0 && (<div id="cd-mutuals" className="cd-mut">
            <span className="lv-mono dim">{mut.length} MUTUAL{mut.length > 1 ? "S" : ""} · SAMPLE</span>
            <div>{mut.map((p) => <button key={p.id} type="button" onClick={() => onProfile({ kind: "person", id: p.id })} aria-label={p.name}><Avatar p={p} size={36} /><small>{p.name}</small></button>)}</div>
          </div>)}
        </Sec>

        <Sec id="market" k={5} title="Market">
          <p className="cd-lead">{c.market.headline}</p>
          <More label="Size and timing">
            <dl className="cd-dl"><div><dt className="lv-mono">TAM</dt><dd>{c.market.tam}</dd></div><div><dt className="lv-mono">SAM</dt><dd>{c.market.sam}</dd></div></dl>
            <p className="cd-p">{c.market.why}</p>
          </More>
        </Sec>

        <Sec id="model" k={6} title="Business model">
          <div className="cd-price">{c.model.price}</div><p className="cd-sub">{c.model.headline}</p>
          <More label="How they make money"><ul className="cd-list">{c.model.points.map((t) => <li key={t}>{t}</li>)}</ul></More>
        </Sec>

        <Sec id="raise" k={7} title="The raise">
          <div className="cd-soon"><b>Investing opens soon.</b><span>Save {c.name} and we'll tell you when it does.</span></div>
          <dl className="cd-dl three"><div><dt className="lv-mono">INSTRUMENT</dt><dd>{c.instrument}</dd></div><div><dt className="lv-mono">CAP</dt><dd>{c.valuationCap}</dd></div><div><dt className="lv-mono">MIN</dt><dd>{usd(c.minCheck)}</dd></div></dl>
          <More label="Use of funds"><ul className="cd-list">{c.useOfFunds.map((t) => <li key={t}>{t}</li>)}</ul><p className="cd-p dim">Target {usd(c.goal)}. A SAFE turns into shares only if the company raises a priced round or sells.</p></More>
          <p className="cd-fine lv-mono">SAMPLE TERMS · NOT AN OFFER</p>
        </Sec>

        <Sec id="docs" k={8} title="Documents">
          <ul className="cd-docs">{c.docs.map((d) => <li key={d.kind}><Icon name="draft" size={18} /><span>{d.name}</span><em className="lv-mono">{d.ready ? "SAMPLE" : "AT LAUNCH"}</em></li>)}</ul>
        </Sec>

        <Sec id="updates" k={9} title="Updates">
          <article className="cd-upd"><span className="lv-mono dim">{c.updates[0].when} AGO</span><b>{c.updates[0].title}</b><p>{c.updates[0].body}</p></article>
          {c.updates.length > 1 && <More label={`${c.updates.length - 1} older`}>{c.updates.slice(1).map((u) => <article key={u.title} className="cd-upd"><span className="lv-mono dim">{u.when} AGO</span><b>{u.title}</b><p>{u.body}</p></article>)}</More>}
        </Sec>

        <Sec id="qa" k={10} title="Q&A">
          {[...mine.map((b, i) => ({ id: `me${i}`, body: b, memberName: "You", when: "now", votes: 0, answer: null as string | null, answeredBy: undefined as string | undefined })), ...qs].slice(0, 99).map((q, i) => (
            <div key={q.id} className={`cd-q${i > 0 && !mine.length ? "" : ""}`}>
              <p><b>{q.body}</b></p><span className="lv-mono dim">{q.memberName} · {q.when}{q.votes ? ` · ▲ ${q.votes}` : ""}</span>
              {q.answer ? <More label="Founder's answer"><p className="cd-ans"><small className="lv-mono">{q.answeredBy}</small>{q.answer}</p></More> : <span className="lv-mono cd-wait">WAITING ON FOUNDER</span>}
            </div>))}
          <form className="cd-ask" onSubmit={(e) => { e.preventDefault(); if (ask.trim()) { setMine([ask.trim(), ...mine]); setAsk(""); } }}>
            <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={`Ask ${founder.name} something`} aria-label="Your question" />
            <button type="submit" aria-label="Send"><Icon name="send" size={16} /></button>
          </form>
        </Sec>

        <Sec id="risks" k={11} title="Risks">
          <p className="cd-lead">{c.risks[c.risks.length - 1]}</p>
          <More label={`${c.risks.length - 1} company risks`}><ul className="cd-list">{c.risks.slice(0, -1).map((t) => <li key={t}>{t}</li>)}</ul></More>
        </Sec>

        <Sec id="events" k={12} title="Meet them">
          {EVENTS.filter((e) => c.eventIds.includes(e.id)).map((e) => (
            <div key={e.id} className="cd-ev"><img src={e.img} alt="" /><div><span className="lv-mono dim">{e.when} · {e.where}</span><b>{e.title}</b><small>{founder.name} will be there · sample</small></div></div>))}
        </Sec>

        <Sec id="limit" k={13} title="Your yearly limit">
          <div className="cd-big">{usd(regCfLimit(inc, nw))}</div>
          <p className="cd-sub">max across all crowdfunding deals in 12 months</p>
          <More label="Change my numbers">
            <label className="cd-rng"><span className="lv-mono">INCOME {usd(inc)}</span><input type="range" min={0} max={300000} step={5000} value={inc} onChange={(e) => setInc(+e.target.value)} /></label>
            <label className="cd-rng"><span className="lv-mono">NET WORTH {usd(nw)}</span><input type="range" min={0} max={500000} step={5000} value={nw} onChange={(e) => setNw(+e.target.value)} /></label>
            <p className="cd-p dim">Reg CF rule: if income or net worth is under $124K, the greater of $2,500 or 5% of the higher number. If both are above, 10%, capped at $124K. Estimate only; not saved.</p>
          </More>
        </Sec>
        <p className="cd-foot lv-mono">{c.name} is a fictional sample company for this preview. Nothing here is an offer to sell securities.</p>
      </div>

      <footer className="cd-bar">
        <button type="button" className={`cd-save${saved ? " on" : ""}`} onClick={() => setSaved(!saved)}><Icon name="saved" size={18} />{saved ? "Saved · we'll notify you" : "Save for launch"}</button>
      </footer>
    </div>
  );
}
