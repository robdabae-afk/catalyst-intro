import { useState } from "react";
import { Head } from "../FeaturesApp";
import { IGift } from "../icons";
import { useToast } from "../store";
import { Toast } from "../parts";

const TIERS = [
  { n: 1, t: "Waitlist priority", d: "Move ahead in line for early access." },
  { n: 3, t: "Founding member tag", d: "A badge on your profile." },
  { n: 5, t: "Priority event RSVP", d: "First dibs on Pitch Night seats." },
  { n: 10, t: "Founders' dinner invite", d: "Small-room dinner with the team." },
];

export default function Invite() {
  const [joined] = useState(2); // sample
  const t = useToast();
  const link = "catalystintro.com/i/sample-you";
  const copy = async () => { try { await navigator.clipboard.writeText(`https://${link}`); t.show("Link copied"); } catch { t.show("Copy failed. Long-press to copy."); } };
  const share = async () => {
    const data = { title: "Catalyst", text: "Join me on Catalyst. Startup investing for everyone, opening soon.", url: `https://${link}` };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } } else copy();
  };
  const next = TIERS.find((x) => x.n > joined);

  return (
    <div className="g-side">
      <div>
        <Head title="Invite friends" back />
        <div className="card" style={{ padding: 20 }}>
          <div className="row"><IGift size={34} /><div className="grow"><b style={{ fontSize: 22, fontFamily: "'JetBrains Mono',monospace" }}>{joined}</b> <span className="dim">friends joined</span></div><span className="sample">Sample</span></div>
          <div className="ladder" aria-hidden>{TIERS.map((x) => <div key={x.n} className={joined >= x.n ? "on" : ""} />)}</div>
          <p style={{ fontSize: 13.5, marginTop: 12 }}>{next ? <><b>{next.n - joined} more</b> to unlock {next.t.toLowerCase()}.</> : "Every perk unlocked."}</p>
          <div className="link" style={{ marginTop: 18 }}><span className="grow ell">{link}</span><button className="btn sm" onClick={copy}>Copy</button></div>
          <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} onClick={share}>Share invite</button>
        </div>
        <p className="note" style={{ marginTop: 14 }}>Perks are community access only. No cash, credits, or securities are given for referrals, and inviting someone isn't investment advice.</p>
      </div>
      <aside>
        <div className="sec" style={{ marginTop: 22 }}><h2>Early member perks</h2></div>
        {TIERS.map((x) => (
          <div key={x.n} className={`perk${joined >= x.n ? "" : " lock"}`}>
            <span className="tick">{joined >= x.n ? "✓" : ""}</span>
            <div className="grow"><b>{x.t}</b><div className="dim" style={{ fontSize: 13 }}>{x.d}</div></div>
            <span className="mono">{x.n}</span>
          </div>
        ))}
      </aside>
      <Toast msg={t.msg} />
    </div>
  );
}
