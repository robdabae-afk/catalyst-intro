import { test, expect } from "bun:test";
import { proPriceConfig, isBillingInterval, purchaseAmount } from "../supabase/functions/_shared/billing-catalog";
for (const role of ["founder","investor"] as const) {
 for (const interval of ["month","year"] as const) {
  test(role+" "+interval+" price and environment mapping",()=>{
   const price=proPriceConfig(role,interval);
   expect(price.amount).toBe((role==="founder"?2900:1900)*(interval==="year"?10:1));
   expect(price.priceEnv).toBe("STRIPE_PRICE_PRO_"+role.toUpperCase()+"_"+(interval==="year"?"YEARLY":"MONTHLY"));
   expect(price.interval).toBe(interval);
  });
 }
}
test("only supported intervals accepted",()=>{
 for(const x of [null,"annual","week","",1,{}]) expect(isBillingInterval(x)).toBe(false);
 expect(isBillingInterval("year")).toBe(true);expect(isBillingInterval("month")).toBe(true);
});
test("pack discounts stay independent of subscription interval",()=>{
 expect(purchaseAmount("concierge_one",true)).toBe(3600);
 expect(purchaseAmount("concierge_two",true)).toBe(4400);
 expect(purchaseAmount("messages_three",true)).toBe(2500);
 expect(purchaseAmount("pro",false,29000)).toBe(29000);
});
