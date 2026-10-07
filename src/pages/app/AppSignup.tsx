import React from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

export default function AppSignup() {
  const navigate = useNavigate();

  const start = () => {
    // Carry prefill (role/name/email/from) and referral through to the form.
    const src = new URLSearchParams(location.search);
    const q = new URLSearchParams();
    for (const k of ["role", "name", "email", "from"]) { const v = src.get(k); if (v) q.set(k, v); }
    let r = src.get("ref");
    try { r = r || localStorage.getItem("catalyst.ref"); } catch { /* private mode */ }
    if (r) q.set("ref", r);
    const qs = q.toString();
    navigate(qs ? `/signup/form?${qs}` : "/signup/form");
  };

  return (
    <div className="su">
      <div className="su-card su-intro">
        <div className="su-logo">Catalyst</div>
        <div className="su-mono" style={{ marginTop: 36, marginBottom: 12 }}>Startup investing, on your phone</div>
        <h1>Back the next unicorn before anyone else.</h1>
        <p>Discover early-stage startups and the founders behind them.</p>
        <div className="su-shot"><img src="/redesign/app-discover.jpg" alt="Catalyst app preview" /></div>
        <button type="button" className="su-btn" onClick={start}>
          Join beta now
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3.75 9H14.25M14.25 9L10.125 4.875M14.25 9L10.125 13.125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="su-link" onClick={() => navigate("/auth")}>I already have an account</button>
      </div>
    </div>
  );
}
