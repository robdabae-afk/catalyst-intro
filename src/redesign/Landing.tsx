import { FormEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Showcase from "./Showcase";
import Shell, { LUMA, useMeta } from "./Shell";

type Role = "founder" | "investor";

function HeroSignup() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("investor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending">("idle");
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), consent: useRef<HTMLInputElement>(null) };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (!name.trim()) n.name = "Add your name.";
    if (!email.trim()) n.email = "Add your email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) n.email = "Enter a valid email.";
    if (!consent) n.consent = "Please agree to continue.";
    setErrs(n);
    const first = (["name", "email", "consent"] as const).find((k) => n[k]);
    if (first) return refs[first].current?.focus();
    setState("sending");
    const { error } = await supabase
      .from("waitlist_signups")
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), user_type: role });
    // 23505 = email already on the list; treat as success.
    if (error && error.code !== "23505") {
      setState("idle");
      setErrs({ form: "Something went wrong. Please try again." });
      return;
    }
    // Go straight to full account creation, prefilled. Keep any referral code.
    const q = new URLSearchParams({ role, name: name.trim(), email: email.trim() });
    let ref = new URLSearchParams(window.location.search).get("ref");
    try { ref = ref || localStorage.getItem("catalyst.ref"); } catch { /* private mode */ }
    if (ref) q.set("ref", ref);
    navigate(`/signup/form?${q}`);
  };

  return (
    <form id="signup" className="hs reveal d3" noValidate onSubmit={submit} aria-label="Join Catalyst">
      <div className="hs-roles" role="radiogroup" aria-label="I am a">
        {(["founder", "investor"] as Role[]).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}>
            {r === "founder" ? "Founder" : "Investor"}
          </button>
        ))}
      </div>
      <div className="hs-row">
        <div>
        <label className="sr" htmlFor="hs-name">Full name</label>
        <input id="hs-name" name="name" ref={refs.name} placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errs.name} />
        {errs.name && <div className="err" aria-live="polite">{errs.name}</div>}
      </div>
        <div>
        <label className="sr" htmlFor="hs-email">Email</label>
        <input id="hs-email" name="email" inputMode="email" ref={refs.email} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errs.email} />
        {errs.email && <div className="err" aria-live="polite">{errs.email}</div>}
      </div>
      </div>
      <label className="consent">
        <input type="checkbox" ref={refs.consent} checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errs.consent} />
        <span>Email me Catalyst updates. Not an offer of securities. <Link to="/privacy">Privacy</Link></span>
      </label>
      {(errs.consent || errs.form) && <div className="err" aria-live="polite">{errs.consent || errs.form}</div>}
      <button className="btn" type="submit" disabled={state === "sending"}>{state === "sending" ? "Joining..." : "Join"}</button>
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

export default function Landing() {
  useMeta(
    "Catalyst · Startup investing, built for your phone",
    "Catalyst is a mobile app for everyday Americans to discover early-stage startups. Coming soon, pending funding portal registration. Join the beta."
  );
  return (
    <Shell>
      <div className="hero">
        <div>
          <h1 className="reveal d1">Startup ownership <em>for everyone.</em></h1>
          <p className="lede reveal d2">Right from your phone.</p>
          <HeroSignup />
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
            <a className="btn" href="#signup">Get early access</a>
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
          
        </div>
      </section>

      <section id="join" aria-labelledby="h-join">
        <div className="join">
          <h2 id="h-join">Get in <em>early.</em></h2>
          <p>Founders and investors, join the list in ten seconds.</p>
          <a className="btn" href="#signup" style={{ marginTop: 8 }}>Join</a>
          <p className="fine" style={{ marginTop: 20 }}>Already a member? <Link to="/auth" style={{ color: "var(--ink)" }}>Log in</Link>.</p>
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
