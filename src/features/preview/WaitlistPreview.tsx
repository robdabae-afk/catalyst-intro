import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, RotateCcw, Users, PanelsTopLeft } from "lucide-react";
import { HeroSignup } from "@/redesign/Landing";
import "../features.css";
import "./waitlist-preview.css";

function ConnectionMap() {
  const [animated, setAnimated] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const moving = animated && !reduced;
  return (
    <section className="wl-network" aria-label="Illustrative founder and investor connection map">
      <div className="wl-map" data-motion={moving ? "animated" : "static"}>
        <div className="wl-map-top mono"><span>One introduction. New possibilities.</span><span>Founders ↔ Investors</span></div>
        <svg key={replay} viewBox="0 0 600 365" role="img" aria-labelledby="network-title network-desc">
          <title id="network-title">Founders meet investors through Catalyst</title>
          <desc id="network-desc">An illustrative network connects founders, investors and communities through a central Catalyst node. It does not represent actual members or guaranteed introductions.</desc>
          <g className="wl-map-guides" stroke="currentColor" fill="none"><circle cx="300" cy="164" r="70"/><circle cx="300" cy="164" r="120"/></g>
          <g className="wl-lines" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path pathLength="1" d="M246 164H192Q180 164 180 152V83H132" />
            <path pathLength="1" d="M354 164H408Q420 164 420 152V83H468" />
            <path pathLength="1" d="M246 164H170Q156 164 156 178V254H108" />
            <path pathLength="1" d="M354 164H430Q444 164 444 178V254H492" />
            <path pathLength="1" d="M300 195V276" />
          </g>
          <g className="wl-node"><circle cx="300" cy="164" r="54" fill="white" stroke="currentColor" strokeWidth="1.5"/><circle className="wl-pulse" cx="300" cy="164" r="62" fill="none" stroke="currentColor"/><text x="300" y="169" textAnchor="middle" className="wl-node-center">catalyst</text></g>
          <g className="wl-nodes" fill="white" stroke="currentColor" strokeWidth="1.5">
            <circle cx="132" cy="83" r="7"/><circle cx="468" cy="83" r="7"/><circle cx="108" cy="254" r="5"/><circle cx="492" cy="254" r="5"/><circle cx="300" cy="276" r="5"/>
          </g>
          <g fill="currentColor" className="wl-map-labels">
            <text x="116" y="59" textAnchor="middle">FOUNDERS</text><text x="484" y="59" textAnchor="middle">INVESTORS</text>
            <text x="108" y="287" textAnchor="middle"><tspan x="108">Ideas &amp;</tspan><tspan x="108" dy="23">ambition</tspan></text><text x="492" y="287" textAnchor="middle"><tspan x="492">Capital &amp;</tspan><tspan x="492" dy="23">experience</tspan></text>
            <text x="300" y="346" textAnchor="middle">A shared community</text>
          </g>
          <g className="wl-map-details" fill="currentColor"><circle cx="217" cy="64" r="2"/><circle cx="384" cy="263" r="2"/><path d="M87 159h10m-5-5v10M501 151h10m-5-5v10" stroke="currentColor"/></g>
        </svg>
        <div className="wl-map-bottom"><span className="mono">Illustrative connection map</span><span>Better, together.</span></div>
      </div>
      <div className="wl-map-controls">
        <div className="wl-toggle" role="group" aria-label="Map animation">
          <button type="button" aria-pressed={moving} disabled={reduced} onClick={() => { setAnimated(true); setReplay(r => r + 1); }}>Animated</button>
          <button type="button" aria-pressed={!moving} onClick={() => setAnimated(false)}>Static</button>
        </div>
        <button type="button" className="wl-replay" disabled={!moving} onClick={() => setReplay(r => r + 1)}><RotateCcw size={14}/>Replay</button>
      </div>
    </section>
  );
}

