import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Showcase from "./Showcase";
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
            : "I agree to receive beta and product updates from Catalyst. I understand this is not an offer of securities and Catalyst does not currently facilitate investments. See the "}
          <Link to="/privacy">privacy notice</Link>.
        </span>
      </label>
      <div className="err" aria-live="polite">{errs.consent}</div>
      <button className="btn" type="submit" style={{ justifySelf: "start" }}>
        {role === "founder" ? "Get early access" : "Join the beta"}
      </button>
    </form>
  );
}

const SCREENS = [
  { src: "/redesign/screen-2529.webp", label: "Featured founders", alt: "Catalyst app: featured founder card with pass, priority and connect buttons" },
  { src: "/redesign/screen-2528.webp", label: "Investor profile", alt: "Catalyst app: investor profile with check size, focus and thesis" },
  { src: "/redesign/screen-2526.webp", label: "Community feed", alt: "Catalyst app: community feed with featured founders and posts" },
  { src: "/redesign/screen-2527.webp", label: "Investor activity", alt: "Catalyst app: investor profile with activity and endorsements" },
  { src: "/redesign/screen-2530.webp", label: "Founder funding details", alt: "Catalyst app: founder funding details editor with sample figures" },
  { src: "/redesign/screen-2532.webp", label: "Investor thesis setup", alt: "Catalyst app: investor preferences for industries, stage and check size" },
];

const CMP: [string, string, string][] = [
  ["Built for your phone", "✓", "Website first"],
  ["Startups from real NYC events", "✓", "—"],
  ["In-person founder events", "✓", "Mostly online"],
  ["Easy for first-time investors", "✓", "Can be confusing"],
  ["Invest today", "Coming soon", "✓"],
];

