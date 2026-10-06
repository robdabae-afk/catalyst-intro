import { useEffect } from "react";
import { Icon, ICONS, type IconName } from "./icons";
import { Button, Chip, IconButton, InvestButton, RsvpButton, SwipeAction } from "./Button";
import "./brand.css";

const css = `.bs{font-family:'Schibsted Grotesk',system-ui,sans-serif;color:#0b0b0b;background:#fff;min-height:100dvh;padding:40px clamp(20px,5vw,72px) 80px;-webkit-font-smoothing:antialiased}
.bs h1{font-size:clamp(34px,6vw,64px);letter-spacing:-.045em;margin:0;line-height:.95;font-weight:800}
.bs h1 i{display:inline-block;width:.16em;height:.16em;background:#0b0b0b;margin-left:.04em}
.bs .k{font:500 11px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6b6b6b}
.bs section{border-top:1px solid #e4e4e2;padding:28px 0;display:grid;gap:18px}
.bs .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));border-left:1px solid #e4e4e2;border-top:1px solid #e4e4e2}
.bs .g div{border-right:1px solid #e4e4e2;border-bottom:1px solid #e4e4e2;aspect-ratio:1;display:grid;place-items:center;align-content:center;gap:10px}
.bs .g span{font:400 10px 'JetBrains Mono',monospace;color:#6b6b6b}
.bs .r{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.bs .sig{display:flex;gap:28px;align-items:center;flex-wrap:wrap}
.bs .sig svg{border:1px solid #e4e4e2}
.bs p{max-width:560px;margin:0;color:#444;line-height:1.5}`;

const groups: [string, IconName[]][] = [
  ["Tabs", ["swipe", "discover", "holdings", "events", "profile"]],
  ["Actions", ["inbox", "search", "filter", "save", "saved", "share", "back", "forward", "arrow", "close", "check", "plus", "upvote", "send", "pass", "invest", "play"]],
  ["Events + account", ["rsvp", "location", "ticket", "bell", "settings", "identity", "shield", "bank", "limit", "chart"]],
  ["Admin", ["dashboard", "members", "deals", "qa", "announce", "export", "edit", "delete", "publish", "draft", "waitlist"]],
  ["Sectors", ["food", "health", "climate", "software", "edu"]],
];

export default function BrandSheet() {
  useEffect(() => { document.title = "Catalyst brand"; }, []);
  const all = Object.keys(ICONS).length;
  return (
    <main className="bs">
      <style>{css}</style>
      <div className="k">Catalyst · brand system · internal</div>
      <h1 style={{ marginTop: 14 }}>Icons + buttons<i /></h1>
      <section>
        <div className="k">Signature</div>
        <p>Seeded from the swipe tab. 24 grid, 1.7 stroke, round ends, 2.5 radius. Card objects tilt −8°, like a card mid-swipe. Key icons carry one detached "tick", the swipe icon's side bar. Black on white only.</p>
        <div className="sig">{(["swipe", "holdings", "events", "discover", "bell"] as IconName[]).map((n) => <Icon key={n} name={n} size={72} />)}</div>
        <div className="r">{[16, 20, 24].map((s) => <span key={s} className="r" style={{ gap: 8 }}>{(["swipe", "discover", "holdings", "events", "profile"] as IconName[]).map((n) => <Icon key={n} name={n} size={s} />)}<span className="k">{s}px</span></span>)}</div>
      </section>
      {groups.map(([t, ns]) => (
        <section key={t}><div className="k">{t} · {ns.length}</div>
          <div className="g">{ns.map((n) => <div key={n}><Icon name={n} size={24} /><span>{n}</span></div>)}</div></section>
      ))}
      <section><div className="k">Buttons · default / disabled / loading</div>
        {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
          <div className="r" key={v}>
            <Button variant={v} icon={v === "danger" ? "delete" : v === "primary" ? "plus" : undefined}>{v === "danger" ? "Delete" : v[0].toUpperCase() + v.slice(1)}</Button>
            <Button variant={v} disabled>Disabled</Button>
            <Button variant={v} loading>Loading</Button>
            <Button variant={v} size="sm">Small</Button>
            <Button variant={v} size="lg">Large</Button>
          </div>
        ))}
      </section>
      <section><div className="k">CTAs</div>
        <div className="r"><InvestButton size="lg" /><InvestButton size="lg" loading /><RsvpButton size="lg" /><RsvpButton state="going" /><RsvpButton state="pending" /><RsvpButton state="waitlist" /><RsvpButton state="full" /></div>
      </section>
      <section><div className="k">Icon buttons · chips · swipe</div>
        <div className="r"><IconButton icon="back" label="Back" /><IconButton icon="search" label="Search" /><IconButton icon="share" label="Share" /><IconButton icon="inbox" label="Inbox" variant="ghost" /><IconButton icon="plus" label="Add" variant="primary" /><IconButton icon="close" label="Close" size="sm" /><IconButton icon="filter" label="Filter" disabled /></div>
        <div className="r"><Chip on>All</Chip><Chip icon="climate">Climate</Chip><Chip icon="software">Software</Chip><Chip icon="food">Food</Chip><Chip icon="location">NYC</Chip></div>
        <div className="r" style={{ gap: 16 }}><SwipeAction kind="pass" /><SwipeAction kind="info" /><SwipeAction kind="save" big /></div>
      </section>
      <div className="k">{all} icons · original drawings · no icon library</div>
    </main>
  );
}
