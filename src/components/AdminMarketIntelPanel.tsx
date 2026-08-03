import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, BarChart3, DollarSign, Target, Zap, Copy, RefreshCw,
  ThumbsDown, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface FunnelStats {
  totalSwipes: number;
  totalLikes: number;
  totalPasses: number;
  likeRate: number;
  totalMatches: number;
  matchesMessaged: number;
  messageRate: number;
  totalMeetings: number;
  acceptedMeetings: number;
  totalSafes: number;
  profileViews: number;
  deckOpens: number;
  deckOpenRate: number;
}

interface SectorDemand {
  sector: string;
  likes: number;
  passes: number;
  total: number;
  likeRate: number;
}

interface PassReason {
  reason: string;
  count: number;
  pct: number;
}

interface DealTerms {
  totalSafes: number;
  withCap: number;
  withDiscount: number;
  avgCheck: number;
  capP25: number | null;
  capMedian: number | null;
  capP75: number | null;
  capAvg: number | null;
  discountMedian: number | null;
  discountAvg: number | null;
  capBuckets: { label: string; count: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const GOLD = "#C6A02C";
const GOLD_LIGHT = "#E7CB7E";
const COLORS = [GOLD, GOLD_LIGHT, "#A0785A", "#D4AF37", "#8B7355", "#CD853F", "#DEB887", "#BC8F8F"];

const fmt$ = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toFixed(1)}%`;

const currentQuarter = () => {
  const d = new Date();
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
};

// ── Main Component ─────────────────────────────────────────────────────────

export function AdminMarketIntelPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<FunnelStats | null>(null);
  const [sectorDemand, setSectorDemand] = useState<SectorDemand[]>([]);
  const [passReasons, setPassReasons] = useState<PassReason[]>([]);
  const [dealTerms, setDealTerms] = useState<DealTerms | null>(null);
  const [dataNote, setDataNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetches — all raw tables so admin RLS applies
      const [swipesRes, profilesRes, founderRes, safesRes, matchesRes, chatsRes] =
        await Promise.all([
          (supabase as any).from("swipes").select("action, swiped_id, pass_reason"),
          supabase.from("profiles").select("id, user_type, is_test_mode"),
          supabase.from("founder_profiles").select("profile_id, industry, stage"),
          supabase.from("safes").select("amount, valuation_cap, discount_rate, status"),
          supabase.from("matches").select("id, first_message_at, status"),
          supabase.from("coffee_chats").select("id, status"),
        ]);

      // Analytics event counts (head-only queries)
      const [pvRes, doRes] = await Promise.all([
        (supabase as any)
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "profile_view"),
        (supabase as any)
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "deck_open"),
      ]);

      const swipes: any[] = swipesRes.data ?? [];
      const profiles: any[] = profilesRes.data ?? [];
      const founders: any[] = founderRes.data ?? [];
      const safes: any[] = (safesRes.data ?? []).filter((s: any) => s.status !== "voided");
      const matches: any[] = matchesRes.data ?? [];
      const chats: any[] = chatsRes.data ?? [];

      // Build lookup maps
      const testIds = new Set(profiles.filter((p: any) => p.is_test_mode).map((p: any) => p.id));
      const founderIds = new Set(profiles.filter((p: any) => p.user_type === "founder").map((p: any) => p.id));
      const industryMap = new Map(founders.map((f: any) => [f.profile_id, (f.industry as string[]) ?? []]));

      // Filter out test accounts
      const realSwipes = swipes.filter(
        (s: any) => !testIds.has(s.swiper_id) && !testIds.has(s.swiped_id)
      );
      const founderSwipes = realSwipes.filter((s: any) => founderIds.has(s.swiped_id));

      // ── Funnel ──
      const likes = founderSwipes.filter((s: any) => s.action === "like" || s.action === "superlike").length;
      const passes = founderSwipes.filter((s: any) => s.action === "pass").length;
      const total = founderSwipes.length;
      const messaged = matches.filter((m: any) => m.first_message_at).length;
      const profileViews: number = pvRes.count ?? 0;
      const deckOpens: number = doRes.count ?? 0;

      setFunnel({
        totalSwipes: total,
        totalLikes: likes,
        totalPasses: passes,
        likeRate: total > 0 ? (likes / total) * 100 : 0,
        totalMatches: matches.length,
        matchesMessaged: messaged,
        messageRate: matches.length > 0 ? (messaged / matches.length) * 100 : 0,
        totalMeetings: chats.length,
        acceptedMeetings: chats.filter((c: any) => c.status === "accepted").length,
        totalSafes: safes.length,
        profileViews,
        deckOpens,
        deckOpenRate: profileViews > 0 ? (deckOpens / profileViews) * 100 : 0,
      });

      // ── Sector Demand ──
      const sectorMap: Record<string, { likes: number; passes: number }> = {};
      for (const s of founderSwipes) {
        const industries = industryMap.get(s.swiped_id) ?? [];
        for (const ind of industries) {
          if (!sectorMap[ind]) sectorMap[ind] = { likes: 0, passes: 0 };
          if (s.action === "like" || s.action === "superlike") sectorMap[ind].likes++;
          if (s.action === "pass") sectorMap[ind].passes++;
        }
      }
      const demand: SectorDemand[] = Object.entries(sectorMap)
        .map(([sector, { likes, passes }]) => ({
          sector,
          likes,
          passes,
          total: likes + passes,
          likeRate: likes + passes > 0 ? (likes / (likes + passes)) * 100 : 0,
        }))
        .filter((d) => d.total >= 5)
        .sort((a, b) => b.likeRate - a.likeRate)
        .slice(0, 10);
      setSectorDemand(demand);

      // ── Pass Reasons ──
      const reasonCounts: Record<string, number> = {};
      for (const s of founderSwipes) {
        if (s.action === "pass" && s.pass_reason) {
          reasonCounts[s.pass_reason] = (reasonCounts[s.pass_reason] ?? 0) + 1;
        }
      }
      const totalWithReason = Object.values(reasonCounts).reduce((a, b) => a + b, 0);
      const reasons: PassReason[] = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          pct: totalWithReason > 0 ? Math.round((count / totalWithReason) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
      setPassReasons(reasons);

      // ── Deal Terms ──
      const capsRaw = safes.map((s: any) => s.valuation_cap).filter((v: any) => v != null) as number[];
      const discountsRaw = safes.map((s: any) => s.discount_rate).filter((v: any) => v != null) as number[];
      const checks = safes.map((s: any) => s.amount as number);

      const sortedCaps = [...capsRaw].sort((a, b) => a - b);
      const pct = (arr: number[], p: number) => {
        if (!arr.length) return null;
        const idx = (p / 100) * (arr.length - 1);
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
      };

      const capBuckets = [
        { label: "< $3M",   count: capsRaw.filter((c) => c < 3_000_000).length },
        { label: "$3–5M",   count: capsRaw.filter((c) => c >= 3_000_000 && c < 5_000_000).length },
        { label: "$5–10M",  count: capsRaw.filter((c) => c >= 5_000_000 && c < 10_000_000).length },
        { label: "> $10M",  count: capsRaw.filter((c) => c >= 10_000_000).length },
      ];

      const avgDiscount = discountsRaw.length
        ? discountsRaw.reduce((a, b) => a + b, 0) / discountsRaw.length
        : null;
      const avgCheck = checks.length
        ? checks.reduce((a, b) => a + b, 0) / checks.length
        : 0;

      setDealTerms({
        totalSafes: safes.length,
        withCap: capsRaw.length,
        withDiscount: discountsRaw.length,
        avgCheck,
        capP25: pct(sortedCaps, 25),
        capMedian: pct(sortedCaps, 50),
        capP75: pct(sortedCaps, 75),
        capAvg: capsRaw.length ? capsRaw.reduce((a, b) => a + b, 0) / capsRaw.length : null,
        discountMedian: pct([...discountsRaw].sort((a, b) => a - b), 50),
        discountAvg: avgDiscount,
        capBuckets,
      });

      const minN = demand.length > 0 ? Math.min(...demand.map((d) => d.total)) : 0;
      setDataNote(
        `Based on ${total.toLocaleString()} investor decisions, ${safes.length} SAFEs, ` +
          `${matches.length} matches. Sectors with < 5 decisions excluded.`
      );
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to load market intel", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // ── Report Preview text ──
  const buildReportText = () => {
    if (!funnel || !dealTerms) return "";
    const q = currentQuarter();
    const topSector = sectorDemand[0];
    const topReason = passReasons[0];
    const lines = [
      `CATALYST PRE-SEED INDEX — ${q}`,
      `${"─".repeat(50)}`,
      ``,
      `KEY FINDINGS`,
      ``,
      dealTerms.capMedian
        ? `• Median SAFE valuation cap: ${fmt$(dealTerms.capMedian)} (P25 ${fmt$(dealTerms.capP25)}, P75 ${fmt$(dealTerms.capP75)})`
        : `• SAFE cap data accumulating (${dealTerms.totalSafes} SAFEs recorded)`,
      dealTerms.discountMedian != null
        ? `• Median discount rate: ${dealTerms.discountMedian.toFixed(1)}%`
        : null,
      dealTerms.avgCheck
        ? `• Average check size on Catalyst: ${fmt$(dealTerms.avgCheck)}`
        : null,
      ``,
      topSector
        ? `• #1 most-sought sector: ${topSector.sector} — ${fmtPct(topSector.likeRate)} investor interest rate`
        : `• Sector demand data accumulating`,
      topReason
        ? `• Top pass reason: "${topReason.reason}" (${topReason.pct}% of explicit passes)`
        : `• Pass reason data accumulating`,
      ``,
      `PLATFORM ACTIVITY`,
      ``,
      `• ${funnel.totalSwipes.toLocaleString()} investor decisions recorded`,
      `• ${fmtPct(funnel.likeRate)} overall like rate`,
      `• ${fmtPct(funnel.messageRate)} of matches send at least one message`,
      funnel.profileViews > 0
        ? `• ${fmtPct(funnel.deckOpenRate)} of profile views result in a deck open`
        : null,
      ``,
      `─────────────────────────────────────────────────`,
      `Minimum 5 decisions per segment. Individual records not disclosed.`,
      `Source: Catalyst — catalyst.vc`,
    ].filter(Boolean).join("\n");
    return lines;
  };

  const copyReport = () => {
    const text = buildReportText();
    navigator.clipboard.writeText(text).then(() =>
      toast({ title: "Report text copied to clipboard" })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading market intelligence…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Market Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{dataNote}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* ── Platform Pulse ── */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Platform Pulse
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Decisions",
              value: funnel?.totalSwipes.toLocaleString() ?? "—",
              sub: `${funnel?.totalLikes.toLocaleString()} likes · ${funnel?.totalPasses.toLocaleString()} passes`,
              icon: <Zap className="w-4 h-4" />,
            },
            {
              label: "Like Rate",
              value: fmtPct(funnel?.likeRate),
              sub: `${funnel?.totalMatches.toLocaleString()} total matches`,
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: "Message Rate",
              value: fmtPct(funnel?.messageRate),
              sub: "of matches send ≥ 1 message",
              icon: <Target className="w-4 h-4" />,
            },
            {
              label: "Deck Open Rate",
              value: funnel && funnel.profileViews > 0 ? fmtPct(funnel.deckOpenRate) : "Collecting…",
              sub: `${funnel?.deckOpens.toLocaleString()} opens / ${funnel?.profileViews.toLocaleString()} views`,
              icon: <ArrowUpRight className="w-4 h-4" />,
            },
            {
              label: "Meetings Proposed",
              value: funnel?.totalMeetings.toLocaleString() ?? "—",
              sub: `${funnel?.acceptedMeetings.toLocaleString()} accepted`,
              icon: <Target className="w-4 h-4" />,
            },
            {
              label: "SAFEs Recorded",
              value: funnel?.totalSafes.toLocaleString() ?? "—",
              sub: "on-platform deal terms",
              icon: <DollarSign className="w-4 h-4" />,
            },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {stat.icon}
                  <span className="text-xs font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Sector Demand + Pass Reasons ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sector Heat */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Sector Heat Map
            </CardTitle>
            <p className="text-xs text-muted-foreground">Investor like rate by founder industry (≥ 5 decisions)</p>
          </CardHeader>
          <CardContent>
            {sectorDemand.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Not enough data yet (need ≥ 5 decisions per sector)
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={sectorDemand}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any, name: string) =>
                      name === "likeRate" ? [`${val.toFixed(1)}%`, "Like Rate"] : [val, name]
                    }
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload as SectorDemand;
                      return (
                        <div className="bg-card border border-border rounded p-2 text-xs shadow">
                          <div className="font-medium">{d.sector}</div>
                          <div>{d.likes} likes · {d.passes} passes · {d.total} total</div>
                          <div className="text-amber-500 font-bold">{d.likeRate.toFixed(1)}% like rate</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="likeRate" name="Like Rate" radius={[0, 3, 3, 0]}>
                    {sectorDemand.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? GOLD_LIGHT : COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pass Reasons */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-amber-500" />
              Why Investors Pass
            </CardTitle>
            <p className="text-xs text-muted-foreground">One-tap reason chips recorded since Phase A launch</p>
          </CardHeader>
          <CardContent>
            {passReasons.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No pass reasons recorded yet — accumulating from new passes
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {passReasons.map((r, i) => (
                  <div key={r.reason} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{r.reason}</span>
                      <span className="text-muted-foreground">{r.count} ({r.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${r.pct}%`,
                          background: i === 0 ? GOLD : GOLD_LIGHT,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Deal Terms Benchmark ── */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Deal Terms Benchmark
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            From {dealTerms?.totalSafes ?? 0} SAFEs recorded on platform —
            {" "}{dealTerms?.withCap ?? 0} with valuation cap, {dealTerms?.withDiscount ?? 0} with discount
          </p>
        </CardHeader>
        <CardContent>
          {!dealTerms || dealTerms.totalSafes < 3 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
              Accumulating SAFE data — need ≥ 3 for meaningful stats
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Valuation cap stats */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Cap P25</div>
                <div className="text-xl font-bold">{fmt$(dealTerms.capP25)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Cap Median</div>
                <div className="text-xl font-bold text-amber-500">{fmt$(dealTerms.capMedian)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Cap P75</div>
                <div className="text-xl font-bold">{fmt$(dealTerms.capP75)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Check</div>
                <div className="text-xl font-bold">{fmt$(dealTerms.avgCheck)}</div>
              </div>

              {/* Cap distribution bar chart */}
              {dealTerms.withCap >= 3 && (
                <div className="col-span-2 md:col-span-4 mt-2">
                  <div className="text-xs text-muted-foreground mb-2">Valuation Cap Distribution</div>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={dealTerms.capBuckets} margin={{ top: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="SAFEs" radius={[3, 3, 0, 0]}>
                        {dealTerms.capBuckets.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Discount info */}
              {dealTerms.withDiscount > 0 && (
                <div className="col-span-2 md:col-span-4 flex gap-6 pt-2 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Discount Median</div>
                    <div className="font-bold">
                      {dealTerms.discountMedian != null ? `${dealTerms.discountMedian.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Discount Avg</div>
                    <div className="font-bold">
                      {dealTerms.discountAvg != null ? `${dealTerms.discountAvg.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">With Discount</div>
                    <div className="font-bold">
                      {dealTerms.withDiscount} of {dealTerms.totalSafes} SAFEs
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── State of Pre-Seed Report Preview ── */}
      <Card className="bg-card border-amber-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              State of Pre-Seed — Report Preview
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">
                {currentQuarter()}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={copyReport}>
              <Copy className="w-3 h-3 mr-1" />
              Copy text
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview of the publishable report generated from live data.
            Distribute only after ToS/privacy-policy update is live.
          </p>
        </CardHeader>
        <CardContent>
          <pre className="font-mono text-xs bg-muted/40 rounded p-4 whitespace-pre-wrap leading-relaxed text-foreground">
            {buildReportText()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
