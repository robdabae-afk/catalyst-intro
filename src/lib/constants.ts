// Shared industry list for founders and investors
export const INDUSTRIES = [
  "AI/ML",
  "B2B SaaS",
  "Consumer",
  "Climate Tech",
  "Crypto/Web3",
  "E-Commerce",
  "EdTech",
  "FinTech",
  "FoodTech",
  "Gaming",
  "HealthTech",
  "HRTech",
  "InsurTech",
  "LegalTech",
  "Logistics",
  "Marketplace",
  "Media/Entertainment",
  "PropTech",
  "Robotics",
  "SpaceTech",
] as const;

export type Industry = typeof INDUSTRIES[number];

// Funding stages - matches the database enum
export const FUNDING_STAGES = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
] as const;

export type FundingStage = typeof FUNDING_STAGES[number]["value"];
