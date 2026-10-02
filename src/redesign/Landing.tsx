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
            ? "I agree to receive early-access and product updates from Catalyst. Unsubscribe any time. See the "
            : "I agree to receive waitlist and product updates from Catalyst. I understand this is not an offer of securities and Catalyst does not currently facilitate investments. See the "}
          <Link to="/privacy">privacy notice</Link>.
        </span>
      </label>
      <div className="err" aria-live="polite">{errs.consent}</div>
      <button className="btn" type="submit" style={{ justifySelf: "start" }}>
        {role === "founder" ? "Get early access" : "Join the waitlist"}
      </button>
    </form>
  );
}

export default function Landing() {
  useMeta(
    "Catalyst · Startup investing, built for your phone",
    "Catalyst is a mobile app for everyday Americans to discover early-stage startups. Coming soon, pending funding portal registration. Join the waitlist."
  );
  const [role, setRole] = useState<Role>("investor");
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
          <div className="pill reveal">Coming soon · Join the waitlist</div>
          <h1 className="reveal d1">Startup investing, built for <em>your phone.</em></h1>
          <p className="lede reveal d2">Catalyst is the Robinhood for early-stage startups. A fast, simple app where everyday Americans discover vetted startups and back the ones they believe in. No insider network required.</p>
          <div className="ctas reveal d3">
            <a className="btn" href="#join" onClick={() => setRole("investor")}>Join the waitlist</a>
            <a className="btn ghost" href="#join" onClick={() => setRole("founder")}>Raise with Catalyst</a>
          </div>
          <p className="fine reveal d3" style={{ marginTop: 18 }}>Funding portal registration pending. No investments are available yet.</p>
        </div>
        <div className="phone tilt reveal d2">
          <div className="back"><img src="/redesign/app-detail.jpg" alt="" loading="lazy" /></div>
          <img src="/redesign/app-discover.jpg" alt="Catalyst app preview: browsing early-stage startups" />
          <p className="fine" style={{ position: "absolute", bottom: -34, left: 0, right: 0, textAlign: "center", margin: 0 }}>Illustrative preview. Sample profiles, not live offerings.</p>
        </div>
      </div>

      <section aria-labelledby="h-why">
        <div className="kick">Why Catalyst</div>
        <p className="big" id="h-why">Venture ownership is one of America's great wealth generators. Yet only <b>320,000</b> people backed a startup last year, while <b>24.3M</b> qualify as accredited, and under Reg CF you don't even need to be.</p>
        <p className="lede" style={{ marginTop: 24 }}>The question isn't who can invest. It's where people go to discover opportunities. Today's crowdfunding sites are niche, clunky and hard to trust. We're building the place you'll actually open.</p>
      </section>

      <section id="how" aria-labelledby="h-how">
        <div className="kick">How it works</div>
        <h2 id="h-how">Swipe-simple. <em>Founder-first.</em></h2>
        <div className="three" style={{ marginTop: 32 }}>
          <div className="card"><span className="n">01</span><h3>Discover</h3><p>A feed of vetted early-stage startups, built for a five-minute coffee break, not a data room.</p></div>
          <div className="card"><span className="n">02</span><h3>Get to know them</h3><p>Founder videos, the problem, the traction, and the team, all in one clean profile.</p></div>
          <div className="card"><span className="n">03</span><h3>Back what you believe in</h3><p>When we launch, invest small amounts from your phone through a registered funding portal.</p></div>
        </div>
        <div className="vs">
          <div className="card"><h3><small>Crowdfunding sites</small>Match.com</h3><p>Long forms, endless listings, desktop-first. Built for people who already know what they're looking for.</p></div>
          <div className="card gold"><h3><small>Catalyst</small>Tinder</h3><p>Mobile-native, fast and curated. Built for the 9-to-5 professional who has never been in the room.</p></div>
        </div>
      </section>

      <section aria-labelledby="h-f">
        <div className="split">
          <div className="phone reveal"><img src="/redesign/app-detail.jpg" alt="Catalyst app preview: a startup profile" loading="lazy" /></div>
          <div>
            <div className="kick">For founders</div>
            <h2 id="h-f">Raise from your community, <em>and everyone else.</em></h2>
            <p className="lede">Turn customers, fans and your own network into backers, then reach everyday investors who never had a way to find you.</p>
            <ul className="check" style={{ margin: "20px 0 28px" }}>
              <li>Tell your story in a profile built for phones</li>
              <li>Bring your community in with one link</li>
              <li>Get in front of a growing audience of curious investors</li>
            </ul>
            <a className="btn" href="#join" onClick={() => setRole("founder")}>Raise with Catalyst, get early access</a>
          </div>
        </div>
      </section>

      <section id="community" aria-labelledby="proof">
        <div className="split" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="kick">Our growth engine</div>
            <h2 id="proof">Built on a real New York community.</h2>
            <p className="lede">Before the app, we built the rooms. 20k people reached in 4 months and 30+ founder and investor events across NYC.</p>
          </div>
          <div><Link className="btn ghost" to="/community">Explore the community</Link></div>
        </div>
      </section>

      <section id="join" aria-labelledby="h-join">
        <div className="join">
          <h2 id="h-join">Get in <em>early.</em></h2>
          <p>Catalyst is coming soon. Tell us which side of the table you're on.</p>
          <div role="tablist" aria-label="Signup type" onKeyDown={onKey}>
            {(["investor", "founder"] as Role[]).map((r) => (
              <button key={r} ref={tabs[r]} role="tab" id={`t-${r[0]}`} aria-controls={`p-${r[0]}`} aria-selected={role === r} tabIndex={role === r ? 0 : -1} onClick={() => setRole(r)}>
                I'm {r === "founder" ? "a founder" : "an investor"}
              </button>
            ))}
          </div>
          <JoinForm key={role} role={role} />
          <p className="fine">Next step: create your account. Already a member? <Link to="/auth" style={{ color: "var(--ink)" }}>Log in</Link>.</p>
        </div>
      </section>

      <section aria-labelledby="h-faq">
        <h2 id="h-faq">Questions</h2>
        <details><summary>Can I invest through Catalyst today?</summary><p>Not yet. Our funding portal registration is pending. Until it's approved, Catalyst does not offer, sell or facilitate investments of any kind. The waitlist is for product updates only.</p></details>
        <details><summary>Do I need to be accredited?</summary><p>Regulation Crowdfunding lets non-accredited investors participate, within annual limits. We'll share the details at launch.</p></details>
        <details><summary>Is startup investing risky?</summary><p>Yes. Most startups fail, and these investments are hard to sell. You could lose everything you put in.</p></details>
        <details><summary>Who's building Catalyst?</summary><p>Rob Guthy (CEO, former Army infantry officer) and Stephen Michael (co-founder, NYU finance, built the community). <Link to="/about">More about us</Link>.</p></details>
      </section>
    </Shell>
  );
}
