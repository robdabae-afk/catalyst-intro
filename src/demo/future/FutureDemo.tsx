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
  ArrowLeft,
  Check,
} from "lucide-react";
import { startups, money, type Startup } from "./data";
import "./future.css";

type Holding = { id: string; amount: number };
const initial: Holding[] = [
  { id: "common", amount: 250 },
  { id: "relay", amount: 500 },
];
const nav = [
  { to: "/", label: "Discover", Icon: Compass },
  { to: "/portfolio", label: "Portfolio", Icon: BriefcaseBusiness },
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
  return (
    <>
      <Heading
        eyebrow="Startup investing, for everyone"
        title="Pick a startup. Send the check."
      >
        <p>
          Read the public disclosures. Invest from $100.
          <br />
          No introductions. No calls. Just your decision.
        </p>
      </Heading>
      <div className="fd-between fd-section">
        <h2>Startups raising</h2>
        <span className="fd-small">Fictional offerings</span>
      </div>
      <div className="fd-grid">
        {startups.map((s) => (
          <Link
            className="fd-startup fd-simple-card"
            key={s.id}
            to={"/startup/" + s.id}
          >
            <div className="fd-card-body">
              <div className="fd-company">
                <Logo s={s} />
                <div>
                  <h2>{s.name}</h2>
                  <span className="fd-small">{s.sector}</span>
                </div>
                <ArrowUpRight size={20} />
              </div>
              <p>{s.line}</p>
              <Progress s={s} />
              <div className="fd-terms">
                <span>
                  Minimum<strong>$100</strong>
                </span>
                <span>
                  SAFE cap<strong>{money(s.cap)}</strong>
                </span>
                <span>
                  Deadline<strong>{s.deadlineShort}</strong>
                </span>
              </div>
              <span className="fd-profile-link">
                View disclosures <ArrowUpRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <p className="fd-footnote">
        Fictional companies and financials. Startup investments are high risk
        and illiquid. You could lose your entire investment.
      </p>
    </>
  );
}
function Disclosure({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="fd-disclosure" open={open}>
      <summary>{title}</summary>
      <div className="fd-disclosure-body">{children}</div>
    </details>
  );
}
function Detail() {
  const { id } = useParams();
  const s = startups.find((s) => s.id === id);
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
          <span className="fd-eyebrow">Public offering disclosures / Demo</span>
          <h1>{s.name}</h1>
        </div>
      </div>
      <p className="fd-lede">{s.line}</p>
      <div className="fd-panel">
        <Progress s={s} />
        <div className="fd-terms">
          <span>
            Target<strong>{money(s.target)}</strong>
          </span>
          <span>
            Maximum<strong>{money(s.goal)}</strong>
          </span>
          <span>
            Minimum<strong>$100</strong>
          </span>
        </div>
        <Link className="fd-button" to={"/invest/" + s.id}>
          Invest from $100
          <ArrowUpRight size={18} />
        </Link>
        <p className="fd-small">
          SAFE · {money(s.cap)} cap · 20% discount · No real money
        </p>
      </div>
      <div className="fd-between fd-section">
        <h2>The disclosures</h2>
        <span className="fd-small">Form C-style illustration</span>
      </div>
      <p className="fd-small">
        This fictional summary is not a filed Form C or a complete legal
        offering. No SEC or intermediary approval is represented.
      </p>
      <Disclosure title="Company & business" open>
        <p>{s.pitch}</p>
        <dl className="fd-list">
          <div>
            <dt>Legal name</dt>
            <dd>{s.name} Inc.</dd>
          </div>
          <div>
            <dt>Entity / formation</dt>
            <dd>Delaware C-corp · 2024</dd>
          </div>
          <div>
            <dt>Principal office</dt>
            <dd>{s.address}</dd>
          </div>
          <div>
            <dt>Website</dt>
            <dd>{s.id}.example</dd>
          </div>
          <div>
            <dt>Employees</dt>
            <dd>{s.employees}</dd>
          </div>
        </dl>
      </Disclosure>
      <Disclosure title="Team, officers & ownership">
        <p>{s.team}</p>
        <p>{s.teamExperience}</p>
        <p>
          Directors are the two listed founders. They hold 60% and 30% of voting
          equity, respectively. Each is a beneficial owner above 20%.
        </p>
      </Disclosure>
      <Disclosure title="Offering terms & deadline">
        <dl className="fd-list">
          <div>
            <dt>Security / price</dt>
            <dd>SAFE · $1 per $1 committed</dd>
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
            <dt>Target / maximum</dt>
            <dd>
              {money(s.target)} / {money(s.goal)}
            </dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{s.deadline}</dd>
          </div>
          <div>
            <dt>Minimum</dt>
            <dd>$100</dd>
          </div>
        </dl>
        <p>
          The SAFE may convert on a qualifying future equity financing at the
          lower of the cap-based or discounted price. It has no interest or
          maturity date. The cap is a conversion term, not a current valuation.
          Conversion is not guaranteed.
        </p>
        <p>
          Commitments above the target are accepted up to the maximum, allocated
          first come, first served. If the target is not met by the deadline,
          commitments are cancelled and funds returned. No securities are issued
          before closing.
        </p>
        <p>
          Investors may cancel until 48 hours before the offering deadline.
          Material changes require reconfirmation; without it, the commitment is
          cancelled and funds returned. An early close would require applicable
          advance notice.
        </p>
      </Disclosure>
      <Disclosure title="Use of proceeds">
        <p>
          At the target, proceeds support {s.use}. At the maximum, the same
          allocation funds a longer operating runway and expanded operations.
        </p>
        <dl className="fd-list">
          <div>
            <dt>Product & development</dt>
            <dd>50%</dd>
          </div>
          <div>
            <dt>Operations & hiring</dt>
            <dd>30%</dd>
          </div>
          <div>
            <dt>Offering & legal costs</dt>
            <dd>10%</dd>
          </div>
          <div>
            <dt>Working capital</dt>
            <dd>10%</dd>
          </div>
        </dl>
      </Disclosure>
      <Disclosure title="Financials & financial condition">
        <p>
          Selected fictional year-end figures, USD. Illustrative only; no
          accountant has reviewed or audited these figures. A real offering
          includes required financial statements and the appropriate
          certification, review or audit.
        </p>
        <div className="fd-table-wrap">
          <table className="fd-financials">
            <caption>Fiscal years ended December 31</caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">2025</th>
                <th scope="col">2024</th>
              </tr>
            </thead>
            <tbody>
              {s.financials.map(([label, current, prior]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{money(Number(current))}</td>
                  <td>{money(Number(prior))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The company is loss-making and relies on new capital. Existing cash
          supports approximately six months of operations at current spending. A
          failed raise could force a reduction or cessation of operations.
        </p>
      </Disclosure>
      <Disclosure title="Risks">
        <p>
          You could lose your entire investment. Securities are illiquid and
          subject to transfer restrictions. There is no public market or
          guaranteed return. Future issuances may dilute your ownership; you
          have no ordinary voting rights under this SAFE.
        </p>
        <p>{s.risk}</p>
        <p>
          The company depends on its founders, continued financing and execution
          of an unproven business model. Minority investors cannot control
          corporate actions, related-party decisions, or a sale. A SAFE may
          never convert, and a sale or dissolution may produce no payout.
        </p>
      </Disclosure>
      <Disclosure title="Capital structure & prior financing">
        <p>
          10,000,000 authorized common shares; 1,000,000 issued and outstanding.
          Founders hold 900,000 voting shares and early employees hold 100,000.
          No preferred shares are outstanding. Common shares have one vote per
          share; this SAFE does not confer current voting rights.
        </p>
        <p>
          Prior financing consists of $150,000 of SAFEs issued in 2025 at a $4
          million cap. These and this offering may convert and dilute each other
          and common stock. Valuation and conversion depend on the SAFE terms
          and future financing. No repurchase or resale facility is promised.
        </p>
        <p>
          Debt consists of a $25,000 unsecured working-capital loan at 8%
          interest, due December 2027. No material related-party transactions
          are assumed in this fictional illustration.
        </p>
      </Disclosure>
      <Disclosure title="Intermediary, reporting & other disclosures">
        <p>
          Catalyst is presented here solely as an illustrative future funding
          portal. No actual registration number or SEC approval is claimed.
          Fictional issuer offering costs include a 5% intermediary cash fee at
          closing and no intermediary equity compensation.
        </p>
        <p>
          No prior Reg CF offerings, disqualifying events or reporting failures
          are assumed. No testing-the-waters materials are included. In a real
          offering, the issuer files annual reports and makes them available on
          its website, subject to applicable reporting termination rules.
        </p>
      </Disclosure>
      <Disclosure title="Most asked by investors">
        <h3>What happens if the target isn't reached?</h3>
        <p>
          Commitments are cancelled and funds are returned. The company must
          meet the disclosed target before closing.
        </p>
        <h3>Am I buying shares today?</h3>
        <p>
          No. This offering uses a SAFE, which may convert into equity later
          under its terms. A return or conversion is not guaranteed.
        </p>
        <span className="fd-small">
          Founder-published answers. No open messaging.
        </span>
      </Disclosure>
      <Link className="fd-button" to={"/invest/" + s.id}>
        Invest in {s.name}
        <ArrowUpRight size={18} />
      </Link>
      <p className="fd-footnote">
        All company details, disclosures and financials are fictional. This demo
        is not an offer to sell securities.
      </p>
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
            "Send the check.",
            "Review your investment.",
            "Pay. You're almost done.",
            "Check sent.",
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
            Send demo check
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
      <Heading eyebrow="Your demo portfolio" title="Your investments.">
        <p>What you've invested in. Nothing more.</p>
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
      <p className="fd-footnote">
        Commitments are illustrative, not actual holdings. No returns or
        liquidity are promised.
      </p>
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
              <Route path="*" element={<Missing />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
