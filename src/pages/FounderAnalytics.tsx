import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, BarChart3, TrendingUp, Zap, Lightbulb, Lock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const GOLD = "#C6A02C";
const GOLD_LIGHT = "#E7CB7E";
const TEXT = "#F6F5F2";
const TEXT_DIM = "#94908A";
const PAGE_BG =
  "radial-gradient(ellipse 100% 60% at 28% 6%, rgba(212,176,86,0.13) 0%, rgba(212,176,86,0) 46%), " +
  "radial-gradient(ellipse 90% 50% at 88% 100%, rgba(120,92,30,0.15) 0%, rgba(120,92,30,0) 52%), " +
  "linear-gradient(137deg, #0B0A07 0%, #060606 55%, #080709 100%)";

const glass = {
  background: "rgba(255,255,255,0.06)",
  boxShadow: "0px 14px 34px -16px rgba(0,0,0,0.85), 0px 1px 0px 1px rgba(255,255,255,0.24) inset",
  outline: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(9px)",
} as const;

interface WeekBucket {
  label: string;
  views: number;
  deckOpens: number;
}

interface CohortStats {
  cohortSize: number;
  medianLikeRate: number | null;
  medianViews: number | null;
  medianDeckRate: number | null;
}

function pct(n: number | null | undefined, total: number) {
  if (n == null || total === 0) return null;
  return Math.round((n / total) * 100);
}

function fmtPct(n: number | null | undefined) {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}

function compareBadge(mine: number | null, cohort: number | null) {
  if (mine == null || cohort == null || cohort === 0) return null;
  const diff = mine - cohort;
  const better = diff >= 0;
  return (
    <span
      className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        background: better ? "rgba(94,201,142,0.15)" : "rgba(200,100,100,0.15)",
        color: better ? "#5EC98E" : "#C86464",
      }}
    >
      {better ? "+" : ""}{diff.toFixed(1)}% vs cohort
    </span>
  );
}

