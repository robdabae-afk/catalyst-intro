import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import "./redesign.css";

export const LUMA = "https://luma.com/user/catalystceo";

export function useMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [title, description]);
}

export default function Shell({ children, legal = false }: { children: ReactNode; legal?: boolean }) {
  return (
    <div className="rd">
      <a className="skip" href="#main">Skip to content</a>
      <div className="status" role="note">
        <b>●</b> Live now: NYC rooms and founder–investor intros. In-app investing is <b>not available</b>. Funding portal registration is in process.
      </div>
      <div className="wrap">
        <header className="nav">
          <Link className="logo" to="/">catalyst<i>.</i></Link>
          <nav aria-label="Main">
            <ul>
              <li><a href="/#how">How it works</a></li>
              <li><a href="/#events">Events</a></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/auth">Log in</Link></li>
              <li><a className="btn sm" href="/#join">Join</a></li>
            </ul>
          </nav>
        </header>
      </div>
      <main id="main" className={legal ? "legal" : "wrap"}>{children}</main>
      <footer>
        <div className="wrap row">
          <span>© 2026 Catalyst · New York, NY</span>
          <span>
            <Link to="/about">About</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <a href={LUMA}>Events on Luma</a>
          </span>
          <span>Catalyst is not a broker-dealer or funding portal and does not offer securities.</span>
        </div>
      </footer>
    </div>
  );
}

export function CounselBanner() {
  return (
    <p className="banner">
      <strong>Placeholder for counsel review.</strong> This text is a draft and is not legally binding. Do not publish without attorney approval.
    </p>
  );
}
