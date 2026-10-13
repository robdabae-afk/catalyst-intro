import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  Compass,
  BriefcaseBusiness,
  Users,
  BookOpen,
  ArrowLeft,
  Check,
  MessageCircle,
} from "lucide-react";
import { startups, lessons, money, type Startup } from "./data";
import "./future.css";

type Holding = { id: string; amount: number };
const initial: Holding[] = [
  { id: "common", amount: 250 },
  { id: "relay", amount: 500 },
];
const nav = [
  { to: "/", label: "Discover", Icon: Compass },
  { to: "/portfolio", label: "Portfolio", Icon: BriefcaseBusiness },
  { to: "/people", label: "Connect", Icon: Users },
  { to: "/learn", label: "Learn", Icon: BookOpen },
];
function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="fd-heading">
      <span className="fd-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children}
    </header>
  );
}
function Logo({ s }: { s: Startup }) {
  return (
    <span className="fd-mark" style={{ background: s.tone }}>
      {s.mark}
    </span>
  );
}
function Progress({ s }: { s: Startup }) {
  return (
    <>
      <div
        className="fd-progress"
        role="progressbar"
        aria-label={s.name + " funding progress"}
        aria-valuenow={s.raised}
        aria-valuemin={0}
        aria-valuemax={s.goal}
      >
        <span
          style={{ width: Math.min(100, (s.raised / s.goal) * 100) + "%" }}
        />
      </div>
      <div className="fd-between fd-small">
        <span>
          <strong>{money(s.raised)}</strong> raised
        </span>
        <span>of {money(s.goal)}</span>
      </div>
    </>
  );
}
function Discover() {
  const [category, setCategory] = useState("All");
  return (
    <>
      <Heading
        eyebrow="A stake in what comes next"
        title="Start small. Own a little of the future."
      >
        <p>
          Discover startups raising from everyday people.
          <br />
          Explore your first investment from $100.
        </p>
      </Heading>
      <div className="fd-filters" aria-label="Startup sectors">
        {["All", "Climate", "Consumer", "Health"].map((c) => (
          <button
            key={c}
            className={category === c ? "selected" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="fd-between fd-section">
        <h2>Open raises</h2>
        <span className="fd-small">Illustrative companies</span>
      </div>
      <div className="fd-grid">
        {startups
          .filter((s) => category === "All" || s.sector === category)
          .map((s, i) => (
            <Link className="fd-startup" key={s.id} to={"/startup/" + s.id}>
              <div className="fd-art" style={{ background: s.tone }}>
                <span className="fd-eyebrow">
                  {s.sector} / 0{i + 1}
                </span>
                <b>{s.mark}</b>
                <span className="fd-art-bottom">
                  Ideas worth getting behind.
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <div className="fd-card-body">
                <div className="fd-between">
                  <h2>{s.name}</h2>
                  <span className="fd-pill">{s.days} days left</span>
                </div>
                <p>{s.line}</p>
                <Progress s={s} />
                <div className="fd-terms">
                  <span>
                    Minimum<strong>$100</strong>
                  </span>
                  <span>
                    Valuation cap<strong>{money(s.cap)}</strong>
                  </span>
                </div>
              </div>
            </Link>
          ))}
      </div>
      <p className="fd-footnote">
        Startup investments are high risk and illiquid. You could lose your
        entire investment. All companies and numbers here are fictional.
      </p>
    </>
  );
}
function Detail() {
  const { id } = useParams();
  const s = startups.find((s) => s.id === id);
  const [tab, setTab] = useState("Overview");
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  if (!s) return <Missing />;
  return (
    <>
      <Link className="fd-back" to="/">
        <ArrowLeft size={16} />
        All startups
      </Link>
      <div className="fd-company">
        <Logo s={s} />
        <div>
          <span className="fd-eyebrow">{s.sector} / Open raise</span>
          <h1>{s.name}</h1>
        </div>
      </div>
      <p className="fd-lede">{s.line}</p>
      <div className="fd-panel">
        <Progress s={s} />
        <div className="fd-terms">
          <span>
            Investors<strong>{s.investors}</strong>
          </span>
          <span>
            Minimum<strong>$100</strong>
          </span>
          <span>
            Closes in<strong>{s.days} days</strong>
          </span>
        </div>
        <Link className="fd-button" to={"/invest/" + s.id}>
          Invest in {s.name}
          <ArrowUpRight size={18} />
        </Link>
        <p className="fd-small">
          Simulated Reg CF offering · SAFE · No real money
        </p>
      </div>
      <div className="fd-filters">
        {["Overview", "Terms & risks", "Q&A", "Updates"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" ? (
        <>
          <h2>The pitch</h2>
          <p className="fd-copy">{s.pitch}</p>
          <div className="fd-panel">
            <span className="fd-eyebrow">Traction</span>
            <h2>{s.traction}</h2>
            <p className="fd-small">
              Fictional operating metrics, not independently verified.
            </p>
          </div>
          <h2>Meet the team</h2>
          <p className="fd-copy">{s.team}</p>
        </>
      ) : tab === "Terms & risks" ? (
        <>
          <h2>The investment</h2>
          <dl className="fd-list">
            <div>
              <dt>Instrument</dt>
              <dd>SAFE</dd>
            </div>
            <div>
              <dt>Valuation cap</dt>
              <dd>{money(s.cap)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>20%</dd>
            </div>
            <div>
              <dt>Minimum investment</dt>
              <dd>$100</dd>
            </div>
          </dl>
          <h2>Understand the risks</h2>
          <p className="fd-copy">
            You could lose all your money. There is no ready resale market,
            returns are not guaranteed, and future rounds can dilute your
            ownership. A SAFE may never convert. Execution, competition and
            funding risks apply. Illustrative terms only; a real offering
            requires complete disclosures and eligibility checks.
          </p>
        </>
      ) : tab === "Updates" ? (
        <div className="fd-panel">
          <span className="fd-eyebrow">Founder update / October 2026</span>
          <h2>Building the next chapter</h2>
          <p className="fd-copy">{s.update}</p>
        </div>
      ) : (
        <>
          <div className="fd-panel">
            <h3>What will this round fund?</h3>
            <p className="fd-copy">
              Product development, pilot expansion and our next key hires.
            </p>
          </div>
          {questions.map((q, i) => (
            <div className="fd-panel" key={i}>
              <h3>{q}</h3>
              <p className="fd-small">
                Demo question added locally. Not sent to anyone.
              </p>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) {
                setQuestions((q) => [...q, question.trim()]);
                setQuestion("");
              }
            }}
          >
            <label htmlFor="question">Ask the founders</label>
            <input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know?"
              maxLength={500}
            />
            <button className="fd-button" disabled={!question.trim()}>
              Add demo question
            </button>
          </form>
        </>
      )}
    </>
  );
}
function Invest({ onInvest }: { onInvest: (h: Holding) => void }) {
  const { id } = useParams();
  const s = startups.find((s) => s.id === id);
  const navigate = useNavigate();
  const [amount, setAmount] = useState(100);
  const [step, setStep] = useState(0);
  const [risk, setRisk] = useState(false);
  const [payment, setPayment] = useState("bank");
  const [confirmed, setConfirmed] = useState(false);
  if (!s) return <Missing />;
  const valid =
    Number.isFinite(amount) &&
    amount >= 100 &&
    amount <= 10000 &&
    Number.isInteger(amount);
  return (
    <>
      <Link className="fd-back" to={"/startup/" + s.id}>
        <ArrowLeft size={16} />
        Back to {s.name}
      </Link>
      <Heading
        eyebrow={"Demo investment / Step " + (step + 1) + " of 4"}
        title={
          [
            "Make your first move.",
            "Know what you're backing.",
            "Choose a demo payment.",
            "You're part of the story.",
          ][step]
        }
      />
      <div className="fd-company">
        <Logo s={s} />
        <div>
          <h2>{s.name}</h2>
          <p className="fd-small">SAFE · {money(s.cap)} cap · 20% discount</p>
        </div>
      </div>
      {step === 0 ? (
        <>
          <label htmlFor="amount">Your investment amount</label>
          <div className="fd-amount">
            {money(Number.isFinite(amount) ? amount : 0)}
          </div>
          <div className="fd-filters">
            {[100, 250, 500, 1000].map((n) => (
              <button
                key={n}
                className={amount === n ? "selected" : ""}
                onClick={() => setAmount(n)}
              >
                {money(n)}
              </button>
            ))}
          </div>
          <input
            id="amount"
            type="number"
            min={100}
            max={10000}
            step={1}
            value={Number.isNaN(amount) ? "" : amount}
            onChange={(e) => setAmount(e.target.valueAsNumber)}
          />
          <p className="fd-small">
            Demo range $100 to $10,000, in whole dollars. No money moves.
          </p>
          <button
            className="fd-button"
            disabled={!valid}
            onClick={() => setStep(1)}
          >
            Review investment
            <ArrowUpRight size={18} />
          </button>
        </>
      ) : step === 1 ? (
        <>
          <dl className="fd-list">
            <div>
              <dt>Investment</dt>
              <dd>{money(amount)}</dd>
            </div>
            <div>
              <dt>Instrument</dt>
              <dd>SAFE</dd>
            </div>
            <div>
              <dt>Cap / discount</dt>
              <dd>{money(s.cap)} / 20%</dd>
            </div>
            <div>
              <dt>Demo fees</dt>
              <dd>$0</dd>
            </div>
          </dl>
          <p className="fd-copy">
            This SAFE is not shares today. Conversion and returns are not
            guaranteed. The cap is a conversion term, not a current valuation.
          </p>
          <label className="fd-check">
            <input
              type="checkbox"
              checked={risk}
              onChange={(e) => setRisk(e.target.checked)}
            />
            <span>
              I understand I could lose my entire investment, cannot expect to
              resell it, and may be diluted. This is a demo, not a real
              offering.
            </span>
          </label>
          <p className="fd-small">
            In a real offering, identity, investor limits, disclosures and
            cancellation rights would be reviewed before submission.
          </p>
          <button
            className="fd-button"
            disabled={!risk}
            onClick={() => setStep(2)}
          >
            Continue to demo payment
          </button>
          <button className="fd-text-button" onClick={() => setStep(0)}>
            Edit amount
          </button>
        </>
      ) : step === 2 ? (
        <>
          <p className="fd-copy">
            Use a fictional payment method. Please do not enter real banking or
            card information.
          </p>
          <fieldset>
            <legend>Demo payment method</legend>
            {[
              ["bank", "Demo checking", "•••• 4242"],
              ["card", "Demo debit card", "•••• 1234"],
            ].map(([key, label, last]) => (
              <label className="fd-payment" key={key}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === key}
                  onChange={() => setPayment(key)}
                />
                <span>
                  <strong>{label}</strong>
                  <small>{last} · Simulated only</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="fd-panel fd-between">
            <span>Demo total</span>
            <strong>{money(amount)}</strong>
          </div>
          <button
            className="fd-button"
            disabled={confirmed || !risk || !valid}
            onClick={() => {
              if (confirmed || !valid || !risk) return;
              setConfirmed(true);
              onInvest({ id: s.id, amount });
              setStep(3);
            }}
          >
            Confirm demo investment
          </button>
          <button className="fd-text-button" onClick={() => setStep(1)}>
            Back to review
          </button>
        </>
      ) : (
        <div className="fd-success">
          <span className="fd-success-icon">
            <Check size={32} />
          </span>
          <h2>
            {money(amount)} in {s.name}
          </h2>
          <p>
            Your simulated commitment is in your demo portfolio. No money was
            charged and no securities were purchased.
          </p>
          <button className="fd-button" onClick={() => navigate("/portfolio")}>
            View your portfolio
          </button>
          <Link className="fd-text-button" to="/">
            Keep discovering
          </Link>
        </div>
      )}
    </>
  );
}
function Portfolio({ holdings }: { holdings: Holding[] }) {
  return (
    <>
      <Heading eyebrow="Your piece of tomorrow" title="Portfolio">
        <p>Follow the companies you're backing.</p>
      </Heading>
      <div className="fd-balance">
        <span className="fd-eyebrow">Total demo commitments</span>
        <strong>{money(holdings.reduce((sum, h) => sum + h.amount, 0))}</strong>
        <span>{holdings.length} commitments · No market value implied</span>
      </div>
      <h2 className="fd-section">Your holdings</h2>
      {holdings.map((h, i) => {
        const s = startups.find((s) => s.id === h.id)!;
        return (
          <Link className="fd-holding" to={"/startup/" + s.id} key={i}>
            <Logo s={s} />
            <div>
              <h3>{s.name}</h3>
              <p className="fd-small">SAFE · Simulated commitment</p>
            </div>
            <strong>{money(h.amount)}</strong>
          </Link>
        );
      })}
      <h2 className="fd-section">From your founders</h2>
      {startups
        .filter((s) => holdings.some((h) => h.id === s.id))
        .map((s) => (
          <Link
            to={"/startup/" + s.id}
            className="fd-panel fd-update"
            key={s.id}
          >
            <span className="fd-eyebrow">{s.name} / October update</span>
            <h3>{s.update}</h3>
            <span className="fd-small">
              Read company profile <ArrowUpRight size={13} />
            </span>
          </Link>
        ))}
      <p className="fd-footnote">
        Commitments are illustrative, not actual holdings. No returns or
        liquidity are promised.
      </p>
    </>
  );
}
function Learn() {
  const [active, setActive] = useState(0);
  return (
    <>
      <Heading
        eyebrow="A little knowledge. A better start."
        title="Learn before you invest."
      >
        <p>Plain-language startup investing, one term at a time.</p>
      </Heading>
      <div className="fd-lesson">
        <span className="fd-eyebrow">Startup term of the day / 01</span>
        <h2>{lessons[active].term}</h2>
        <h3>{lessons[active].subtitle}</h3>
        <p>{lessons[active].text}</p>
        <Link className="fd-button" to="/">
          Explore demo startups
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <h2 className="fd-section">The essentials</h2>
      {lessons.map((l, i) => (
        <button
          className="fd-lesson-link"
          key={l.term}
          aria-pressed={active === i}
          onClick={() => setActive(i)}
        >
          <span>0{i + 1}</span>
          <div>
            <strong>{l.term}</strong>
            <p>{l.subtitle}</p>
          </div>
          <ArrowUpRight size={18} />
        </button>
      ))}
      <p className="fd-footnote">
        Educational illustrations, not investment advice.
      </p>
    </>
  );
}
function People() {
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState(false);
  const [inbox, setInbox] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    "Thanks for connecting! Happy to answer questions about our raise.",
  ]);
  const s = startups[index % startups.length];
  return (
    <>
      <Heading
        eyebrow="People behind the pitch"
        title={inbox ? "Your conversation." : "Find your next connection."}
      >
        <p>Meet founders. Ask questions. Build conviction.</p>
      </Heading>
      {inbox ? (
        <>
          <Link
            className="fd-back"
            to="/people"
            onClick={() => setInbox(false)}
          >
            <ArrowLeft size={16} />
            Back to connections
          </Link>
          <div className="fd-panel">
            <div className="fd-company">
              <Logo s={s} />
              <h2>{s.team.split(" · ")[0]}</h2>
            </div>
            <p className="fd-small">Founder at {s.name} · Demo conversation</p>
            {messages.map((m, i) => (
              <p className={"fd-message " + (i ? "outgoing" : "")} key={i}>
                {m}
              </p>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) {
                  setMessages((m) => [...m, draft.trim()]);
                  setDraft("");
                }
              }}
            >
              <label htmlFor="message">Message</label>
              <input
                id="message"
                value={draft}
                maxLength={1000}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about their next milestone"
              />
              <button className="fd-button" disabled={!draft.trim()}>
                Send demo message
              </button>
            </form>
          </div>
          <p className="fd-small">
            Local only. No message is delivered to a real person.
          </p>
        </>
      ) : (
        <>
          <div className="fd-person" style={{ background: s.tone }}>
            <span className="fd-eyebrow">Founder / Raising now</span>
            <span className="fd-person-initial">{s.team.charAt(0)}</span>
            <h2>{s.team.split(" · ")[0]}</h2>
            <p>Building {s.name}</p>
            <p>{s.line}</p>
            <span className="fd-pill">Open to everyday investors</span>
          </div>
          {matched ? (
            <div className="fd-panel" role="status">
              <h2>It's a demo match.</h2>
              <p className="fd-copy">
                You and {s.team.split(" ")[0]} connected. Start a conversation
                before exploring the raise.
              </p>
              <button className="fd-button" onClick={() => setInbox(true)}>
                <MessageCircle size={18} />
                Message founder
              </button>
            </div>
          ) : (
            <div className="fd-actions">
              <button
                className="fd-button fd-secondary"
                onClick={() => setIndex((i) => i + 1)}
              >
                Pass
              </button>
              <button className="fd-button" onClick={() => setMatched(true)}>
                Connect
              </button>
            </div>
          )}
          <Link className="fd-text-button" to={"/startup/" + s.id}>
            Explore {s.name}'s raise <ArrowUpRight size={16} />
          </Link>
        </>
      )}
    </>
  );
}
function Missing() {
  return (
    <>
      <Heading eyebrow="Demo" title="That page isn't here." />
      <Link className="fd-button" to="/">
        Discover startups
      </Link>
    </>
  );
}
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function FutureDemo() {
  const [holdings, setHoldings] = useState(initial);
  return (
    <BrowserRouter basename="/demo">
      <ScrollTop />
      <div className="fd">
        <div className="fd-disclaimer">
          Demo: illustrative future product, not an offer to sell securities.
        </div>
        <div className="fd-top">
          <Link to="/" className="fd-brand">
            catalyst<span> / tomorrow</span>
          </Link>
          <span className="fd-top-note">Startup investing, for everyone.</span>
        </div>
        <div className="fd-layout">
          <nav className="fd-nav" aria-label="Demo navigation">
            {nav.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === "/"}>
                <Icon size={21} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <main className="fd-main">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/startup/:id" element={<Detail />} />
              <Route
                path="/invest/:id"
                element={
                  <Invest onInvest={(h) => setHoldings((old) => [...old, h])} />
                }
              />
              <Route
                path="/portfolio"
                element={<Portfolio holdings={holdings} />}
              />
              <Route path="/people" element={<People />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="*" element={<Missing />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
