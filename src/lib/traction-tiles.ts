// Traction tile definitions shared by the founder profile view and Settings.

export type TractionTileKey =
  | "mrr"
  | "growth_mom"
  | "paying_customers"
  | "months_in_operation"
  | "user_growth_mom"
  | "waitlist_signups"
  | "active_users"
  | "pilots_lois"
  | "product_status"
  | "headcount"
  | "stage";

export interface TractionTileDef {
  key: TractionTileKey;
  label: string;
  sub?: string;
  /** Only selectable / displayable once the founder reports revenue. */
  revenueOnly?: boolean;
}

export const TRACTION_TILES: TractionTileDef[] = [
  { key: "mrr", label: "MRR", sub: "monthly", revenueOnly: true },
  { key: "growth_mom", label: "Growth", sub: "MoM", revenueOnly: true },
  { key: "paying_customers", label: "Customers", sub: "paying", revenueOnly: true },
  { key: "user_growth_mom", label: "User growth", sub: "MoM" },
  { key: "waitlist_signups", label: "Waitlist", sub: "signups" },
  { key: "active_users", label: "Active users", sub: "weekly / monthly" },
  { key: "pilots_lois", label: "Pilots / LOIs", sub: "committed" },
  { key: "product_status", label: "Product", sub: "status" },
  { key: "months_in_operation", label: "Months in Operation", sub: "since launch" },
  { key: "headcount", label: "Team", sub: "people" },
  { key: "stage", label: "Stage", sub: "funding" },
];

export const PRODUCT_STATUS_OPTIONS = [
  "In development",
  "Private beta",
  "Public beta",
  "Launched",
] as const;

/** The pre-revenue metrics a founder picks two of. */
export const PRE_REVENUE_METRIC_KEYS: TractionTileKey[] = [
  "waitlist_signups",
  "active_users",
  "pilots_lois",
  "product_status",
];

export const MAX_TRACTION_TILES = 4;

export const POST_REVENUE_DEFAULT_TILES: TractionTileKey[] = [
  "mrr",
  "growth_mom",
  "paying_customers",
  "months_in_operation",
];

export const tileDef = (key: string): TractionTileDef | undefined =>
  TRACTION_TILES.find((t) => t.key === key);

export const selectableTiles = (isPostRevenue: boolean): TractionTileDef[] =>
  TRACTION_TILES.filter((t) => (isPostRevenue ? true : !t.revenueOnly));

/** Parses "+12%", "12", "-3 %" → number; undefined when unparseable. */
export const parseGrowth = (v?: string | number | null): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const m = String(v).replace(/\s|,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
};

export const isStrongGrowth = (v?: string | number | null): boolean => {
  const n = parseGrowth(v);
  return n !== undefined && n > 10;
};
