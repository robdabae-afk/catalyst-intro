import { Link } from "react-router-dom";
import EventGallery from "./EventGallery";
import Shell, { CounselBanner, LUMA, useMeta } from "./Shell";

export function About() {
  useMeta("About · Catalyst");
  return (
    <Shell legal>
      <div className="kick">About</div>
      <h1 style={{ fontSize: 56 }}>Startup investing for everyone.</h1>
      <h2>Our mission</h2>
      <p>Most Americans build wealth through a paycheck, a 401(k) and maybe a house. The biggest gains, owning a piece of a company early, have stayed with a small group of insiders. We want to close that wealth generation gap.</p>
      <p>We started by building rooms in New York where founders and investors actually meet. Now we're building the app that opens those rooms to everyone.</p>
      <h2>Where we're headed</h2>
      <p>We want everyday Americans to be able to back the startups they believe in. That product is pending funding portal registration and is not available today.</p>
      <p className="cta-gap"><a className="btn" href="/#join">Join the beta</a></p>
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
          <p className="lede reveal d2">Mixers, pitch nights and dinners where founders and investors actually meet.</p>
          <div className="ctas reveal d3"><a className="btn" href={LUMA}>RSVP on Luma</a><a className="btn ghost" href="/#join">Join the beta</a></div>
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
          <div className="stat"><b>28k</b>community members<br /><small>Not app users.</small></div>
          <div className="stat"><b>30+</b>rooms hosted in NYC<br /></div>
          <div className="stat"><b>$1.8M</b>raised by founders in our network<br /><small>Catalyst did not raise, hold or route these funds.</small></div>
        </div>
      </section>
      <section aria-labelledby="h-ev">
        <div className="kick">Events</div>
        <h2 id="h-ev">What we've <em>hosted.</em></h2>
        <p className="lede">Rooms where founders and investors meet in person, all across New York.</p>
        <EventGallery />
      </section>
      <div className="cta-end"><a className="btn ghost" href={LUMA}>See upcoming events on Luma</a></div>
    </Shell>
  );
}