export default function Landing() {
  useMeta(
    "Catalyst · Startup investing, built for your phone",
    "Catalyst is a mobile app for everyday Americans to discover early-stage startups. Coming soon, pending funding portal registration. Join the beta."
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
          <h1 className="reveal d1">Startup ownership <em>for everyone.</em></h1>
          <p className="lede reveal d2">Right from your phone.</p>
          <div className="ctas reveal d3">
            <a className="btn" href="#join" onClick={() => setRole("investor")}>Join the beta</a>
            <a className="btn ghost" href="#join" onClick={() => setRole("founder")}>Raise with Catalyst</a>
          </div>
          <p className="fine reveal d3" style={{ marginTop: 18 }}>Funding portal registration pending. No investments are available yet.</p>
        </div>
        <div className="phone tilt reveal d2">
          <div className="back"><img src="/redesign/app-detail.jpg" alt="" loading="lazy" /></div>
          <img src="/redesign/app-discover.jpg" alt="Catalyst app preview: browsing early-stage startups" />
          <p className="fine" style={{ position: "absolute", bottom: -52, left: 0, right: 0, textAlign: "center", margin: 0 }}>Illustrative preview. Sample profiles, not live offerings.</p>
        </div>
      </div>

      <section id="app" aria-labelledby="h-app">
        <div className="kick">Inside the app</div>
        <h2 id="h-app">Take a <em>look around.</em></h2>
        <p className="lede">Drag, swipe or use the arrows to flip through screens from the Catalyst app.</p>
        <Showcase screens={SCREENS} />
        <p className="fine" style={{ textAlign: "center" }}>Illustrative preview of an app in development. Sample profiles, not live offerings.</p>
      </section>

      <section aria-labelledby="h-why">
        <div className="kick">Why Catalyst</div>
        <p className="big" id="h-why">Venture ownership is one of America's greatest wealth generators. Yet only <b>320,000</b> people backed a startup last year, while <b>24.3M</b> qualify as accredited, and under Reg CF you don't even need to be.</p>
        <p className="lede" style={{ marginTop: 24 }}>Today's crowdfunding sites are clunky and hard to trust. We're building the one you'll actually open.</p>
      </section>

      <section id="how" aria-labelledby="h-how">
        <div className="kick">How it works</div>
        <h2 id="h-how">Simple by design. <em>Founder-first.</em></h2>
        <div className="three" style={{ marginTop: 32 }}>
          <div className="card"><span className="n">01</span><h3>Discover</h3><p>Browse a feed of early-stage startups that our team reviews before they appear. Each one is designed to be understood in a few minutes on your phone.</p></div>
          <div className="card"><span className="n">02</span><h3>Get to know them</h3><p>Every startup has one clear profile with a founder video, the problem they are solving, their traction so far, and the team behind it.</p></div>
          <div className="card"><span className="n">03</span><h3>Back what you believe in</h3><p>Once our funding portal registration is approved, you will be able to invest small amounts from your phone. Investing is not available yet.</p></div>
        </div>
      </section>

      <section id="compare" aria-labelledby="h-cmp">
        <div className="kick">How we compare</div>
        <h2 id="h-cmp">A different kind of <em>crowdfunding.</em></h2>
        <div className="cmp-wrap">
          <table className="cmp">
            <thead><tr><th scope="col"><span className="sr">Feature</span></th><th scope="col" className="us">Catalyst</th><th scope="col">Other platforms</th></tr></thead>
            <tbody>
              {CMP.map(([f, us, them]) => (
                <tr key={f}><th scope="row">{f}</th><td className="us">{us}</td><td>{them}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">Comparison reflects our product goals and publicly available information as of October 2026. Catalyst is in beta and does not offer investments yet. Wefunder, StartEngine and Republic are trademarks of their respective owners.</p>
      </section>

      <section aria-labelledby="h-f">
        <div className="split">
          <div className="phone reveal"><img src="/redesign/app-detail.jpg" alt="Catalyst app preview: a startup profile" /></div>
          <div>
            <div className="kick">For founders</div>
            <h2 id="h-f">Raise from your community, <em>and everyone else.</em></h2>
            <p className="lede">Turn your customers, fans and network into backers.</p>
            <ul className="check" style={{ margin: "20px 0 28px" }}>
              <li>Tell your story in a profile built for phones</li>
              <li>Bring your community in with one link</li>
            </ul>
            <a className="btn" href="#join" onClick={() => setRole("founder")}>Get early access</a>
          </div>
        </div>
      </section>

      <section id="community" aria-labelledby="proof">
        <div className="split split-teaser">
          <div>
            <div className="kick">Our growth engine</div>
            <h2 id="proof">Built on a real New York community.</h2>
            <p className="lede">A community of 28,000 people and 30+ founder and investor events across NYC.</p>
          </div>
          <div><Link className="btn ghost" to="/community">Explore the community</Link></div>
        </div>
      </section>

      <section id="join" aria-labelledby="h-join">
        <div className="join">
          <h2 id="h-join">Get in <em>early.</em></h2>
          <p>Which side of the table are you on?</p>
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
        <details><summary>Can I invest through Catalyst today?</summary><p>Not yet. Our funding portal registration is pending, and Catalyst does not offer or facilitate investments today.</p></details>
        <details><summary>Do I need to be accredited?</summary><p>Regulation Crowdfunding lets non-accredited investors participate, within annual limits. We'll share the details at launch.</p></details>
        <details><summary>Is startup investing risky?</summary><p>Yes. Most startups fail, and these investments are hard to sell. You could lose everything you put in.</p></details>
        <details><summary>Who's building Catalyst?</summary><p><a href="https://www.linkedin.com/in/rob-g-147206169/" target="_blank" rel="noopener noreferrer">Rob Guthy</a> (CEO) and <a href="https://www.linkedin.com/in/stephennmichael/" target="_blank" rel="noopener noreferrer">Stephen Michael</a> (co-founder). <Link to="/about">More about us</Link>.</p></details>
      </section>
    </Shell>
  );
}
