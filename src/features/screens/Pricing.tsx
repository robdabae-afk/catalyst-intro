import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBilling } from "@/hooks/useBilling";
import { billingRpc, FREE, payments, PRO_DISPLAY_PRICE, type Product } from "@/lib/billing";
import { Head } from "../FeaturesApp";
import "./pricing.css";

const benefits = ["Unlimited right swipes", "See who liked you", "Filter by check size, stage and sector", "One 24-hour profile boost every week", "Profile view stats", "One instant message each month", "20% off concierge matches"];
export function SwipeLimit({ resetsAt }: { resetsAt?: string }) {
 return <section className="card price-limit" role="status"><span className="mono">A fresh start tomorrow</span><h2>Five good first moves.</h2><p className="dim">You’ve used today’s free right swipes. Keep exploring, or go Pro to connect without the daily limit.</p><Link className="btn" to="/pricing">Explore Pro</Link><p className="note">{resetsAt ? "Your swipes reset " + new Date(resetsAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" }) + "." : "Free swipes reset at midnight UTC."}</p></section>;
}
export default function Pricing({ preview = false }: { preview?: boolean }) {
 const billing = useBilling();
 const [demo, setDemo] = useState<"free"|"pro"|"limit">("free");
 const [busy, setBusy] = useState<string|null>(null);
 const [notice, setNotice] = useState("");
 const [params] = useSearchParams();
 const ent = preview ? { ...FREE, isPro: demo === "pro", credits: demo === "pro" ? 1 : 0, canBoost: demo === "pro", views: demo === "pro" ? 24 : null } : billing.entitlement;
 const buy = async (sku: Product) => {
  if (preview) { setNotice("Preview only. Checkout will use Stripe test mode once the prices and keys are configured."); return; }
  if (!billing.uid) { setNotice("Sign in to purchase a plan or a pack."); return; }
  setBusy(sku); setNotice("");
  try { await payments.checkout(sku); } catch(e) { setNotice(e instanceof Error ? e.message : "Checkout unavailable"); } finally { setBusy(null); }
 };
 const action = async (kind: "boost"|"manage") => {
  if (preview) { setNotice(kind === "boost" ? "Preview boost activated. Your profile moves higher for 24 hours." : "Preview only. Billing management opens in Stripe."); return; }
  setBusy(kind); setNotice("");
  try { if (kind === "boost") { await billingRpc("billing_use_boost"); await billing.refresh(); setNotice("Your profile is boosted for the next 24 hours."); } else await payments.manage(); } catch(e) { setNotice(e instanceof Error ? e.message : "Unavailable"); } finally { setBusy(null); }
 };
 const discount = ent.isPro;
 return <div className="pricing">
  {preview && <div className="price-preview"><span className="mono">Interactive preview · no payments</span><div role="group" aria-label="Preview account state">{(["free","pro","limit"] as const).map(x=><button key={x} className={"chip"+(demo===x?" on":"")} onClick={()=>{setDemo(x);setNotice("");}}>{x === "limit" ? "Swipe limit" : x === "pro" ? "Pro member" : "Free member"}</button>)}</div></div>}
  <Head title="Make the right introduction." />
  <p className="price-intro dim">More ways to meet the people who can move things forward. For founders and investors.</p>
  {!preview && params.get("checkout")==="success" && <p className="price-notice" role="status">Checkout returned successfully. Your purchase appears here after payment confirmation; this page never grants access from a URL.</p>}
  {!preview && params.get("checkout")==="cancelled" && <p className="price-notice">Checkout cancelled. You haven’t been charged.</p>}
  {notice && <p className="price-notice" role="status">{notice}</p>}
  {!preview && billing.isError && <p role="alert" className="price-notice">Billing is not connected yet. Purchases and usage can’t be verified.</p>}
  {preview && demo === "limit" && <SwipeLimit />}
  <div className="price-plans">
   <section className="card price-plan"><span className="mono">Start here</span><h2>Free</h2><div className="price-number">$0<span> / always</span></div><p className="dim">Find your people, one considered connection at a time.</p><div className="price-benefits"><p>5 right swipes each day</p><p>Browse approved profiles</p><p>Chat with your connections</p><p>Purchase a pack when you need it</p></div><Link to={preview?"/preview/pricing":"/people/swipe"} className="btn ghost">{ent.isPro ? "Browse profiles" : "Your starting point"}</Link></section>
   <section className="card price-plan price-pro"><div className="row"><span className="mono">Catalyst Pro</span><span className="sample">{ent.isPro ? "YOUR PLAN" : "MORE POSSIBILITIES"}</span></div><h2>Build momentum.</h2><div className="price-number">${PRO_DISPLAY_PRICE}<span> / month</span></div><p className="dim">Less waiting. More useful introductions.</p><div className="price-benefits">{benefits.map(b=><p key={b}>{b}</p>)}</div><button className="btn" disabled={!!busy || (!preview && billing.loading)} onClick={()=>void (ent.isPro?action("manage"):buy("pro"))}>{busy === "pro" ? "Opening checkout…" : ent.isPro ? "Manage subscription" : "Get Pro"}</button><p className="note">Monthly subscription. Cancel in billing settings. $29 is a draft price until confirmed.</p></section>
  </div>
  {ent.isPro && <section className="price-member card"><div><span className="mono">Your Pro tools</span><h2>{ent.views ?? 0} profile views</h2><p className="note">Last 30 days · one view per member per day</p></div><div><p>{ent.credits} instant message {ent.credits===1?"credit":"credits"}</p><div className="row"><Link className="btn ghost sm" to={preview?"/preview/pricing":"/pro/likes"}>See your likes</Link><button className="btn sm" disabled={!!busy || !ent.canBoost} onClick={()=>void action("boost")}>{ent.canBoost ? "Use weekly boost" : "Boost used this week"}</button></div></div></section>}
  <div className="sec"><h2>A personal introduction.</h2><span className="mono">Concierge</span></div><p className="dim">Our team finds a fit and connects you. These are introductions, not investment guarantees.</p>
  <div className="price-packs">
   <Pack title="One investor match" detail="For founders. One hand-selected investor introduction." amount={discount?36:45} original={discount?45:undefined} label="Request one match" disabled={!!busy} onClick={()=>void buy("concierge_one")} />
   <Pack title="Two curated matches" detail="For founders and investors. Two introductions selected by our team." amount={discount?44:55} original={discount?55:undefined} label="Request two matches" disabled={!!busy} onClick={()=>void buy("concierge_two")} />
  </div>
  <div className="sec"><h2>Skip the waiting.</h2><span className="mono">Instant messages</span></div><p className="dim">Use a credit to connect immediately and send your opening message into their inbox.</p>
  <div className="price-packs">
   <Pack title="3 instant messages" detail="Three chances to start the conversation." amount={25} label="Get 3 messages" disabled={!!busy} onClick={()=>void buy("messages_three")} />
   <Pack title="6 instant messages" detail="More introductions, with room to follow your instinct." amount={35} label="Get 6 messages" disabled={!!busy} onClick={()=>void buy("messages_six")} />
  </div>
  <p className="price-footer note">Test-mode build. No live payments are enabled. Packs are one-time purchases. Right swipes share one daily allowance across people and companies, resetting at midnight UTC. Passes don’t use your allowance. Concierge discounts apply automatically for active Pro members.</p>
 </div>;
}
function Pack({title,detail,amount,original,label,disabled,onClick}:{title:string;detail:string;amount:number;original?:number;label:string;disabled:boolean;onClick:()=>void}) {
 return <section className="card price-pack"><h3>{title}</h3><p className="dim">{detail}</p><div className="price-number">${amount}{original && <del>${original}</del>}<span> / one time</span></div>{original && <p className="note">Your 20% Pro discount</p>}<button className="btn ghost" disabled={disabled} onClick={onClick}>{label}</button></section>;
}
