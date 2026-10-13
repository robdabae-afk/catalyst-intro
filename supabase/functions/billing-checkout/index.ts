import Stripe from "npm:stripe@22.2.0";
import { services, cors, json, check, assertMode } from "../_shared/billing.ts";
import { isSku, PRODUCTS, purchaseAmount, isBillingInterval, proPriceConfig } from "../_shared/billing-catalog.ts";
Deno.serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: cors });
 if (req.method !== "POST") return json({ error: "POST required" }, 405);
 try {
  const { stripe, db, live } = services();
  const { data: { user }, error } = await db.auth.getUser((req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""));
  if (error || !user) return json({ error: "Sign in to continue" }, 401);
  const { sku, action, interval = "month" } = await req.json();
  const app = Deno.env.get("APP_URL");
  if (!app || new URL(app).protocol !== "https:") return json({ error: "APP_URL must be configured with HTTPS" }, 503);
  const {data: legacy, error: le} = await db.from("profiles").select("stripe_customer_id").eq("id",user.id).single(); check(le);
  const {data: ent, error: ee} = await db.from("billing_entitlements").select("external_id").eq("user_id",user.id).eq("provider","stripe").maybeSingle(); check(ee);
  // Legacy portal stays on its original account, even if V2 uses another account.
  if (action === "portal" && !ent && legacy?.stripe_customer_id) {
   const oldKey = Deno.env.get("STRIPE_SECRET_KEY");
   if (!oldKey?.startsWith(live ? "sk_live_" : "sk_test_")) throw new Error("Legacy portal mode mismatch");
   const oldStripe = new Stripe(oldKey, {apiVersion:"2026-05-27.dahlia",httpClient:Stripe.createFetchHttpClient()});
   const customer = await oldStripe.customers.retrieve(legacy.stripe_customer_id);
   if(customer.deleted) throw new Error("Legacy customer unavailable");
   assertMode(customer,live);
   if(customer.metadata.supabase_user_id && customer.metadata.supabase_user_id !== user.id) throw new Error("Legacy customer ownership mismatch");
   const portal = await oldStripe.billingPortal.sessions.create({customer:customer.id,return_url:app+"/pricing"});
   return json({url:portal.url});
  }
  let customerId: string | undefined;
  if (ent) {
   const sub = await stripe.subscriptions.retrieve(ent.external_id); assertMode(sub, live);
   if (sub.metadata.user_id !== user.id) throw new Error("Subscription ownership mismatch");
   customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  }
  // Never replace a legacy ID when the V2 key belongs to a different account.
  // Retrieve/list errors fail closed before creating an order or customer.
  if (legacy?.stripe_customer_id) {
   const oldKey = Deno.env.get("STRIPE_SECRET_KEY");
   if (!oldKey?.startsWith(live ? "sk_live_" : "sk_test_")) throw new Error("Legacy retrieval mode mismatch");
   const oldStripe = new Stripe(oldKey,{apiVersion:"2026-05-27.dahlia",httpClient:Stripe.createFetchHttpClient()});
   const oldCustomer = await oldStripe.customers.retrieve(legacy.stripe_customer_id);
   if(oldCustomer.deleted) throw new Error("Legacy customer unavailable");
   assertMode(oldCustomer,live);
   if(oldCustomer.metadata.supabase_user_id && oldCustomer.metadata.supabase_user_id !== user.id) throw new Error("Legacy customer ownership mismatch");
   if(sku==="pro") {
    for await(const sub of oldStripe.subscriptions.list({customer:oldCustomer.id,status:"all",limit:100})) {
     assertMode(sub,live);
     if(!["canceled","incomplete_expired"].includes(sub.status)) return json({error:"Manage your existing legacy subscription"},409);
    }
   }
   // Reuse only after the V2 account independently resolves the same ID.
   // A different account fails closed; never replace the profile customer ID.
   const customer = await stripe.customers.retrieve(oldCustomer.id);
   if (customer.deleted) throw new Error("Legacy customer unavailable");
   assertMode(customer, live);
   if (customer.metadata.supabase_user_id && customer.metadata.supabase_user_id !== user.id) throw new Error("Legacy customer ownership mismatch");
   if (customerId && customerId !== customer.id) throw new Error("Conflicting customer identities");
   customerId = customer.id;
  }
  if (action === "portal") {
   if (!customerId) return json({error:"No Stripe subscription found"},404);
   const portal = await stripe.billingPortal.sessions.create({customer:customerId,return_url:app+"/pricing"});
   return json({url:portal.url});
  }
  if (sku === "pro" && customerId) {
   for await (const sub of stripe.subscriptions.list({customer:customerId,status:"all",limit:100})) {
    assertMode(sub,live);
    if (!["canceled","incomplete_expired"].includes(sub.status)) return json({error:"Manage your existing subscription"},409);
   }
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
  if (sku === "pro" && (!isBillingInterval(interval) || !["founder","investor"].includes(profile.user_type))) return json({error:"Invalid subscription interval or member role"},400);
  const product = PRODUCTS[sku];
  const proConfig = proPriceConfig(profile.user_type === "investor" ? "investor" : "founder", isBillingInterval(interval) ? interval : "month");
  const priceId = Deno.env.get(sku === "pro" ? proConfig.priceEnv : product.priceEnv);
  if (!priceId) return json({ error: "This product is not configured yet" }, 503);
  const price = await stripe.prices.retrieve(priceId);
  assertMode(price, live);
  if (!price.active || price.currency !== "usd" || !price.unit_amount || price.type !== (sku === "pro" ? "recurring" : "one_time") || (sku === "pro" && (price.recurring?.interval !== proConfig.interval || price.recurring.interval_count !== 1))) return json({ error: "Price configuration mismatch" }, 503);
  if (price.unit_amount !== (sku === "pro" ? proConfig.amount : product.amount)) return json({ error: "Price does not match the advertised product" }, 503);
  const amount = purchaseAmount(sku, pro === true, price.unit_amount);
  if (sku === "pro") {
   const { data: pending, error: pendingError } = await db.from("billing_orders").select("id,stripe_session_id").eq("user_id",user.id).eq("sku","pro").eq("status","pending").maybeSingle(); check(pendingError);
   if (pending?.stripe_session_id) {
    const previous = await stripe.checkout.sessions.retrieve(pending.stripe_session_id);
    assertMode(previous, live);
    if(previous.status === "open" && previous.url) {
     if(previous.metadata?.interval === interval) return json({url:previous.url});
     await stripe.checkout.sessions.expire(previous.id);
    }
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
  const metadata = { order_id: order!.id, user_id: user.id, sku, interval: sku === "pro" ? interval : "one_time", role: profile.user_type, billing_version: "1" };
  let session;
  try { session = await stripe.checkout.sessions.create({
   mode: product.mode, ...(customerId ? {customer: customerId} : {customer_email: user.email}), client_reference_id: user.id,
   line_items: [{ price: priceId, quantity: 1 }], discounts: coupon ? [{ coupon }] : undefined,
   subscription_data: sku === "pro" ? { metadata } : undefined, metadata,
   success_url: app + "/pricing?checkout=success", cancel_url: app + "/pricing?checkout=cancelled",
  }, { idempotencyKey: "catalyst-order-" + order!.id });
  } catch(e) { await db.from("billing_orders").update({status:"expired"}).eq("id",order!.id).is("stripe_session_id",null); throw e; }
  const { error: se } = await db.from("billing_orders").update({ stripe_session_id: session.id }).eq("id", order!.id); check(se);
  return json({ url: session.url });
 } catch (e) { console.error("billing-checkout", e); return json({ error: "Checkout is unavailable. Please try again." }, 503); }
});
