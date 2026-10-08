import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Sparkles } from "lucide-react";
import { HeroSignup } from "@/redesign/Landing";
import "../features.css";
import "./waitlist-preview.css";

/** Isolated concept. Reuses the production waitlist form without changing its submit flow. */
export default function WaitlistPreview() {
  const [joining, setJoining] = useState(false);
  const cta = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Early access preview · Catalyst";
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    if (joining) heading.current?.focus();
  }, [joining]);

  const back = () => {
    setJoining(false);
    requestAnimationFrame(() => cta.current?.focus());
  };

  return (
    <div className="cf wl-preview">
      <header className="wl-nav">
        <a href="/" aria-label="Catalyst home" className="wl-logo"><i aria-hidden="true" />catalyst</a>
        <span className="wl-concept mono">Concept preview</span>
      </header>
      <main className="wl-stage">
        <div className="wl-art" aria-hidden="true">
          <div className="wl-orbit wl-orbit-outer" />
          <div className="wl-orbit wl-orbit-inner" />
          <div className="wl-spark wl-spark-one">✳</div>
          <div className="wl-spark wl-spark-two">✦</div>
          <div className="wl-confetti"><i /><i /><i /><i /><i /><i /></div>
          <div className="wl-note wl-note-top"><span className="wl-mini-avatar">hi</span><span>Your next great intro<small>Starts right here.</small></span><ArrowUpRight size={18} /></div>
          <div className="wl-mascot">
            <svg viewBox="0 0 340 360" fill="none">
              <ellipse cx="170" cy="337" rx="84" ry="9" fill="currentColor" opacity=".07" />
              <path d="M111 280L103 316L77 320M215 279L225 316L249 320" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M80 171C48 178 35 160 29 145M254 178C280 174 292 152 295 134" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
              <path d="M27 147L17 135M28 145L27 128M294 135L306 126M295 136L293 120" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
              <g transform="rotate(-9 170 173)">
                <rect x="79" y="48" width="182" height="239" rx="47" fill="white" stroke="currentColor" strokeWidth="4" />
                <path d="M80 225H260" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" />
                <rect x="102" y="69" width="136" height="25" rx="12.5" fill="currentColor" />
                <text x="170" y="86" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" letterSpacing="2">EARLY ACCESS</text>
                <g className="wl-eyes"><ellipse cx="139" cy="143" rx="9" ry="15" fill="currentColor" /><ellipse cx="200" cy="143" rx="9" ry="15" fill="currentColor" /><circle cx="142" cy="138" r="3" fill="white" /><circle cx="203" cy="138" r="3" fill="white" /></g>
                <path d="M148 175Q170 200 194 175" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="118" cy="170" rx="10" ry="5" fill="currentColor" opacity=".08" /><ellipse cx="219" cy="170" rx="10" ry="5" fill="currentColor" opacity=".08" />
                <path d="M111 250V266M119 250V266M126 250V266M139 250V266M146 250V266M155 250V266M162 250V266" stroke="currentColor" strokeWidth="3" />
                <path d="M205 245L209 253L218 254L211 260L213 269L205 264L197 269L199 260L192 254L201 253Z" fill="currentColor" />
              </g>
            </svg>
          </div>
          <div className="wl-note wl-note-bottom"><span className="wl-note-check"><Check size={17} /></span><span>Small world. Big possibilities.</span></div>
          <span className="wl-art-caption mono">A little hello. A lot of potential.</span>
        </div>
        <section className="wl-copy" aria-labelledby="wl-heading">
          {joining ? (
            <div className="wl-form-view">
              <button className="wl-back" type="button" onClick={back}><ArrowLeft size={16} />Back</button>
              <span className="wl-eyebrow mono">Your first introduction</span>
              <h1 id="wl-heading" tabIndex={-1} ref={heading}>Let's get you<br />on the list.</h1>
              <p className="wl-description">Tell us a little about yourself. Next, we'll help you create your account.</p>
              <HeroSignup />
              <p className="wl-fine">Joining the waitlist does not grant member access. Applications are reviewed.</p>
            </div>
          ) : (
            <div className="wl-intro">
              <span className="wl-eyebrow mono"><span className="wl-status-dot" />Good company awaits</span>
              <h1 id="wl-heading">Your next<br />big thing<br />starts here<span className="wl-period">.</span></h1>
              <p className="wl-description">Meet the founders and investors who could change what comes next.</p>
              <div className="wl-benefits"><span><Check size={15} />Real people</span><span><Check size={15} />Better intros</span><span><Check size={15} />New possibilities</span></div>
              <button ref={cta} className="btn wl-cta" type="button" onClick={() => setJoining(true)}>Join the waitlist<ArrowUpRight size={21} /></button>
              <p className="wl-no-charge"><Sparkles size={14} />Free to join. A little early. A lot to look forward to.</p>
              <p className="wl-fine">Early access is subject to review. In-app investing is not available.</p>
            </div>
          )}
        </section>
      </main>
      <footer className="wl-footer"><span>Made for meaningful connections.</span><span>New York, NY · Catalyst</span></footer>
    </div>
  );
}
