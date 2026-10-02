import { Link } from "react-router-dom";
import Shell, { CounselBanner, LUMA, useMeta } from "./Shell";

export function About() {
  useMeta("About · Catalyst");
  return (
    <Shell legal>
      <div className="kick">About</div>
      <h1 style={{ fontSize: 56 }}>Startup investing for everyone.</h1>
      <CounselBanner />
      <p className="lede">Catalyst started as Stephen Michael's New York community of founders, investors and operators. Thousands of people later, we're building the mobile app that lets everyday Americans discover and back early-stage startups.</p>
      <h2>Rob Guthy · CEO &amp; Founder</h2>
      <p>Former Army infantry officer. Built high-ticket sales and marketing for creators and coaches.</p>
      <h2>Stephen Michael · Co-founder, Community &amp; Partnerships</h2>
      <p>NYU finance, then finance and venture. Built the NYC community Catalyst grew out of. <a href="https://www.linkedin.com/in/stephennmichael">LinkedIn</a></p>
      <h2>Where we're headed</h2>
      <p>We want everyday Americans to be able to back the startups they believe in. That product is pending funding portal registration and is not available today.</p>
      <p><a className="btn" href="/#join">Join the waitlist</a></p>
    </Shell>
  );
}

export function Privacy() {
  useMeta("Privacy · Catalyst");
  return (
    <Shell legal>
      <div className="kick">Legal</div>
      <h1 style={{ fontSize: 56 }}>Privacy notice</h1>
      <CounselBanner />
      <h2>What we collect</h2><p>Name, email, startup or investor details you provide in signup forms, and event RSVPs via Luma.</p>
      <h2>How we use it</h2><p>To send event invites, make community introductions you ask for, and send product updates you opted into. We don't sell personal information.</p>
      <h2>Your choices</h2><p>Unsubscribe from any email, or ask us to delete your data at [contact email].</p>
      <h2>Contact</h2><p>[Company legal name], [postal address], [contact email]</p>
    </Shell>
  );
}

export function Terms() {
  useMeta("Terms · Catalyst");
  return (
    <Shell legal>
      <div className="kick">Legal</div>
      <h1 style={{ fontSize: 56 }}>Terms of use</h1>
      <CounselBanner />
      <h2>No securities offering</h2><p>Catalyst is not a registered broker-dealer or funding portal. Our registration is in process. Nothing on this site is an offer to sell or a solicitation to buy any security, and Catalyst does not facilitate investment transactions.</p>
      <h2>Introductions and events</h2><p>Introductions are provided for networking only. Catalyst does not vet, endorse or advise on any company or investor, and receives no transaction-based compensation.</p>
      <h2>Acceptable use</h2><p>[To be drafted by counsel.]</p>
      <h2>Contact</h2><p>[Company legal name], [postal address]</p>
    </Shell>
  );
}

export function RdNotFound() {
  useMeta("Not found · Catalyst");
  return (
    <Shell legal>
      <h1>Lost the room.</h1>
      <p><Link className="btn" to="/">Back home</Link></p>
    </Shell>
  );
}

export function Community() {
  useMeta("Community · Catalyst", "Catalyst's New York community: founder mixers, pitch nights and investor dinners. RSVP on Luma.");
  return (
    <Shell>
      <div className="hero">
        <div>
          <div className="kick reveal">Community · New York</div>
          <h1 className="reveal d1">Startups are built in <em>rooms.</em></h1>
          <p className="lede reveal d2">Mixers, pitch nights and founder dinners where founders, investors and operators actually meet. It's how Catalyst started, and it's the engine behind the app.</p>
          <div className="ctas reveal d3"><a className="btn" href={LUMA}>RSVP on Luma</a><a className="btn ghost" href="/#join">Join the app waitlist</a></div>
        </div>
        <aside className="card ticket reveal d3" aria-label="Recurring event">
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
      <section aria-labelledby="h-st">
        <h2 id="h-st" className="kick">The community so far</h2>
        <div className="stats">
          <div className="stat"><b>20k</b>people reached in 4 months<br /><small>Across events, socials and lists. Not app users.</small></div>
          <div className="stat"><b>30+</b>rooms hosted in NYC<br /><small>Mixers, pitch nights, founder dinners</small></div>
          <div className="stat"><b>$1.8M</b>raised by founders in our network<br /><small>From investors they met in our rooms. Catalyst did not raise, hold or route these funds.</small></div>
        </div>
      </section>
      <section aria-labelledby="h-live">
        <div className="kick">Live now</div>
        <h2 id="h-live">Rooms &amp; intros.</h2>
        <div className="three" style={{ marginTop: 28 }}>
          <div className="card"><h3>Mixers &amp; pitch nights</h3><p>Weekly NYC mixers and pitch nights.</p></div>
          <div className="card"><h3>Curated intros</h3><p>Founder–investor introductions based on stage and sector.</p></div>
          <div className="card"><h3>Spotlights</h3><p>Founder interviews and community spotlights.</p></div>
        </div>
      </section>
      <section aria-labelledby="h-past">
        <div className="kick">Past rooms</div>
        <h2 id="h-past">A few nights we've hosted.</h2>
        <div className="cols past" style={{ marginTop: 28 }}>
          <figure className="card"><img src="/redesign/past-investor-table.jpg" alt="The Investor Table event cover" loading="lazy" /><figcaption><h3>The Investor Table 2.0</h3><p>Past event. Founders and investors around one table.</p></figcaption></figure>
          <figure className="card"><img src="/redesign/past-highline.jpg" alt="Highline Walk event cover" loading="lazy" /><figcaption><h3>Funders x Founders: High Line Walk</h3><p>Past event. Founders and funders walking the High Line.</p></figcaption></figure>
        </div>
      </section>
      <section aria-labelledby="h-par">
        <div className="kick">Partners</div>
        <h2 id="h-par">Rooms we've built with.</h2>
        <div className="partners"><span>Wayo Club</span><span>The Tavern</span><span>a.cafe</span><span>JellyJelly</span></div>
      </section>
      <section aria-labelledby="h-rsvp">
        <div className="split">
          <div><h2 id="h-rsvp">Come to a <em>room.</em></h2><p className="lede">Every event lives on one calendar. RSVP on Luma, show up, meet the people building New York's next companies. Most are free; some special events may be ticketed.</p></div>
          <div><a className="btn" href={LUMA}>Open the event calendar</a><p className="fine">Events may be photographed. Tell the host if you'd rather not appear.</p></div>
        </div>
      </section>
    </Shell>
  );
}
