import Stripe from "npm:stripe@22.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.81.1";
export const cors = { "Access-Control-Allow-Origin": Deno.env.get("APP_URL") ?? "https://catalystintro.com", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
export function services() {
 const mode = Deno.env.get("STRIPE_MODE");
 const key = Deno.env.get("STRIPE_SECRET_KEY_V2");
 if ((mode !== "test" && mode !== "live") || !key?.startsWith(mode === "live" ? "sk_live_" : "sk_test_")) throw new Error("Explicit Stripe mode and matching V2 key required");
 return {
  live: mode === "live",
  stripe: new Stripe(key, { apiVersion: "2026-05-27.dahlia", httpClient: Stripe.createFetchHttpClient() }),
  db: createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } }),
 };
}
export function check(error: { message: string } | null) { if (error) throw new Error(error.message); }

export function assertMode(object: { livemode: boolean }, live: boolean) { if (object.livemode !== live) throw new Error("Stripe mode mismatch"); }
