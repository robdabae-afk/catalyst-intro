import { supabase } from "@/integrations/supabase/client";
import { isAppShell } from "@/lib/platform";
import { Capacitor } from "@capacitor/core";
export type Product = "pro" | "concierge_one" | "concierge_two" | "messages_three" | "messages_six";
export type BillingInterval = "month" | "year";
export interface Entitlements { hasStripeSubscription?: boolean; expiresAt?: string | null; tokenRemainder?: number; role?: "founder" | "investor"; isPro: boolean; credits: number; remaining: number; resetsAt: string; canBoost: boolean; views: number | null }
export const FREE: Entitlements = { isPro: false, credits: 0, remaining: 5, resetsAt: "", canBoost: false, views: null };
export const PRO_DISPLAY_PRICE = Number(import.meta.env.VITE_PRO_FOUNDER_PRICE || 29);
export const INVESTOR_DISPLAY_PRICE = Number(import.meta.env.VITE_PRO_INVESTOR_PRICE || 19);
export async function billingRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
 const { data, error } = await (supabase as any).rpc(name, args);
 if (error) throw new Error(error.message);
 return data as T;
}
// Payment adapter boundary. Native iOS never opens Stripe for digital entitlements.
// RevenueCat/StoreKit can implement this interface while retaining the server snapshot contract.
export interface PaymentProvider { checkout(sku: Product, interval?: BillingInterval): Promise<void>; manage(): Promise<void> }
async function stripeRedirect(body: Record<string, string>) {
 if (isAppShell() && Capacitor.getPlatform() === "ios") throw new Error("In-app purchases for iPhone are not connected yet. No payment was taken.");
 const { data, error } = await supabase.functions.invoke("billing-checkout", { body });
 if (error) {
  let message = "Checkout is not configured yet.";
  try { const payload = await error.context.json(); message = payload.error || message; } catch { /* network error */ }
  throw new Error(message);
 }
 if (data?.error || !data?.url) throw new Error(data?.error || "Checkout is unavailable.");
 const url = new URL(data.url);
 if (url.protocol !== "https:" || !["checkout.stripe.com","billing.stripe.com"].includes(url.hostname)) throw new Error("Invalid payment destination");
 window.location.assign(url.href);
}
export const payments: PaymentProvider = { checkout: (sku, interval = "month") => stripeRedirect({ sku, interval }), manage: () => stripeRedirect({ action: "portal" }) };
