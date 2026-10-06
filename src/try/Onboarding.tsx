import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { COMMUNITY_PHOTO, COMMUNITY_SIZE, regCfLimit, usd } from "./data";
import { toggle, useTry } from "./store";
import { I, Ic, Logo, useNoindex } from "./ui";

const TITLES = ["Welcome", "Sign up", "Verify", "Interests", "Money check", "Risks", "Notifications", "All set"];
const INTERESTS: [string, React.ReactNode][] = [
  ["Food", I.food], ["Health", I.health], ["Climate", I.climate], ["Software", I.software], ["Education", I.edu],
];

export default function Onboarding() {
  const step = Number(useParams().step || 1);
  const nav = useNavigate();
  const [s, set] = useTry();
  useNoindex(TITLES[step - 1] || "Welcome");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [ack, setAck] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  if (!(step >= 1 && step <= 8)) return <Navigate to="/app/welcome" replace />;
  const next = () => nav(step === 8 ? "/app/swipe" : `/app/welcome/${step + 1}`);
  const counted = step >= 2 && step <= 7;
  const n = step <= 3 ? 1 : step - 2; // 1..6 progress

  const Nav = ({ skip }: { skip?: boolean }) => (
    <>
      {counted && <div className="steps">{[1, 2, 3, 4, 5, 6].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</div>}
      <div className="nav">
        <button className="ic" onClick={() => nav(-1)} aria-label="Back"><Ic d={I.back} size={18} /></button>
        {skip ? <button className="sub" onClick={next}>Not now</button> : counted ? <span className="lbl num">{n} / 6</span> : <span />}
      </div>
    </>
  );

  let body: React.ReactNode;
  if (step === 1) {
    body = (
      <>
        <div className="hero-ob photo" style={{ backgroundImage: `url(${COMMUNITY_PHOTO})` }}>
          <div className="ov" /><div style={{ position: "absolute", top: 18, left: 24, filter: "invert(1)" }}><Logo /></div>
          <div className="cap">Catalyst community, NYC</div>
        </div>
        <div className="t" style={{ fontSize: 40, marginTop: 28 }}>Startup ownership for everyone.</div>
        <p className="sub">Right from your phone. Back startups you believe in, starting small.</p>
        <div className="grow" />
        <button className="btn" onClick={next} style={{ marginTop: 28 }}>Get started</button>
        <Link to="/auth" className="btn ghost" style={{ marginTop: 10 }}>I have an account</Link>
      </>
    );
  } else if (step === 2) {
    const ok = phone.replace(/\D/g, "").length >= 10;
    body = (
      <>
        <Nav />
        <div className="t">Create your account</div>
        <p className="sub">Use your phone number. We'll text you a code.</p>
        <label className="field" style={{ marginTop: 26 }}>
          <span className="num" style={{ color: "var(--mute)" }}>+1</span>
          <input className="num" inputMode="tel" placeholder="(212) 555-0147" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Phone number" />
        </label>
        <button className="btn" style={{ marginTop: 22 }} disabled={!ok} onClick={next}>Send code</button>
        <div className="or">or</div>
        <button className="btn ghost" onClick={next}>Continue with Apple</button>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={next}>Continue with Google</button>
        <p className="fine">This is a preview, nothing is sent. By continuing you agree to the <Link className="u" to="/terms">Terms</Link> and <Link className="u" to="/privacy">Privacy Policy</Link>.</p>
      </>
    );
  } else if (step === 3) {
    const full = code.every((c) => c);
    body = (
      <>
        <Nav />
        <div className="t">Enter the code</div>
        <p className="sub">Sent to <b className="num" style={{ color: "var(--ink)" }}>{phone || "(212) 555-0147"}</b>. Preview: any 6 digits work.</p>
        <div className="code">
          {code.map((c, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} className={`num ${c ? "f" : ""}`} inputMode="numeric" maxLength={1} value={c} aria-label={`Digit ${i + 1}`}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(-1);
                const nx = [...code]; nx[i] = v; setCode(nx);
                if (v && i < 5) refs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus(); }} />
          ))}
        </div>
        <p className="sub" style={{ fontSize: 13 }}>Didn't get it? <span className="u">Resend</span></p>
        <div className="grow" />
        <button className="btn" style={{ marginTop: 28 }} disabled={!full} onClick={next}>Verify</button>
      </>
    );
  } else if (step === 4) {
    body = (
      <>
        <Nav />
        <div className="t">What are you into?</div>
        <p className="sub">Pick a few. We'll show you those startups first.</p>
        <div className="igrid">
          {INTERESTS.map(([k, d]) => (
            <button key={k} className={`int ${s.interests.includes(k) ? "on" : ""}`} aria-pressed={s.interests.includes(k)}
              onClick={() => set((x) => ({ ...x, interests: toggle(x.interests, k) }))}>
              <Ic d={d} />{k}
            </button>
          ))}
        </div>
        <div className="grow" />
        <button className="btn" style={{ marginTop: 28 }} disabled={!s.interests.length} onClick={next}>
          Continue{s.interests.length ? ` · ${s.interests.length}` : ""}
        </button>
      </>
    );
  } else if (step === 5) {
    const lim = regCfLimit(s.income, s.netWorth);
    const both = s.income >= 124000 && s.netWorth >= 124000;
    const num = (v: string) => Math.max(0, Number(v.replace(/\D/g, "")) || 0);
    body = (
      <>
        <Nav />
        <div className="t">A quick money check</div>
        <p className="sub">The law caps how much you can put into startups each year, so no one bets too much. Rough numbers are fine.</p>
        <div style={{ marginTop: 20 }}>
          <label className="mfield">Yearly income<input inputMode="numeric" value={usd(s.income)} onChange={(e) => set((x) => ({ ...x, income: num(e.target.value) }))} /></label>
          <label className="mfield" style={{ borderBottom: "1px solid var(--line)" }}>Net worth<input inputMode="numeric" value={usd(s.netWorth)} onChange={(e) => set((x) => ({ ...x, netWorth: num(e.target.value) }))} /></label>
          <p className="sub" style={{ fontSize: 12, marginTop: 6 }}>Net worth doesn't count the home you live in.</p>
        </div>
        <div className="lim">
          <span className="lbl" style={{ color: "#bdbdbd" }}>Estimated 12-month limit</span>
          <b className="num">{usd(lim)}</b>
          <p>{both
            ? "Since both your income and net worth are $124,000 or more, it's 10% of the higher one, capped at $124,000."
            : "Since your income or net worth is under $124,000, it's $2,500 or 5% of the higher one, whichever is more."}
            {" "}Counted across all startup investments over 12 months. This is an estimate, not advice.</p>
        </div>
        <p className="sub" style={{ fontSize: 12, marginTop: 12 }}>Stays on this device in the preview. You can change it later.</p>
        <div className="grow" />
        <button className="btn" style={{ marginTop: 22 }} onClick={next}>Continue</button>
      </>
    );
  } else if (step === 6) {
    const R = [
      ["Most startups fail.", "You could lose everything you put in. Only invest what you can afford to lose."],
      ["Your money is locked up.", "Plan on years, not months. Payouts usually only come if the company sells or goes public."],
      ["It's hard to sell.", "There's no stock market for these shares. You usually can't sell for at least a year."],
    ];
    body = (
      <>
        <Nav />
        <div className="t">Before you invest</div>
        <p className="sub" style={{ marginBottom: 18 }}>Three things worth knowing.</p>
        {R.map(([h, p], i) => (
          <div className="rk" key={i}><span className="n num">0{i + 1}</span><div><h3>{h}</h3><p>{p}</p></div></div>
        ))}
        <div className="grow" />
        <button className="chk" style={{ borderTop: "1px solid var(--line)", marginTop: 10 }} onClick={() => setAck(!ack)} aria-pressed={ack}>
          <span className={`box ${ack ? "on" : ""}`}>{ack && <Ic d={I.check} size={14} />}</span>I understand startup investing is risky.
        </button>
        <button className="btn" disabled={!ack} onClick={next}>I understand</button>
      </>
    );
  } else if (step === 7) {
    body = (
      <>
        <Nav skip />
        <div className="t">Know when a deal opens</div>
        <p className="sub">We'll only ping you about startups you follow and things that need you.</p>
        <div style={{ marginTop: 26 }}>
          <div className="notif"><div className="mono-lg" style={{ width: 34, height: 34, fontSize: 13, borderRadius: 9 }}>c</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>Stoop Coffee Co. is open</b><span className="sample">Sample</span></div><div className="sub" style={{ fontSize: 13 }}>The round you followed is live. Take a look.</div></div></div>
          <div className="notif" style={{ opacity: 0.7 }}><div className="mono-lg" style={{ width: 34, height: 34, fontSize: 13, borderRadius: 9 }}>c</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><b>Founder update posted</b><span className="sample">Sample</span></div><div className="sub" style={{ fontSize: 13 }}>Q3 numbers are in.</div></div></div>
        </div>
        <div className="grow" />
        <button className="btn" style={{ marginTop: 28 }} onClick={() => { set((x) => ({ ...x, notify: true })); next(); }}>Turn on notifications</button>
      </>
    );
  } else {
    body = (
      <>
        <div className="hero-ob photo" style={{ backgroundImage: `url(${COMMUNITY_PHOTO})`, height: "40vh" }}><div className="ov" /><div className="cap">Catalyst community event</div></div>
        <div className="t" style={{ fontSize: 44, marginTop: 30 }}>You're in.</div>
        <p className="sub">Browse startups, follow the ones you like, and meet the founders at events with our {COMMUNITY_SIZE}-person community.</p>
        <div className="soon" style={{ marginTop: 20 }}>Investing opens soon through an SEC-registered funding portal. Until then, everything here is a preview with sample companies.</div>
        <div className="grow" />
        <button className="btn" style={{ marginTop: 28 }} onClick={next}>Start exploring</button>
      </>
    );
  }

  return (
    <div className="cx">
      <div className="obwrap">
        <aside className="obside photo" style={{ backgroundImage: `url(${COMMUNITY_PHOTO})` }}>
          <div className="ov" />
          <div className="tx">
            <div style={{ filter: "invert(1)" }}><Logo /></div>
            <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-.045em", lineHeight: 1, marginTop: 18 }}>Back the startups you believe in.</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.75, marginTop: 16 }}>Catalyst community, NYC</div>
          </div>
        </aside>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="ob" key={step}>{body}</div>
        </div>
      </div>
    </div>
  );
}
