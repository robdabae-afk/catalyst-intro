import Stripe from "npm:stripe@22.2.0";
import { services, json, check } from "../_shared/billing.ts";
Deno.serve(async (req) => {
 if (req.method !== "POST") return json({ error: "POST required" }, 405);
 const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
 if (!secret) return json({ error: "Webhook not configured" }, 503);
 let svc; try { svc = services(); } catch { return json({ error: "Test-mode Stripe required" }, 503); }
 const { stripe, db } = svc;
 let event: Stripe.Event;
 try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", secret, undefined, Stripe.createSubtleCryptoProvider()); }
 catch { return json({ error: "Invalid signature" }, 400); }
 if (event.livemode) return json({ error: "Live payments are disabled" }, 400);
 try {
  const object = event.data.object;
  if(event.type === "checkout.session.expired") {
   const session=object as Stripe.Checkout.Session;
   if(session.metadata?.billing_version==="1") {
    const {error}=await db.from("billing_orders").update({status:"expired"}).eq("stripe_session_id",session.id).eq("status","pending");check(error);
   }
   return json({received:true});
  }
  let subId: string | null = null;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
   const session = await stripe.checkout.sessions.retrieve((object as Stripe.Checkout.Session).id);
   if (session.metadata?.billing_version !== "1") return json({ received: true });
   if (session.mode === "subscription") subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
   else if (session.payment_status === "paid") {
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
   if (sub.metadata.billing_version !== "1") return json({ received: true });
   const { data: order, error: oe } = await db.from("billing_orders").select("user_id,sku,stripe_session_id").eq("id",sub.metadata.order_id).single(); check(oe);
   if (!order || order.sku !== "pro" || order.user_id !== sub.metadata.user_id || !order.stripe_session_id) throw new Error("Subscription order mismatch");
   const checkout = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
   if (checkout.subscription !== sub.id || sub.items.data.length !== 1 || ![Deno.env.get("STRIPE_PRICE_PRO_FOUNDER"), Deno.env.get("STRIPE_PRICE_PRO_INVESTOR")].includes(sub.items.data[0].price.id)) throw new Error("Subscription product mismatch");
   const item = sub.items.data[0];
   const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
   const paid = invoice?.status === "paid";
   // A paid monthly billing period grants one credit, once; updates/retries cannot mint more.
   const { error } = await db.rpc("billing_sync_subscription", {
    p_event: event.id, p_user: order.user_id, p_subscription: sub.id, p_status: sub.status,
    p_expires: new Date(item.current_period_end * 1000).toISOString(),
    p_period: paid ? String(item.current_period_start) : null,
   }); check(error);
   const {error:paidError}=await db.from("billing_orders").update({status:paid ? "paid" : "pending"}).eq("id",sub.metadata.order_id).eq("status","pending"); check(paidError);
  }
  return json({ received: true });
 } catch (e) { console.error("billing-webhook", event.id, e); return json({ error: "Fulfillment failed; retry required" }, 500); }
});
