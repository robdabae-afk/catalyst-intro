import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { DEALS, Deal as D, money, regCfLimit, usd } from "./data";
import { toggle, useTry } from "./store";
import { Art, I, Ic, Logo, Progress, useNoindex } from "./ui";
import { sampleQA } from "./threads";
import { Button, ButtonLink } from "@/brand/Button";

const RISK = "Early-stage startups often fail. Only invest money you can afford to lose and won't need for years.";

function Terms({ d }: { d: D }) {
  return (
    <div className="terms">
      <div><span className="lbl">Minimum</span><b className="num">${d.min}</b></div>
      <div><span className="lbl">Valuation cap</span><b className="num">{d.cap}</b></div>
      <div><span className="lbl">Type</span><b>{d.type}</b></div>
      <div><span className="lbl">Raised</span><b className="num">{money(d.raised)}</b></div>
      <div><span className="lbl">Goal</span><b className="num">{money(d.goal)}</b></div>
      <div><span className="lbl">Days left</span><b className="num">{d.daysLeft}</b></div>
    </div>
  );
}

export function DealPage() {
  const d = DEALS.find((x) => x.id === useParams().id);
  const nav = useNavigate();
  const [s, set] = useTry();
  useNoindex(d?.name || "Deal");
  const [tab, setTab] = useState<"about" | "qa">(new URLSearchParams(window.location.search).get("tab") === "qa" ? "qa" : "about");
  if (!d) return <Navigate to="/app/discover" replace />;
  const saved = s.saved.includes(d.id);
  const qa = sampleQA(d.name, d.team[0].role);
  const mineQ = s.questions.filter((q) => q.deal === d.id);
  const save = () => set((x) => ({ ...x, saved: toggle(x.saved, d.id) }));
  const SaveBtn = ({ wide }: { wide?: boolean }) => (
    <button className={wide ? "btn ghost" : "ic"} style={wide ? {} : { width: 52, height: 52, ...(saved ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : {}) }}
      onClick={save} aria-pressed={saved} aria-label={saved ? "Unsave" : "Save"}>
      <Ic d={I.mark} size={18} />{wide && <span style={{ marginLeft: 8 }}>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
  return (
    <div className="cx">
      <div className="dwrap" style={{ paddingBottom: 110 }}>
        <div className="dhero">
          <Art deal={d} style={{ position: "absolute", inset: 0 }} label={false} />
          <div className="ov" />
          <button className="ic back" onClick={() => (window.history.length > 1 ? nav(-1) : nav("/app/discover"))} aria-label="Back"><Ic d={I.back} size={18} /></button>
          <span className="mono" style={{ position: "absolute", right: 20, top: 24, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: d.art === "clinic" || d.art === "book" ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.55)" }}>Sample image</span>
        </div>
        <div className="dlay">
          <div className="dmain" style={{ padding: "0 20px", marginTop: -20, position: "relative" }}>
            <span className="sample" style={{ background: "#fff" }}>Sample deal</span>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.04em", margin: "10px 0 0", lineHeight: 1.05 }}>{d.name}</h1>
            <p style={{ fontSize: 17, color: "#333", marginTop: 6, lineHeight: 1.35 }}>{d.line}</p>
            <div style={{ display: "flex", gap: 14, margin: "12px 0 16px", flexWrap: "wrap" }}>{d.traction.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
            <div className="risk" style={{ marginBottom: 16 }}><span>{RISK}</span></div>
            <div className="mob-only"><Terms d={d} />
              <div style={{ padding: "14px 0 6px" }}><Progress deal={d} /><div style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}><b className="num" style={{ color: "var(--ink)" }}>{d.backers}</b> backers · {Math.round((d.raised / d.goal) * 100)}% of goal</div></div>
            </div>
            <div className="dtabs" role="tablist">
              <button role="tab" className={tab === "about" ? "on" : ""} aria-selected={tab === "about"} onClick={() => setTab("about")}>About</button>
              <button role="tab" className={tab === "qa" ? "on" : ""} aria-selected={tab === "qa"} onClick={() => setTab("qa")}>Questions <span className="num" style={{ fontSize: 12 }}>{qa.length + mineQ.length}</span></button>
            </div>
            {tab === "qa" ? <Questions d={d} qa={qa} mine={mineQ} onAsk={(text) => set((x) => ({ ...x, questions: [...x.questions, { deal: d.id, text, at: Date.now() }] }))} /> : <>
            <div className="sec"><h2>What they do</h2><p>{d.about}</p></div>
            <div className="sec"><h2>What the money is for</h2><ul>{d.use.map((u) => <li key={u}>{u}</li>)}</ul></div>
            <div className="sec"><h2>Team</h2>
              {d.team.map((t) => (
                <div key={t.role} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
                  <div className="mono-lg" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--soft)", color: "var(--mute)" }}><Ic d={I.user} size={18} /></div>
                  <div><b>{t.role}</b><div className="sub" style={{ fontSize: 14 }}>{t.note}</div></div>
                </div>
              ))}
              <p className="sub" style={{ fontSize: 12, marginTop: 6 }}>Fictional company for the preview. No real people shown.</p>
            </div>
            <div className="sec"><h2>The fine print</h2><p className="sub">Real deals will include the company's SEC filing (Form C), financials, and full risk disclosures. A SAFE converts to shares only if the company raises a priced round or sells.</p></div>
            </>}
          </div>
          <aside className="side">
            <Logo />
            <Terms d={d} />
            <div style={{ padding: "14px 0 18px" }}><Progress deal={d} /><div style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}><b className="num" style={{ color: "var(--ink)" }}>{d.backers}</b> backers · {Math.round((d.raised / d.goal) * 100)}% of goal</div></div>
            <ButtonLink to={`/app/invest/${d.id}`} iconRight="invest" block className="cb-invest">Invest from ${d.min}</ButtonLink>
            <div style={{ marginTop: 10 }}><SaveBtn wide /></div>
            <p className="fine">Investing opens soon through an SEC-registered funding portal.</p>
          </aside>
        </div>
      </div>
      <div className="sticky"><div className="wrap">
        <SaveBtn />
        <div style={{ flex: 1, display: "flex" }}><ButtonLink to={`/app/invest/${d.id}`} iconRight="invest" block className="cb-invest">Invest from ${d.min}</ButtonLink></div>
      </div></div>
    </div>
  );
}

function Questions({ d, qa, mine, onAsk }: { d: D; qa: ReturnType<typeof sampleQA>; mine: { text: string; at: number }[]; onAsk: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="sec" style={{ borderTop: 0, paddingTop: 6 }}>
      <div className="pub"><Ic d={I.shield} size={16} /><span>Questions and founder answers are public. Everyone looking at {d.name} sees the same thing. On real deals this runs on the funding portal's communication channel, the only place founders are allowed to talk about their raise.</span></div>
      {mine.map((q) => (
        <div className="qa" key={q.at}><div className="q">{q.text}</div><div className="by">You · just now · Sample</div><div className="wait">Waiting for the founder to answer. In the preview, nobody will.</div></div>
      ))}
      {qa.map((q) => (
        <div className="qa" key={q.q}>
          <div className="q">{q.q}</div>
          <div className="by">{q.asker} · {q.when} ago · ▲ {q.votes}</div>
          {q.a ? <div className="ans">{q.a}<div className="by"><b style={{ color: "var(--ink)" }}>{q.founder}</b> · Founder reply · Sample</div></div> : <div className="wait">No answer yet.</div>}
        </div>
      ))}
      <form className="askbox" onSubmit={(e) => { e.preventDefault(); const v = text.trim(); if (v) { onAsk(v); setText(""); } }}>
        <span className="lbl">Ask the founders</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything about the business or the terms. Your question will be public." aria-label="Your question" />
        <Button type="submit" icon="send" disabled={!text.trim()}>Post publicly</Button>
        <p className="fine" style={{ marginTop: 0 }}>Preview. Your question stays on this device. Sample names only.</p>
      </form>
    </div>
  );
}

export function Invest() {
  const d = DEALS.find((x) => x.id === useParams().id);
  const nav = useNavigate();
  const [s, set] = useTry();
  const [amt, setAmt] = useState(250);
  const [c, setC] = useState([false, false, false]);
  const [done, setDone] = useState(false);
  useNoindex(d ? `Invest · ${d.name}` : "Invest");
  if (!d) return <Navigate to="/app/discover" replace />;
  const lim = regCfLimit(s.income, s.netWorth);
  const presets = [100, 250, 500, 1000].filter((p) => p >= d.min);
  const over = amt > lim;
  const ok = c.every(Boolean) && amt >= d.min && !over;
  const CHECKS = ["I could lose all of this money.", "I may not be able to sell for years.", "I'll read the company's filing before investing for real."];

  return (
    <div className="cx">
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px 40px", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="ic" onClick={() => nav(-1)} aria-label="Back"><Ic d={I.back} size={18} /></button>
          <b style={{ flex: 1 }}>{d.name}</b><span className="sample">Sample</span>
        </div>
        {!done ? (
          <>
            <div className="amt num">{usd(amt)}</div>
            <p className="sub" style={{ textAlign: "center" }}>{d.type} at a {d.cap} valuation cap</p>
            <div className="presets">
              {presets.map((p) => <button key={p} className={`num ${amt === p ? "on" : ""}`} onClick={() => setAmt(p)}>{p >= 1000 ? "$1K" : `$${p}`}</button>)}
            </div>
            <input type="range" min={d.min} max={Math.max(d.min, Math.min(lim, 5000))} step={50} value={amt} onChange={(e) => setAmt(Number(e.target.value))} aria-label="Amount" style={{ width: "100%", accentColor: "#0b0b0b" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid var(--line)", marginTop: 14, fontSize: 14 }}>
              <span>Your estimated 12-month limit</span><b className="num">{usd(Math.max(0, lim - amt))} left</b>
            </div>
            {over && <div className="risk" style={{ marginBottom: 10 }}><span>That's over your estimated limit of {usd(lim)}. Lower the amount or update your money check.</span></div>}
            {CHECKS.map((t, i) => (
              <button key={i} className="chk" style={{ borderTop: "1px solid var(--line)" }} aria-pressed={c[i]} onClick={() => setC(c.map((v, j) => (j === i ? !v : v)))}>
                <span className={`box ${c[i] ? "on" : ""}`}>{c[i] && <Ic d={I.check} size={14} />}</span>{t}
              </button>
            ))}
            <p className="sub" style={{ fontSize: 13, margin: "6px 0 18px" }}>On real deals, if the goal isn't hit by the deadline, you get your money back.</p>
            <div style={{ flex: 1 }} />
            <Button size="lg" block disabled={!ok} iconRight="forward" onClick={() => { set((x) => ({ ...x, intents: [...x.intents.filter((i) => i.id !== d.id), { id: d.id, amount: amt }] })); setDone(true); }}>Continue</Button>
            <p className="fine">Preview only. No payment info is collected.</p>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="mono-lg" style={{ width: 56, height: 56, borderRadius: "50%" }}><Ic d={I.check} size={26} /></div>
            <div className="h1" style={{ marginTop: 22 }}>Investing opens soon.</div>
            <p className="sub" style={{ marginTop: 10 }}>Catalyst will run investments through an SEC-registered funding portal. Nothing was charged and no money moved. We noted your {usd(amt)} interest in {d.name} on this device.</p>
            <div className="soon" style={{ marginTop: 18 }}>{d.name} is a sample company made up for this preview.</div>
            <div style={{ marginTop: 24 }}><ButtonLink to="/signup" block>Join the waitlist</ButtonLink></div>
            <div style={{ marginTop: 10 }}><ButtonLink to="/app/swipe" variant="ghost" block>Keep exploring</ButtonLink></div>
          </div>
        )}
      </div>
    </div>
  );
}