export default function FounderAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<string | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);

  const [totalViews, setTotalViews] = useState(0);
  const [totalDeckOpens, setTotalDeckOpens] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalPasses, setTotalPasses] = useState(0);
  const [weeklyBuckets, setWeeklyBuckets] = useState<WeekBucket[]>([]);
  const [cohort, setCohort] = useState<CohortStats | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setProfileId(user.id);

      // Ensure this user is a founder
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      if (profile?.user_type !== "founder") {
        navigate("/dashboard");
        return;
      }

      // Load founder profile for stage + industry (needed for cohort)
      const { data: fp } = await supabase
        .from("founder_profiles")
        .select("stage, industry")
        .eq("profile_id", user.id)
        .single();

      setStage(fp?.stage ?? null);
      setIndustries((fp?.industry as string[]) ?? []);

      // Fetch analytics events and swipes for this founder in parallel
      const [eventsRes, swipesRes] = await Promise.all([
        (supabase as any)
          .from("analytics_events")
          .select("event_type, created_at")
          .eq("target_id", user.id)
          .in("event_type", ["profile_view", "deck_open"])
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("swipes")
          .select("action, created_at")
          .eq("swiped_id", user.id),
      ]);

      const events: { event_type: string; created_at: string }[] = eventsRes.data ?? [];
      const swipes: { action: string; created_at: string }[] = swipesRes.data ?? [];

      const views = events.filter((e) => e.event_type === "profile_view");
      const deckOpens = events.filter((e) => e.event_type === "deck_open");
      const likes = swipes.filter((s) => s.action === "like" || s.action === "superlike");
      const passes = swipes.filter((s) => s.action === "pass");

      setTotalViews(views.length);
      setTotalDeckOpens(deckOpens.length);
      setTotalLikes(likes.length);
      setTotalPasses(passes.length);

      // Build 8-week trend buckets
      const now = Date.now();
      const buckets: WeekBucket[] = Array.from({ length: 8 }, (_, i) => {
        const weekStart = now - (7 - i) * 7 * 86400000;
        const weekEnd = weekStart + 7 * 86400000;
        const d = new Date(weekStart);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const weekViews = views.filter((e) => {
          const t = new Date(e.created_at).getTime();
          return t >= weekStart && t < weekEnd;
        }).length;
        const weekDecks = deckOpens.filter((e) => {
          const t = new Date(e.created_at).getTime();
          return t >= weekStart && t < weekEnd;
        }).length;
        return { label, views: weekViews, deckOpens: weekDecks };
      });
      setWeeklyBuckets(buckets);

      // Cohort comparison via SECURITY DEFINER RPC
      if (fp?.stage && fp?.industry?.length) {
        const { data: cohortData } = await (supabase as any).rpc("get_founder_cohort_stats", {
          p_stage: fp.stage,
          p_industries: fp.industry,
          p_exclude_id: user.id,
        });
        if (cohortData) {
          setCohort({
            cohortSize: cohortData.cohort_size ?? 0,
            medianLikeRate: cohortData.median_like_rate ?? null,
            medianViews: cohortData.median_views ?? null,
            medianDeckRate: cohortData.median_deck_rate ?? null,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const myLikeRate = pct(totalLikes, totalLikes + totalPasses);
  const myDeckRate = pct(totalDeckOpens, totalViews);
  const hasTrend = weeklyBuckets.some((b) => b.views > 0);

  // Tips based on gaps
  const tips: string[] = [];
  if (totalViews < 10) tips.push("Your profile is new — invite connections to boost early visibility.");
  if (myLikeRate != null && cohort?.medianLikeRate != null && myLikeRate < cohort.medianLikeRate)
    tips.push("Your like rate is below your cohort — try sharpening your one-liner and headline traction metric.");
  if (myDeckRate != null && cohort?.medianDeckRate != null && myDeckRate < cohort.medianDeckRate)
    tips.push("Investors are viewing your profile but not opening your deck — check that your deck link is working and visible.");
  if (!industries.length)
    tips.push("Add industries to your profile to improve discovery and cohort matching.");
  if (!stage)
    tips.push("Set your funding stage so investors filtering by stage can find you.");
  if (tips.length === 0 && myLikeRate != null && cohort?.medianLikeRate != null && myLikeRate >= cohort.medianLikeRate)
    tips.push("Your profile is performing at or above cohort median — keep your traction metrics updated to maintain momentum.");

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: PAGE_BG }}
      >
        <div style={{ color: TEXT_DIM }} className="text-sm">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: PAGE_BG }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4"
        style={{ background: "rgba(11,10,7,0.85)", backdropFilter: "blur(12px)" }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft size={20} color={TEXT} />
        </button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: TEXT }}>
            Profile Analytics
          </h1>
          {stage && (
            <p className="text-xs" style={{ color: TEXT_DIM }}>
              {stage.replace(/_/g, " ")} · {industries.slice(0, 2).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 space-y-5 mt-2">

        {/* ── Top stats ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Profile views",
              value: totalViews.toLocaleString(),
              sub: "all time",
              icon: <Eye size={15} color={GOLD} />,
            },
            {
              label: "Deck opens",
              value: totalDeckOpens.toLocaleString(),
              sub: totalViews > 0 ? `${fmtPct(myDeckRate)} of views` : "all time",
              icon: <BarChart3 size={15} color={GOLD} />,
            },
            {
              label: "Investor likes",
              value: totalLikes.toLocaleString(),
              sub: totalLikes + totalPasses > 0 ? `${fmtPct(myLikeRate)} like rate` : "all time",
              icon: <TrendingUp size={15} color={GOLD} />,
            },
            {
              label: "Investor passes",
              value: totalPasses.toLocaleString(),
              sub: `${totalLikes + totalPasses} total decisions`,
              icon: <Zap size={15} color={GOLD} />,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={glass}>
              <div className="flex items-center gap-1.5 mb-1">
                {s.icon}
                <span className="text-[11px] font-medium" style={{ color: TEXT_DIM }}>
                  {s.label}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: TEXT }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: TEXT_DIM }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 8-week trend ── */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} color={GOLD} />
            <span className="text-sm font-medium" style={{ color: TEXT }}>
              Profile views — last 8 weeks
            </span>
          </div>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyBuckets} margin={{ top: 0, bottom: 0, left: -20, right: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: TEXT_DIM }} />
                <YAxis tick={{ fontSize: 9, fill: TEXT_DIM }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="views" name="Views" radius={[3, 3, 0, 0]}>
                  {weeklyBuckets.map((_, i) => (
                    <Cell key={i} fill={i === weeklyBuckets.length - 1 ? GOLD : "rgba(198,160,44,0.35)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-24 flex items-center justify-center text-sm rounded-xl"
              style={{ color: TEXT_DIM, background: "rgba(255,255,255,0.03)" }}
            >
              No views yet — data appears as your profile gets discovered
            </div>
          )}
        </div>

        {/* ── Cohort comparison ── */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} color={GOLD} />
            <span className="text-sm font-medium" style={{ color: TEXT }}>
              vs. your cohort
            </span>
            {cohort && cohort.cohortSize > 0 && (
              <span className="text-[11px]" style={{ color: TEXT_DIM }}>
                ({cohort.cohortSize} {stage?.replace(/_/g, " ")} founders in {industries[0]})
              </span>
            )}
          </div>

          {!cohort || cohort.cohortSize < 3 ? (
            <div
              className="flex items-center gap-2 rounded-xl p-3 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", color: TEXT_DIM }}
            >
              <Lock size={14} color={GOLD} />
              Cohort data accumulating — need 3+ peers at the same stage &amp; sector
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Like rate",
                  mine: myLikeRate,
                  cohortVal: cohort.medianLikeRate,
                  fmt: (v: number | null) => fmtPct(v),
                },
                {
                  label: "Deck open rate",
                  mine: myDeckRate,
                  cohortVal: cohort.medianDeckRate,
                  fmt: (v: number | null) => fmtPct(v),
                },
                {
                  label: "Profile views",
                  mine: totalViews,
                  cohortVal: cohort.medianViews,
                  fmt: (v: number | null) => v?.toLocaleString() ?? "—",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: TEXT_DIM }}>{row.label}</span>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT }}>
                      <span>{row.fmt(row.mine)}</span>
                      {compareBadge(
                        row.mine ?? null,
                        row.cohortVal ?? null
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((row.mine ?? 0) / Math.max(row.mine ?? 0, row.cohortVal ?? 1)) * 100)}%`,
                        background: GOLD,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: TEXT_DIM }}>
                    Cohort median: {row.fmt(row.cohortVal)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tips ── */}
        {tips.length > 0 && (
          <div className="rounded-2xl p-4" style={glass}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={15} color={GOLD} />
              <span className="text-sm font-medium" style={{ color: TEXT }}>Suggestions</span>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: TEXT_DIM }}>
                  <span style={{ color: GOLD, marginTop: 1 }}>·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-[11px] pb-2" style={{ color: TEXT_DIM }}>
          Cohort medians are anonymized across peers at the same stage &amp; sector.
          Individual investor identities are never shown.
        </p>
      </div>
    </div>
  );
}
