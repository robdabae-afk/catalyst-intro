import { useEffect, useRef, useState } from "react";
import { setState, useStore, watchAdd } from "@/features/store";
import { requireAccount } from "@/features/sync";
import { useCatalog, PEOPLE } from "@/features/catalog";
import { listQuestions, askQuestion, answerQuestion, reserveInterest, ago, useUid, type QRow } from "./db";
import { Icon } from "@/brand/icons";
import { regCfLimit } from "./db";
import { usd } from "./data";
const usdf = (n: number) => "$" + Math.round(n || 0).toLocaleString("en-US");
import { EVENTS, MATCH } from "./data";
import { COMPANIES, SECTIONS, type SectionId } from "./company";
import { useCountUp, useInView, useReducedMotion } from "./hooks";
import { Avatar, type ProfRef } from "./profiles";

/* Full company detail. One focal point per section, more behind taps. Data from the live catalog. */

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
  useCatalog();
  const c = COMPANIES[id]; const m = MATCH[id];
  const team = PEOPLE.filter((p) => p.at === id); const founder = PEOPLE.find((p) => p.id === m?.founder);
  const teamNames = new Set(team.map((p) => p.name.trim().toLowerCase()));
  const extraTeam = (c?.teamMembers ?? []).filter((t) => { const k = t.name?.trim().toLowerCase(); if (!k || teamNames.has(k)) return false; teamNames.add(k); return true; });
  const uid = useUid();
  const [qs, setQs] = useState<QRow[]>([]); const [qErr, setQErr] = useState("");
  const loadQs = () => void listQuestions(id).then((r) => { setQs(r.data ?? []); setQErr(r.ok ? "" : r.missing ? "Q&A opens soon." : r.error ?? ""); });
  useEffect(loadQs, [id]);
  const isOwner = !!uid && c?.ownerId === uid;
  const [amt, setAmt] = useState(""); const [ack, setAck] = useState(false); const [resMsg, setResMsg] = useState("");
  const scroller = useRef<HTMLDivElement>(null); const nav = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState<SectionId>(start ?? "overview");
  const [st] = useStore();
  // Draft values; saved to the account's invest profile only when the member reserves.
  const [draft, setDraft] = useState<{ inc: number; nw: number } | null>(null);
  const inc = draft?.inc ?? st.invest?.inc ?? 60000, nw = draft?.nw ?? st.invest?.nw ?? 40000;
  const setInc = (v: number) => setDraft({ inc: v, nw });
  const setNw = (v: number) => setDraft({ inc, nw: v });
  const [numMsg, setNumMsg] = useState<string | null>(null);
  const [numBusy, setNumBusy] = useState(false);
  const dirty = !!draft && (draft.inc !== st.invest?.inc || draft.nw !== st.invest?.nw);
  const saveNums = async () => {
    if (!draft || numBusy) return;
    if (!requireAccount()) return;
    const v = { inc: draft.inc, nw: draft.nw };
    setNumBusy(true); setNumMsg(null);
    let ok = false;
    try { ok = await setState((s) => ({ ...s, invest: v })); } catch { ok = false; }
    setNumBusy(false);
    if (ok) { setDraft(null); setNumMsg("Saved to your profile."); }
    else setNumMsg("Couldn't save your numbers. Try again.");
  };
  const saved = id in (st.watch ?? {});
  const setSaved = (v: boolean) => { if (!requireAccount()) return; if (v) watchAdd(id); else setState((s) => { const w = { ...s.watch }; delete w[id]; return { ...s, watch: w, launch: s.launch.filter((x) => x !== id) }; }); };
  const [ask, setAsk] = useState(""); const [ans, setAns] = useState<Record<string, string>>({});
  const reduced = useReducedMotion();
  const series = c?.metric?.series ?? []; const last = series[series.length - 1] ?? 0;

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

  if (!c) return <div className="cd" role="dialog" aria-modal aria-label="Company"><div className="cd-scroll"><header className="cd-hero-top"><button type="button" className="cd-ic" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button></header><p className="cd-lead" style={{ padding: 24 }}>This company isn't available.</p></div></div>;
  const reserve = async () => {
    if (!requireAccount()) return; const n = Math.round(Number(amt));
    const lim = regCfLimit(inc, nw);
    if (!(n > 0)) return setResMsg("Enter an amount."); if (c.minCheck && n < c.minCheck) return setResMsg(`Minimum is ${usdf(c.minCheck)}.`);
    if (n > lim) return setResMsg(`That's over your Reg CF limit of ${usdf(lim)}.`); if (!ack) return setResMsg("Please confirm you understand the risks.");
    if (!st.invest || st.invest.inc !== inc || st.invest.nw !== nw) {
      const saved = await setState((s) => ({ ...s, invest: { inc, nw } }));
      if (!saved) return setResMsg("Couldn't save your income and net worth. Try again.");
    }
    const r = await reserveInterest(id, n); setResMsg(r.ok ? "Interest reserved. No money has moved." : r.missing ? "Reservations open soon." : r.error ?? "Couldn't reserve.");
  };
  return (
    <div className="cd" role="dialog" aria-modal aria-label={c.name}>
      <div className="cd-scroll" ref={scroller}>
        <header className="cd-hero">
          {c.coverUrl ? <img src={c.coverUrl} alt="" /> : <div className="lv-noimg" />}
          <div className="cd-hero-top">
            <button type="button" className="cd-ic" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button>
          </div>
          <div className="cd-hero-b">
            <span className="lv-mono">{[c.sector, (c.city ?? "").split(",")[0], c.stage].filter(Boolean).join(" · ").toUpperCase()}</span>
            <h1>{c.name}</h1>
            <p>{c.line}</p>
            {onPitch && m?.pitch && <button type="button" className="cd-play" onClick={() => onPitch(id)}><Icon name="pitch" size={16} />Watch pitch · {m.pitchLen}</button>}
          </div>
        </header>

        <nav className="cd-nav" ref={nav} aria-label="Sections">
          {SECTIONS.map(([s, l]) => <button key={s} type="button" data-n={s} className={cur === s ? "on" : ""} aria-current={cur === s} onClick={() => go(s)}>{l}</button>)}
        </nav>

        <Sec id="overview" k={1} title="The problem">
          <p className={c.problem?.trim() ? "cd-lead" : "cd-p dim"}>{c.problem?.trim() || "The founder hasn't shared the problem yet."}</p>
          <More label="Their solution"><p className={c.solution?.trim() ? "cd-p" : "cd-p dim"}>{c.solution?.trim() || "The founder hasn't shared their solution yet."}</p><p className="cd-p dim">{c.about}</p></More>
        </Sec>

        <Sec id="product" k={2} title="Product">
          <div className="cd-media">{(c.media ?? []).map((x) => (
            <figure key={x.src}>{x.kind === "video" ? <video src={x.src} muted loop playsInline autoPlay={!reduced} poster={c.coverUrl} /> : <img src={x.src} alt={x.caption} />}<figcaption className="lv-mono">{x.caption}</figcaption></figure>
          ))}</div>
        </Sec>

        <Sec id="traction" k={3} title="Traction">
          {series.length > 1 && <><Big n={last} /><p className="cd-sub">{c.metric.unit} · {c.metric.label.toLowerCase()}</p><Chart s={series} /></>}
          <More label="Milestones"><ul className="cd-list">{[...(c.traction ?? []), ...(c.milestones ?? [])].map((t) => <li key={t}>{t}</li>)}</ul></More>
        </Sec>

        <Sec id="team" k={4} title="Team">
          <div className="cd-team">{team.map((p) => (
            <button key={p.id} type="button" className="cd-person" onClick={() => onProfile({ kind: "person", id: p.id })}>
              <Avatar p={p} size={52} /><span><b>{p.name}</b><small>{p.bio}</small></span><Icon name="forward" size={14} />
            </button>))}
            {extraTeam.map((t, i) => (
              <div key={"tm" + i + t.name} className="cd-person"><span><b>{t.name}</b>{t.title ? <small>{t.title}</small> : null}</span></div>))}
          </div>
        </Sec>

        <Sec id="market" k={5} title="Market">
          <p className="cd-lead">{c.market?.headline || "Details coming soon."}</p>
          <More label="Size and timing">
            <dl className="cd-dl"><div><dt className="lv-mono">TAM</dt><dd>{c.market?.tam || "TBA"}</dd></div><div><dt className="lv-mono">SAM</dt><dd>{c.market?.sam || "TBA"}</dd></div></dl>
            <p className="cd-p">{c.market?.why}</p>
          </More>
        </Sec>

        <Sec id="model" k={6} title="Business model">
          <div className="cd-price">{c.model?.price || "TBA"}</div><p className="cd-sub">{c.model?.headline}</p>
          <More label="How they make money"><ul className="cd-list">{(c.model?.points ?? []).map((t) => <li key={t}>{t}</li>)}</ul></More>
        </Sec>

        <Sec id="raise" k={7} title="The raise">
          <div className="cd-soon"><b>Reserve interest.</b><span>Non-binding. No money moves. Catalyst's funding-portal registration is pending; investing opens only through a registered portal.</span></div>
          <form className="cd-ask" onSubmit={(e) => { e.preventDefault(); void reserve(); }}>
            <input inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ""))} placeholder={`Amount (limit ${usdf(regCfLimit(inc, nw))})`} aria-label="Amount" />
            <button type="submit" aria-label="Reserve"><Icon name="check" size={16} /></button>
          </form>
          <label className="cd-p"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I understand startups are risky and I could lose everything.</label>
          {resMsg && <p className="cd-p" role="status">{resMsg}</p>}
          <dl className="cd-dl three"><div><dt className="lv-mono">INSTRUMENT</dt><dd>{c.instrument || "TBA"}</dd></div><div><dt className="lv-mono">CAP</dt><dd>{c.valuationCap || "TBA"}</dd></div><div><dt className="lv-mono">MIN</dt><dd>{c.minCheck ? usdf(c.minCheck) : "TBA"}</dd></div></dl>
          <More label="Use of funds"><ul className="cd-list">{(c.useOfFunds ?? []).map((t) => <li key={t}>{t}</li>)}</ul><p className="cd-p dim">{c.goal ? `Target ${usdf(c.goal)}. ` : ""}A SAFE turns into shares only if the company raises a priced round or sells.</p></More>
          <p className="cd-fine lv-mono">NOT AN OFFER TO SELL SECURITIES</p>
        </Sec>

        <Sec id="docs" k={8} title="Documents">
          {(c.docs ?? []).length ? <ul className="cd-docs">{c.docs.map((d) => <li key={d.kind + d.name}><Icon name="draft" size={18} />{d.ready && d.url && /^https?:\/\//i.test(d.url) ? <a href={d.url} target="_blank" rel="noopener noreferrer">{d.name}</a> : <span>{d.name}</span>}<em className="lv-mono">{d.ready ? "READY" : "AT LAUNCH"}</em></li>)}</ul> : <p className="cd-p dim">Documents will be posted before investing opens.</p>}
        </Sec>

        <Sec id="updates" k={9} title="Updates">
          {!(c.updates ?? []).length ? <p className="cd-p dim">No updates yet.</p> : <>
          <article className="cd-upd"><span className="lv-mono dim">{c.updates[0].when}</span><b>{c.updates[0].title}</b><p>{c.updates[0].body}</p></article>
          {c.updates.length > 1 && <More label={`${c.updates.length - 1} older`}>{c.updates.slice(1).map((u) => <article key={u.title} className="cd-upd"><span className="lv-mono dim">{u.when}</span><b>{u.title}</b><p>{u.body}</p></article>)}</More>}</>}
        </Sec>

        <Sec id="qa" k={10} title="Q&A">
          {qErr && <p className="cd-p dim">{qErr}</p>}
          {!qErr && !qs.length && <p className="cd-p dim">No questions yet. Ask the first one.</p>}
          {qs.map((q) => (
            <div key={q.id} className="cd-q">
              <p><b>{q.body}</b></p><span className="lv-mono dim">{q.user_id === uid ? "You" : q.asker_name || "Member"} · {ago(q.created_at)}</span>
              {q.answer ? <p className="cd-ans"><small className="lv-mono">FOUNDER</small>{q.answer}</p> : isOwner ? (
                <form className="cd-ask" onSubmit={async (e) => { e.preventDefault(); const a = (ans[q.id] ?? "").trim(); if (!a || !requireAccount()) return; const r = await answerQuestion(q.id, a); if (r.ok) loadQs(); else setQErr(r.error ?? ""); }}>
                  <input value={ans[q.id] ?? ""} onChange={(e) => setAns({ ...ans, [q.id]: e.target.value })} placeholder="Answer as founder" aria-label="Answer" />
                  <button type="submit" aria-label="Post answer"><Icon name="send" size={16} /></button>
                </form>) : <span className="lv-mono cd-wait">WAITING ON FOUNDER</span>}
            </div>))}
          <form className="cd-ask" onSubmit={async (e) => { e.preventDefault(); const b = ask.trim(); if (!b || !requireAccount()) return; const r = await askQuestion(id, b); if (r.ok) { setAsk(""); loadQs(); } else setQErr(r.missing ? "Q&A opens soon." : r.error ?? "Couldn't post."); }}>
            <input value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={1000} placeholder={`Ask ${founder?.name ?? "the founder"} something`} aria-label="Your question" />
            <button type="submit" aria-label="Send"><Icon name="send" size={16} /></button>
          </form>
        </Sec>

        <Sec id="risks" k={11} title="Risks">
          <p className="cd-lead">Startup investing is risky. You could lose all of your money, and shares are hard to sell.</p>
          {(c.risks ?? []).length > 0 && <More label={`${c.risks.length} company risks`}><ul className="cd-list">{c.risks.map((t) => <li key={t}>{t}</li>)}</ul></More>}
        </Sec>

        <Sec id="events" k={12} title="Meet them">
          {EVENTS.filter((e) => (c.eventIds ?? []).includes(e.id)).map((e) => (
            <div key={e.id} className="cd-ev">{e.img ? <img src={e.img} alt="" /> : <div className="lv-noimg" />}<div><span className="lv-mono dim">{e.when} · {e.where}</span><b>{e.title}</b></div></div>))}
        </Sec>

        <Sec id="limit" k={13} title="Your yearly limit">
          <div className="cd-big">{usd(regCfLimit(inc, nw))}</div>
          <p className="cd-sub">max across all crowdfunding deals in 12 months</p>
          <More label="Change my numbers">
            <label className="cd-rng" htmlFor="cd-inc"><span className="lv-mono">INCOME {usd(inc)}</span><input id="cd-inc" type="range" min={0} max={300000} step={5000} value={inc} aria-label="Yearly income" aria-valuetext={usd(inc)} disabled={numBusy} onChange={(e) => { setNumMsg(null); setInc(+e.target.value); }} /></label>
            <label className="cd-rng" htmlFor="cd-nw"><span className="lv-mono">NET WORTH {usd(nw)}</span><input id="cd-nw" type="range" min={0} max={500000} step={5000} value={nw} aria-label="Net worth" aria-valuetext={usd(nw)} disabled={numBusy} onChange={(e) => { setNumMsg(null); setNw(+e.target.value); }} /></label>
            <p className="cd-p dim">Reg CF rule: if income or net worth is under $124K, the greater of $2,500 or 5% of the higher number. If both are above, 10%, capped at $124K.</p>
            {dirty && <button type="button" className="cd-save" onClick={saveNums} disabled={numBusy} aria-busy={numBusy || undefined}>{numBusy ? "Saving…" : "Save my numbers"}</button>}
            {numMsg && <p className="cd-p" role="status">{numMsg}</p>}
          </More>
        </Sec>
        <p className="cd-foot lv-mono">Nothing here is an offer to sell securities. Investing opens only through a registered funding portal.</p>
      </div>

      <footer className="cd-bar">
        <button type="button" className={`cd-save${saved ? " on" : ""}`} onClick={() => setSaved(!saved)}><Icon name="saved" size={18} />{saved ? "Saved" : "Save"}</button>
      </footer>
    </div>
  );
}
