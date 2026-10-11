export const PRODUCTS = {
 pro: { amount: 2900, mode: "subscription", priceEnv: "STRIPE_PRICE_PRO", credits: 0, matches: 0 },
 concierge_one: { amount: 4500, mode: "payment", priceEnv: "STRIPE_PRICE_CONCIERGE_ONE", credits: 0, matches: 1 },
 concierge_two: { amount: 5500, mode: "payment", priceEnv: "STRIPE_PRICE_CONCIERGE_TWO", credits: 0, matches: 2 },
 messages_three: { amount: 2500, mode: "payment", priceEnv: "STRIPE_PRICE_MESSAGES_THREE", credits: 3, matches: 0 },
 messages_six: { amount: 3500, mode: "payment", priceEnv: "STRIPE_PRICE_MESSAGES_SIX", credits: 6, matches: 0 },
} as const;
export type Sku = keyof typeof PRODUCTS;
export function isSku(value: unknown): value is Sku { return typeof value === "string" && Object.hasOwn(PRODUCTS, value); }
export function purchaseAmount(sku: Sku, isPro: boolean, proAmount = 2900) {
 return sku === "pro" ? proAmount : Math.round(PRODUCTS[sku].amount * (isPro && PRODUCTS[sku].matches ? 0.8 : 1));
}
