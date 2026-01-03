// Centralized Stripe Product/Price Mapping
// All Stripe price IDs and product routing logic

export const STRIPE_PRICES = {
  // Pro Subscriptions (recurring monthly)
  PRO_FOUNDER: {
    priceId: 'price_1SfuSgInI9cm3k8RNN0RE9YI', // Founding Propeller Pass - $15/month
    productId: 'prod_TdAoYADOrIryRL',
    amount: 1500, // cents
    displayPrice: '$15/month',
    name: 'Startup Pro',
  },
  PRO_INVESTOR: {
    priceId: 'price_1SCRGhInI9cm3k8Rg5Cy2JRK', // Propel Investor Pass Basic - $100/month
    productId: 'prod_T8iihJOglVUZjI',
    amount: 10000, // cents
    displayPrice: '$100/month',
    name: 'Investor Pro',
  },

  // Concierge Match (one-time payments)
  CONCIERGE_FOUNDER: {
    priceId: 'price_1Sg9vvInI9cm3k8RV9hn4TLx', // Concierge Match - Founder - $50
    productId: 'prod_TdQnPV2EJMhPeS',
    amount: 5000, // cents
    displayPrice: '$50',
    name: 'Concierge Match (Founder)',
  },
  CONCIERGE_INVESTOR: {
    priceId: 'price_1Sg9w8InI9cm3k8RFUBTzs2Z', // Concierge Match - Investor - $25
    productId: 'prod_TdQnxPXp78yssc',
    amount: 2500, // cents
    displayPrice: '$25',
    name: 'Concierge Match (Investor)',
  },

  // Spotlight Boost (one-time payment)
  SPOTLIGHT_BOOST: {
    priceId: 'price_1SgSAEInI9cm3k8R4m5mVOCS', // Spotlight Boost - $9.99
    productId: 'prod_Tdjd77954he7jE',
    amount: 999, // cents
    displayPrice: '$9.99',
    name: 'Spotlight Boost',
  },
} as const;

// Helper to get Pro price based on user type
export const getProPrice = (userType: 'founder' | 'investor') => {
  return userType === 'founder' ? STRIPE_PRICES.PRO_FOUNDER : STRIPE_PRICES.PRO_INVESTOR;
};

// Helper to get Concierge price based on user type
export const getConciergePrice = (userType: 'founder' | 'investor') => {
  return userType === 'founder' ? STRIPE_PRICES.CONCIERGE_FOUNDER : STRIPE_PRICES.CONCIERGE_INVESTOR;
};

// Token-based economy constants
// Token costs for products (1 token = $1)
export const TOKEN_COSTS = {
  CONCIERGE_FOUNDER: 50, // $50 = 50 tokens
  CONCIERGE_INVESTOR: 25, // $25 = 25 tokens
  SPOTLIGHT_BOOST: 30, // 30 tokens
  INSTANT_MESSAGE_FOUNDER: 35, // 35 tokens for founders
  INSTANT_MESSAGE_INVESTOR: 30, // 30 tokens for investors
  PRO_WEEK: 100, // 100 tokens for 1 week of Pro
} as const;

// Monthly token grants for Pro subscriptions
export const PRO_MONTHLY_TOKENS = {
  FOUNDER_PRO: 15, // $15/month = 15 tokens/month
  INVESTOR_PRO: 100, // $100/month = 100 tokens/month
} as const;

// Token packages available for purchase
// Note: Stripe price IDs need to be created in Stripe dashboard
export const TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 10,
    priceCents: 1000,
    displayPrice: '$10',
    stripePriceId: '', // To be configured in Stripe
  },
  {
    id: 'value',
    name: 'Value Pack',
    tokens: 25,
    priceCents: 2500,
    displayPrice: '$25',
    stripePriceId: '', // To be configured in Stripe
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    tokens: 50,
    priceCents: 5000,
    displayPrice: '$50',
    stripePriceId: '', // To be configured in Stripe
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 100,
    priceCents: 10000,
    displayPrice: '$100',
    stripePriceId: '', // To be configured in Stripe
  },
] as const;

// Helper to get token cost for concierge match
export const getConciergeTokenCost = (userType: 'founder' | 'investor') => {
  return userType === 'founder' ? TOKEN_COSTS.CONCIERGE_FOUNDER : TOKEN_COSTS.CONCIERGE_INVESTOR;
};

// Helper to get monthly token grant for Pro subscription
export const getProMonthlyTokens = (userType: 'founder' | 'investor') => {
  return userType === 'founder' ? PRO_MONTHLY_TOKENS.FOUNDER_PRO : PRO_MONTHLY_TOKENS.INVESTOR_PRO;
};

// For backward compatibility with existing useSubscription hook
export const SUBSCRIPTION_PLANS = {
  investor_pro: {
    name: STRIPE_PRICES.PRO_INVESTOR.name,
    price: STRIPE_PRICES.PRO_INVESTOR.amount,
    priceDisplay: STRIPE_PRICES.PRO_INVESTOR.displayPrice,
    stripePriceId: STRIPE_PRICES.PRO_INVESTOR.priceId,
  },
  startup_pro: {
    name: STRIPE_PRICES.PRO_FOUNDER.name,
    price: STRIPE_PRICES.PRO_FOUNDER.amount,
    priceDisplay: STRIPE_PRICES.PRO_FOUNDER.displayPrice,
    stripePriceId: STRIPE_PRICES.PRO_FOUNDER.priceId,
  },
} as const;
