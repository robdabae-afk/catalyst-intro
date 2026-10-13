import Stripe from "npm:stripe@22.2.0";
import { isBillingInterval, proPriceConfig, isSku, PRODUCTS } from "../_shared/billing-catalog.ts";
import { services, json, check, assertMode } from "../_shared/billing.ts";
Deno.serve(async (req) => {
 if (req.method !== "POST") return json({ error: "POST required" }, 405);
 const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET_V2");
 if (!secret) return json({ error: "Webhook not configured" }, 503);
 let svc; try { svc = services(); } catch { return json({ error: "Stripe V2 configuration required" }, 503); }
 const { stripe, db, live } = svc;
 let event: Stripe.Event;
 try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", secret, undefined, Stripe.createSubtleCryptoProvider()); }
 catch { return json({ error: "Invalid signature" }, 400); }
 if (event.livemode !== live) return json({ error: "Stripe event mode mismatch" }, 400);
 try {
  const object = event.data.object;
  assertMode(object as {livemode:boolean}, live);
  if(event.type === "checkout.session.expired") {
   const session=object as Stripe.Checkout.Session;
   if(session.metadata?.billing_version==="1") {
    const {error}=await db.from("billing_orders").update({status:"expired"}).eq("stripe_session_id",session.id).eq("status","pending");check(error);
   }
   return json({received:true});
  }
  if(event.type==="charge.refunded" || event.type==="refund.updated") {
   const chargeRef=event.type==="charge.refunded"?(object as Stripe.Charge).id:(object as Stripe.Refund).charge;
   const chargeId=typeof chargeRef==="string"?chargeRef:chargeRef?.id;
   if(!chargeId) throw new Error("Refund charge unavailable");
   const charge=await stripe.charges.retrieve(chargeId);assertMode(charge,live);
   let succeeded=0;
   for await(const refund of stripe.refunds.list({charge:charge.id,limit:100})) { if(refund.status==="succeeded") succeeded+=refund.amount; }
   if(!succeeded)return json({received:true});
   const review=async(reason:string)=>{const {error}=await db.from("billing_refund_reviews").insert({event_id:event.id,charge_id:charge.id,reason,details:{payment_intent:charge.payment_intent,amount:charge.amount,refunded:succeeded}});if(error && error.code!=="23505")check(error);return json({received:true,manualReview:true});};
   const pi=typeof charge.payment_intent==="string"?charge.payment_intent:charge.payment_intent?.id;
   if(!pi) return await review("No payment intent");
   const sessions=await stripe.checkout.sessions.list({payment_intent:pi,limit:2});
   if(sessions.data.length!==1) return await review("Ambiguous or recurring payment Checkout linkage");
   const session=sessions.data[0];assertMode(session,live);
   if(session.metadata?.billing_version!=="1") return json({received:true});
   const {error}=await db.rpc("billing_refund",{p_event:event.id,p_order:session.metadata.order_id,p_session:session.id,p_charge:charge.id,p_amount:charge.amount,p_refunded:succeeded,p_currency:charge.currency});check(error);
   return json({received:true});
  }
  let subId: string | null = null;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
   const session = await stripe.checkout.sessions.retrieve((object as Stripe.Checkout.Session).id);
   assertMode(session, live);
   if (session.metadata?.billing_version !== "1") return json({ received: true });
   if (session.mode === "subscription") subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
   else if (session.payment_status === "paid") {
    const sku=session.metadata.sku;
    if(!isSku(sku) || sku==="pro" || session.mode!=="payment") throw new Error("Invalid one-time product");
    const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:2});
    const price=lines.data[0]?.price;
    if(lines.data.length!==1 || lines.data[0].quantity!==1 || !price || price.id!==Deno.env.get(PRODUCTS[sku].priceEnv)) throw new Error("One-time price mismatch");
    assertMode(price,live);
    const { error } = await db.rpc("billing_apply_purchase", {
     p_event: event.id, p_order: session.metadata.order_id, p_session: session.id, p_amount: session.amount_total, p_currency: session.currency,
    }); check(error);
   }
  } else if (event.type.startsWith("customer.subscription.")) subId = (object as Stripe.Subscription).id;
  else if (["invoice.paid","invoice.payment_failed"].includes(event.type)) {
   const invoice = object as Stripe.Invoice;
   const ref = invoice.parent?.subscription_details?.subscription;
   subId = typeof ref === "string" ? ref : ref?.id ?? null;
  }
  if (subId) {
   // Retrieve canonical state, rather than trusting potentially out-of-order event payloads.
   const sub = await stripe.subscriptions.retrieve(subId, { expand: ["latest_invoice"] });
   assertMode(sub, live);
   if (sub.metadata.billing_version !== "1") return json({ received: true });
   const { data: order, error: oe } = await db.from("billing_orders").select("user_id,sku,stripe_session_id").eq("id",sub.metadata.order_id).single(); check(oe);
   if (!order || order.sku !== "pro" || order.user_id !== sub.metadata.user_id || !order.stripe_session_id) throw new Error("Subscription order mismatch");
   const checkout = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
   assertMode(checkout, live);
   const interval = checkout.metadata?.interval;
   const role = checkout.metadata?.role;
   if(!isBillingInterval(interval) || (role !== "founder" && role !== "investor")) throw new Error("Invalid subscription metadata");
   const config = proPriceConfig(role,interval);
   if (checkout.subscription !== sub.id || sub.items.data.length !== 1 || sub.items.data[0].quantity !== 1 || sub.items.data[0].price.id !== Deno.env.get(config.priceEnv) || sub.items.data[0].price.unit_amount !== config.amount || sub.items.data[0].price.currency !== "usd" || sub.items.data[0].price.recurring?.interval !== interval || sub.items.data[0].price.recurring.interval_count !== 1) throw new Error("Subscription product mismatch");
   const item = sub.items.data[0];
   assertMode(item.price, live);
   const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
   const paid = invoice?.status === "paid";
   // A paid monthly billing period grants one credit, once; updates/retries cannot mint more.
   const { error } = await db.rpc("billing_sync_subscription", {
    p_event: event.id, p_user: order.user_id, p_subscription: sub.id, p_status: sub.status,
    p_expires: new Date(item.current_period_end * 1000).toISOString(),
    p_period: paid ? String(item.current_period_start) : null,
    p_interval: interval, p_start: new Date(item.current_period_start * 1000).toISOString(),
   }); check(error);
   const {error:paidError}=await db.from("billing_orders").update({status:paid ? "paid" : "pending"}).eq("id",sub.metadata.order_id).eq("status","pending"); check(paidError);
  }
  return json({ received: true });
 } catch (e) { console.error("billing-webhook", event.id, e); return json({ error: "Fulfillment failed; retry required" }, 500); }
});
