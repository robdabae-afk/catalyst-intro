import { services, cors, json, check } from "../_shared/billing.ts";
import { isSku, PRODUCTS, purchaseAmount } from "../_shared/billing-catalog.ts";
Deno.serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: cors });
 if (req.method !== "POST") return json({ error: "POST required" }, 405);
 try {
  const { stripe, db } = services();
  const { data: { user }, error } = await db.auth.getUser((req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""));
  if (error || !user) return json({ error: "Sign in to continue" }, 401);
  const { sku, action } = await req.json();
  const app = Deno.env.get("APP_URL");
  if (!app || new URL(app).protocol !== "https:") return json({ error: "APP_URL must be configured with HTTPS" }, 503);
  if (action === "portal") {
   const { data: ent, error: e } = await db.from("billing_entitlements").select("external_id").eq("user_id", user.id).eq("provider", "stripe").maybeSingle(); check(e);
   if (!ent) return json({ error: "No Stripe subscription found" }, 404);
   const sub = await stripe.subscriptions.retrieve(ent.external_id);
   const portal = await stripe.billingPortal.sessions.create({ customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id, return_url: app + "/pricing" });
   return json({ url: portal.url });
  }
  if (!isSku(sku)) return json({ error: "Unknown product" }, 400);
  const { data: profile, error: pe } = await db.from("profiles").select("user_type,approved,is_flagged").eq("id", user.id).single(); check(pe);
  if (!profile?.approved || profile.is_flagged) return json({ error: "Profile approval required before purchasing" }, 403);
  if (sku === "concierge_one" && profile.user_type !== "founder") return json({ error: "Single investor matches are for founders" }, 400);
  const { data: pro, error: proError } = await db.rpc("billing_is_pro", { p_user: user.id }); check(proError);
  if (sku === "pro" && pro) return json({ error: "You already have Pro. Manage your subscription instead." }, 409);
  // Block duplicate active/incomplete Stripe subscriptions, including checkout retries.
  if (sku === "pro") {
   const { data: ent, error: e } = await db.from("billing_entitlements").select("external_id").eq("user_id", user.id).eq("provider","stripe").maybeSingle(); check(e);
   if (ent) { const sub = await stripe.subscriptions.retrieve(ent.external_id); if (!["canceled","incomplete_expired"].includes(sub.status)) return json({ error: "Manage your existing subscription" }, 409); }
  }
  const product = PRODUCTS[sku], priceId = Deno.env.get(sku === "pro" ? (profile.user_type === "investor" ? "STRIPE_PRICE_PRO_INVESTOR" : "STRIPE_PRICE_PRO_FOUNDER") : product.priceEnv);
  if (!priceId) return json({ error: "This product is not configured yet" }, 503);
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active || price.currency !== "usd" || !price.unit_amount || price.type !== (sku === "pro" ? "recurring" : "one_time") || (sku === "pro" && (price.recurring?.interval !== "month" || price.recurring.interval_count !== 1))) return json({ error: "Price configuration mismatch" }, 503);
  if (sku !== "pro" && price.unit_amount !== product.amount) return json({ error: "Price does not match the advertised product" }, 503);
  const amount = purchaseAmount(sku, pro === true, price.unit_amount);
  if (sku === "pro") {
   const { data: pending, error: pendingError } = await db.from("billing_orders").select("id,stripe_session_id").eq("user_id",user.id).eq("sku","pro").eq("status","pending").maybeSingle(); check(pendingError);
   if (pending?.stripe_session_id) {
    const previous = await stripe.checkout.sessions.retrieve(pending.stripe_session_id);
    if(previous.status === "open" && previous.url) return json({url:previous.url});
    if(previous.status === "complete") return json({error:"Your subscription is awaiting confirmation. Please refresh shortly."},409);
    const {error:expireError}=await db.from("billing_orders").update({status:"expired"}).eq("id",pending.id); check(expireError);
   } else if (pending) return json({error:"A checkout is already being prepared. Please retry shortly."},409);
  }
  let coupon: string | undefined;
  if (pro && product.matches) {
   coupon = Deno.env.get("STRIPE_CONCIERGE_PRO_COUPON");
   if (!coupon) return json({ error: "Pro concierge discount not configured" }, 503);
   const c = await stripe.coupons.retrieve(coupon);
   if (!c.valid || c.percent_off !== 20 || c.amount_off || c.applies_to) return json({ error: "Discount must be an unrestricted 20% coupon" }, 503);
  }
  const { data: order, error: oe } = await db.from("billing_orders").insert({ user_id: user.id, sku, amount }).select("id").single(); check(oe);
  const metadata = { order_id: order!.id, user_id: user.id, sku, billing_version: "1" };
  let session;
  try { session = await stripe.checkout.sessions.create({
   mode: product.mode, customer_email: user.email, client_reference_id: user.id,
   line_items: [{ price: priceId, quantity: 1 }], discounts: coupon ? [{ coupon }] : undefined,
   subscription_data: sku === "pro" ? { metadata } : undefined, metadata,
   success_url: app + "/pricing?checkout=success", cancel_url: app + "/pricing?checkout=cancelled",
  }, { idempotencyKey: "catalyst-order-" + order!.id });
  } catch(e) { await db.from("billing_orders").update({status:"expired"}).eq("id",order!.id).is("stripe_session_id",null); throw e; }
  const { error: se } = await db.from("billing_orders").update({ stripe_session_id: session.id }).eq("id", order!.id); check(se);
  return json({ url: session.url });
 } catch (e) { console.error("billing-checkout", e); return json({ error: "Checkout is unavailable. Please try again." }, 503); }
});
