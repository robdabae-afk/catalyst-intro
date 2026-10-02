import { Link } from "react-router-dom";
import Shell, { CounselBanner, useMeta } from "./Shell";

export function About() {
  useMeta("About · Catalyst");
  return (
    <Shell legal>
      <div className="kick">About</div>
      <h1 style={{ fontSize: 56 }}>We fill rooms.</h1>
      <CounselBanner />
      <p className="lede">Catalyst started as Stephen Michael's New York community of founders, investors and operators. Thousands of people later, we're turning those rooms into a product.</p>
      <h2>Rob Guthy · CEO &amp; Founder</h2>
      <p>Former Army infantry officer. Built high-ticket sales and marketing for creators and coaches.</p>
      <h2>Stephen Michael · Co-founder, Community &amp; Partnerships</h2>
      <p>NYU finance, then finance and venture. Built the NYC community Catalyst grew out of. <a href="https://www.linkedin.com/in/stephennmichael">LinkedIn</a></p>
      <h2>Where we're headed</h2>
      <p>We want everyday Americans to be able to back the startups they believe in. That product is pending funding portal registration and is not available today.</p>
      <p><a className="btn" href="/#join">Join the community</a></p>
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
