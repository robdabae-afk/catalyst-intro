import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Shell, { LUMA, useMeta } from "./Shell";

type Role = "founder" | "investor";

function JoinForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), consent: useRef<HTMLInputElement>(null) };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!name.trim()) n.name = "This is required.";
    if (!email.trim()) n.email = "This is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) n.email = "Enter a valid email.";
    if (!consent) n.consent = "This is required.";
    setErrs(n);
    const first = (["name", "email", "consent"] as const).find((k) => n[k]);
    if (first) return refs[first].current?.focus();
    // Hand off to the existing Supabase signup flow, prefilled.
    const q = new URLSearchParams({ role, name: name.trim(), email: email.trim() });
    navigate(`/signup/form?${q}`);
  };

  const p = role === "founder" ? "f" : "i";
  return (
    <form id={`p-${p}`} role="tabpanel" aria-labelledby={`t-${p}`} noValidate onSubmit={submit}>
      <div>
        <label htmlFor={`${p}-name`}>Full name</label>
        <input id={`${p}-name`} ref={refs.name} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errs.name} />
        <div className="err" aria-live="polite">{errs.name}</div>
      </div>
      <div>
        <label htmlFor={`${p}-email`}>Email</label>
        <input id={`${p}-email`} ref={refs.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errs.email} />
        <div className="err" aria-live="polite">{errs.email}</div>
      </div>
      <label className="consent">
        <input type="checkbox" ref={refs.consent} checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errs.consent} />
        <span>
          {role === "founder"
            ? "I agree to receive event invites and community updates from Catalyst. Unsubscribe any time. See the "
            : "I agree to receive event invites and product updates from Catalyst. I understand this is not an offer of securities and Catalyst does not currently facilitate investments. See the "}
          <Link to="/privacy">privacy notice</Link>.
        </span>
      </label>
      <div className="err" aria-live="polite">{errs.consent}</div>
      <button className="btn" type="submit" style={{ justifySelf: "start" }}>
        Continue as {role === "founder" ? "a founder" : "an investor"}
      </button>
    </form>
  );
}

export default function Landing() {
  useMeta(
    "Catalyst · Where NYC founders and investors meet",
    "Catalyst is a New York community where founders and early-stage investors meet in real rooms. Startup investing for everyone is coming, pending regulatory registration."
  );
  const [role, setRole] = useState<Role>("founder");
  const tabs = { founder: useRef<HTMLButtonElement>(null), investor: useRef<HTMLButtonElement>(null) };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next: Role = role === "founder" ? "investor" : "founder";
      setRole(next);
      tabs[next].current?.focus();
    }
  };

  return (
    <Shell>
      <div className="hero">
        <div>
          <div className="kick reveal">New York · Founders · Investors</div>
          <h1 className="reveal d1">Startups are built in <em>rooms.</em> We fill them.</h1>
          <p className="lede reveal d2">Catalyst is a community where founders and early-stage investors actually meet. In person, every week, across New York.</p>
          <div className="ctas reveal d3">
            <a className="btn" href="#join" onClick={() => setRole("founder")}>I'm a founder</a>
            <a className="btn ghost" href="#join" onClick={() => setRole("investor")}>I'm an investor</a>
          </div>
        </div>
        <aside className="ticket reveal d3" aria-label="Next up">
          <div className="kick">Admit one</div>
          <h3>Weekly founder mixer</h3>
          <dl>
            <dt>Where</dt><dd>a.cafe, NYC</dd>
            <dt>Who</dt><dd>Founders, angels, operators</dd>
            <dt>Cost</dt><dd>Free with RSVP</dd>
          </dl>
          <p style={{ margin: "18px 0 0" }}><a className="btn sm" href={LUMA}>See dates on Luma</a></p>
        </aside>
      </div>

      <section aria-labelledby="proof">
        <h2 id="proof" className="kick" style={{ font: "600 13px var(--s)" }}>The community so far</h2>
        <div className="stats">
          <div className="stat"><b>20k</b>community members reached in 4 months<br /><small>Across events, socials and lists. Not app users.</small></div>
          <div className="stat"><b>30+</b>rooms hosted<br /><small>Mixers, pitch nights, founder dinners</small></div>
          <div className="stat"><b>$1.8M</b>raised by founders in our network<br /><small>From accredited investors they met at Catalyst rooms. Catalyst did not raise, hold or route these funds.</small></div>
        </div>
      </section>

      <section id="how" aria-labelledby="h-how">
        <h2 id="h-how">What's real today, and what's next.</h2>
        <div className="cols">
          <div className="card">
            <span className="tag live">Live now</span>
            <h3>Rooms &amp; intros</h3>
            <ul className="check">
              <li>Weekly NYC mixers and pitch nights</li>
              <li>Curated founder–investor introductions based on stage and sector</li>
              <li>Founder interviews and community spotlights</li>
            </ul>
          </div>
          <div className="card">
            <span className="tag soon">Coming soon, pending registration</span>
            <h3>Startup investing for everyone</h3>
            <p>We're building a mobile app so everyday Americans can discover early-stage startups. Our funding portal registration is <strong>in process, not approved</strong>. Until it is, Catalyst does not offer, sell or facilitate any investment. Join the waitlist for product updates only.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="h-p">
        <h2 id="h-p" className="kick" style={{ font: "600 13px var(--s)" }}>Rooms we've built with</h2>
        <div className="partners"><span>Wayo Club</span><span>The Tavern</span><span>a.cafe</span><span>JellyJelly</span></div>
      </section>

      <section id="events" aria-labelledby="h-ev">
        <div className="cols" style={{ alignItems: "center" }}>
          <div>
            <h2 id="h-ev">Come to a room.</h2>
            <p className="lede">Every event lives on one calendar. RSVP on Luma, show up, meet the people building New York's next companies.</p>
          </div>
          <div>
            <a className="btn" href={LUMA}>Open the event calendar</a>
            <p className="fine" style={{ color: "var(--mut)" }}>Events may be photographed. Tell the host if you'd rather not appear.</p>
          </div>
        </div>
      </section>

      <section id="join" aria-labelledby="h-join">
        <div className="join">
          <h2 id="h-join">Join <em>Catalyst.</em></h2>
          <p>One signup. Tell us which side of the table you're on.</p>
          <div role="tablist" aria-label="Signup type" onKeyDown={onKey}>
            {(["founder", "investor"] as Role[]).map((r) => (
              <button key={r} ref={tabs[r]} role="tab" id={`t-${r[0]}`} aria-controls={`p-${r[0]}`} aria-selected={role === r} tabIndex={role === r ? 0 : -1} onClick={() => setRole(r)}>
                I'm {r === "founder" ? "a founder" : "an investor"}
              </button>
            ))}
          </div>
          <JoinForm key={role} role={role} />
          <p className="fine">Next step: create your account (password + profile). Already a member? <Link to="/auth" style={{ color: "var(--paper)" }}>Log in</Link>.</p>
        </div>
      </section>

      <section aria-labelledby="h-faq">
        <h2 id="h-faq">Questions</h2>
        <details><summary>Can I invest in startups through Catalyst?</summary><p>Not yet. Our funding portal registration is in process. Until it's approved, Catalyst does not offer, sell or facilitate investments of any kind.</p></details>
        <details><summary>Does it cost anything?</summary><p>Joining the community and most events are free. Some special events may be ticketed on Luma.</p></details>
        <details><summary>Who runs Catalyst?</summary><p>Rob Guthy (CEO) and Stephen Michael (co-founder, community &amp; partnerships). <Link to="/about">More about us</Link>.</p></details>
      </section>
    </Shell>
  );
}