/** Isolated concept. Reuses the production waitlist form without changing its submit flow. */
export default function WaitlistPreview({ mock = false }: { mock?: boolean }) {
  const [joining, setJoining] = useState(false);
  const cta = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const previous = document.title;
    document.title = "Early access preview · Catalyst";
    return () => { document.title = previous; };
  }, []);
  useEffect(() => { if (joining) heading.current?.focus(); }, [joining]);
  const back = () => {
    setJoining(false);
    requestAnimationFrame(() => cta.current?.focus());
  };
  return (
    <div className="cf wl-preview">
      <header className="wl-nav"><Link to="/" aria-label="Catalyst home" className="wl-logo"><i aria-hidden="true"/>catalyst</Link><span className="wl-concept mono">{mock ? "Interactive demo · No data collected" : "Early access · Concept preview"}</span></header>
      <main className="wl-stage">
        <div className="wl-editorial">
          <span className="wl-eyebrow mono">Good founders. Thoughtful investors.</span>
          <h1>Great things start<br className="wl-desktop-break"/> with the right intro.</h1>
          <p className="wl-description">A place for founders and investors to meet, exchange ideas, and move what matters forward.</p>
          <ConnectionMap />
        </div>
        <section className="wl-card" aria-labelledby="wl-heading">
          {joining && mock ? (
            <div className="wl-form-view">
              <span className="wl-eyebrow mono">Preview confirmation</span>
              <h2 id="wl-heading" tabIndex={-1} ref={heading}>You're on the list.</h2>
              <p className="wl-card-subhead">Your next great introduction starts here.</p>
              <p className="wl-fine">This is a mock confirmation. No information was collected, no account was created, and you have not joined the real waitlist.</p>
              <button type="button" className="btn wl-cta" onClick={back}>Back to the preview<ArrowLeft size={17}/></button>
            </div>
          ) : joining ? (
            <div className="wl-form-view">
              <button className="wl-back" type="button" onClick={back}><ArrowLeft size={16}/>Back</button>
              <span className="wl-eyebrow mono">Your first introduction</span>
              <h2 id="wl-heading" tabIndex={-1} ref={heading}>Let's get you<br/>on the list.</h2>
              <p className="wl-card-subhead">Tell us a little about yourself. Next, we'll help you create your account.</p>
              <HeroSignup />
              <p className="wl-fine">Joining the waitlist does not grant member access. Applications are reviewed.</p>
            </div>
          ) : (
            <div className="wl-intro">
              <div className="wl-card-top"><span className="mono">Catalyst early access</span><span className="wl-free">Free to join</span></div>
              <h2 id="wl-heading">Meet the people.<br/>Build what's next.</h2>
              <p className="wl-card-subhead">Join the waitlist for a more connected startup community.</p>
              <div className="wl-benefits">
                <div><span className="wl-glyph"><ArrowUpRight size={20}/></span><div><h3>Thoughtful introductions</h3><p>Find founders and investors around what you're building.</p></div></div>
                <div><span className="wl-glyph"><Users size={19}/></span><div><h3>A shared community</h3><p>Exchange ideas, build relationships, and keep the conversation going.</p></div></div>
                <div><span className="wl-glyph"><PanelsTopLeft size={19}/></span><div><h3>A wider view of startups</h3><p>Explore early-stage companies. Follow our journey toward Reg CF crowdfunding.</p></div></div>
              </div>
              <p className="wl-fine">In-app investing is not available. Funding portal registration is pending. Introductions and funding are not guaranteed.</p>
              <button ref={cta} className="btn wl-cta" type="button" onClick={() => setJoining(true)}>Join the waitlist<ArrowUpRight size={19}/></button>
              <Link className="wl-secondary" to="/auth">Already a member? Log in</Link>
              <p className="wl-card-note">Free to join. Applications reviewed for early access.</p>
            </div>
          )}
        </section>
      </main>
      <footer className="wl-footer"><span className="mono">Better introductions. New possibilities.</span><span>Catalyst · New York, NY</span></footer>
    </div>
  );
}
