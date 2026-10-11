import Stripe from "npm:stripe@22.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.81.1";
export const cors = { "Access-Control-Allow-Origin": Deno.env.get("APP_URL") ?? "https://catalystintro.com", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
export function services() {
 const key = Deno.env.get("STRIPE_SECRET_KEY");
 if (!key?.startsWith("sk_test_")) throw new Error("Test-mode Stripe configuration required");
 return {
  stripe: new Stripe(key, { apiVersion: "2026-05-27.dahlia", httpClient: Stripe.createFetchHttpClient() }),
  db: createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } }),
 };
}
export function check(error: { message: string } | null) { if (error) throw new Error(error.message); }
