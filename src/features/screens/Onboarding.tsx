import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { path } from "../FeaturesApp";
import { ICheck } from "../icons";
import { setState, toggle, useStore } from "../store";

const SECTORS = ["Climate", "Fintech", "AI", "Health", "Hardware", "Consumer", "Software"];

/* In-app first run: welcome, role, interests, Reg CF primer, alerts, then real account or explore. */
export default function Onboarding() {
  const [s] = useStore();
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const finish = (to: string) => { setState((x) => ({ ...x, onboarded: true })); nav(to); };
  const steps = [
    { k: "welcome", body: (<>
      <div className="ob-mark" aria-hidden><i /></div>
      <h1>Back the startups you believe in.</h1>
      <p>Catalyst brings founders, pitch nights and early-stage deals into one app, starting in New York.</p>
    </>), next: "Get started" },
    { k: "role", body: (<>
      <h1>What brings you here?</h1>
      <div className="ob-opts">{([["investor", "I want to back startups"], ["founder", "I'm building a startup"]] as const).map(([v, t]) => (
        <button key={v} type="button" className={`ob-opt${s.role === v ? " on" : ""}`} aria-pressed={s.role === v} onClick={() => setState((x) => ({ ...x, role: v }))}>{t}{s.role === v && <ICheck size={16} />}</button>))}</div>
    </>), next: "Continue", ok: !!s.role },
    { k: "interests", body: (<>
      <h1>Pick a few sectors.</h1>
      <p>We use these to sort your deal feed and event invites.</p>
      <div className="ob-chips">{SECTORS.map((x) => (
        <button key={x} type="button" className={`chip${s.interests.includes(x) ? " on" : ""}`} aria-pressed={s.interests.includes(x)} onClick={() => setState((st) => ({ ...st, interests: toggle(st.interests, x) }))}>{x}</button>))}</div>
    </>), next: "Continue" },
    { k: "regcf", body: (<>
      <h1>How this will work.</h1>
      <ol className="ob-list">
        <li><b>Reg CF</b> lets anyone invest in startups, not just accredited investors.</li>
        <li><b>Limits apply</b> based on income and net worth, so no one overextends.</li>
        <li><b>It's risky.</b> Most startups fail and shares are hard to sell.</li>
      </ol>
      <p className="dim">Investing opens soon. Portal registration is pending; nothing can be funded yet.</p>
    </>), next: "Got it" },
    { k: "alerts", body: (<>
      <h1>Want one ping when investing opens?</h1>
      <button type="button" className={`ob-opt${s.prefs.investing_opens ? " on" : ""}`} aria-pressed={s.prefs.investing_opens}
        onClick={() => setState((x) => ({ ...x, prefs: { ...x.prefs, investing_opens: !x.prefs.investing_opens } }))}>Notify me{s.prefs.investing_opens && <ICheck size={16} />}</button>
    </>), next: "Continue" },
    { k: "account", body: (<>
      <h1>You're in.</h1>
      <p>Create an account to save your watchlist and RSVPs across devices, or look around first.</p>
    </>) },
  ];
  const st = steps[i];
  return (
    <div className="ob">
      <div className="ob-top">
        {i > 0 ? <button type="button" className="ob-back" onClick={() => setI(i - 1)}>Back</button> : <span />}
        <div className="ob-dots" aria-label={`Step ${i + 1} of ${steps.length}`}>{steps.map((x, k) => <i key={x.k} className={k <= i ? "on" : ""} />)}</div>
        {i < steps.length - 1 ? <button type="button" className="ob-back" onClick={() => finish(path(""))}>Skip</button> : <span />}
      </div>
      <div className="ob-body" key={st.k}>{st.body}</div>
      <div className="ob-foot">
        {st.next
          ? <button type="button" className="btn" disabled={st.ok === false} onClick={() => setI(i + 1)}>{st.next}</button>
          : <>
              <button type="button" className="btn" onClick={() => finish("/app/signup/form?from=app")}>Create account</button>
              <button type="button" className="btn ghost" onClick={() => finish(path(""))}>Explore sample deals</button>
              <button type="button" className="ob-link" onClick={() => finish("/app/auth?from=app")}>I already have an account</button>
            </>}
        <p className="ob-legal">By continuing you agree to our <Link to={path("legal/terms")}>Terms</Link> and <Link to={path("legal/privacy")}>Privacy notice</Link>.</p>
      </div>
    </div>
  );
}
