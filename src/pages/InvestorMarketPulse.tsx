import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowLeft, TrendingUp, DollarSign, ThumbsDown, Lock, Star, Crown } from "lucide-react";
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

interface SectorRow {
  sector: string;
  likes: number;
  passes: number;
  total_swipes: number;
  like_rate_pct: number | null;
  isFocus?: boolean;
}

interface PassReasonRow {
  pass_reason: string;
  count: number;
  pct: number | null;
}

interface DealTermsRow {
  total_safes: number;
  with_cap: number;
  with_discount: number;
  avg_check_size: number | null;
  cap_p25: number | null;
  cap_median: number | null;
  cap_p75: number | null;
  discount_median: number | null;
}

const fmt$ = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Number(n).toLocaleString()}`;
};

export default function InvestorMarketPulse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [passReasons, setPassReasons] = useState<PassReasonRow[]>([]);
  const [dealTerms, setDealTerms] = useState<DealTermsRow | null>(null);
  const [focusSectors, setFocusSectors] = useState<string[]>([]);

  const { isPro } = useSubscription(userId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Investors only
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      if (profile?.user_type !== "investor") {
        navigate("/dashboard");
        return;
      }

      const [invRes, sectorRes, reasonRes, termsRes] = await Promise.all([
        supabase.from("investor_profiles").select("sectors_of_interest").eq("profile_id", user.id).maybeSingle(),
        (supabase as any).from("v_sector_demand").select("*"),
        (supabase as any).from("v_pass_reasons").select("*"),
        (supabase as any).from("v_deal_terms").select("*").maybeSingle(),
      ]);

      const focus: string[] = (invRes.data?.sectors_of_interest as string[]) ?? [];
      setFocusSectors(focus);

      const focusSet = new Set(focus.map((s) => s.toLowerCase()));
      const rows: SectorRow[] = ((sectorRes.data ?? []) as SectorRow[]).map((r) => ({
        ...r,
        like_rate_pct: r.like_rate_pct != null ? Number(r.like_rate_pct) : null,
        isFocus: focusSet.has(r.sector?.toLowerCase?.() ?? ""),
      }));
      // Pin focus sectors to the top, then by like rate
      rows.sort((a, b) => {
        if (!!a.isFocus !== !!b.isFocus) return a.isFocus ? -1 : 1;
        return (b.like_rate_pct ?? 0) - (a.like_rate_pct ?? 0);
      });
      setSectors(rows.slice(0, 12));

      setPassReasons(
        ((reasonRes.data ?? []) as PassReasonRow[]).map((r) => ({
          ...r,
          pct: r.pct != null ? Number(r.pct) : null,
        }))
      );

      setDealTerms(termsRes.data ? {
        ...termsRes.data,
        avg_check_size: termsRes.data.avg_check_size != null ? Number(termsRes.data.avg_check_size) : null,
        cap_p25: termsRes.data.cap_p25 != null ? Number(termsRes.data.cap_p25) : null,
        cap_median: termsRes.data.cap_median != null ? Number(termsRes.data.cap_median) : null,
        cap_p75: termsRes.data.cap_p75 != null ? Number(termsRes.data.cap_p75) : null,
        discount_median: termsRes.data.discount_median != null ? Number(termsRes.data.discount_median) : null,
      } : null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
        <div style={{ color: TEXT_DIM }} className="text-sm">Loading market pulse…</div>
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
        <button onClick={() => navigate(-1)} className="p-1.5" aria-label="Back">
          <ArrowLeft size={20} color={TEXT} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: TEXT }}>Market Pulse</h1>
          <p className="text-xs" style={{ color: TEXT_DIM }}>
            Live demand &amp; deal-term benchmarks from Catalyst activity
          </p>
        </div>
        <Crown size={18} color={GOLD} />
      </div>

      <div className="px-4 space-y-5 mt-2 relative">
        {/* Pro gate overlay */}
        {!isPro && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-24 px-8 text-center"
            style={{ background: "rgba(8,7,6,0.55)", backdropFilter: "blur(7px)" }}
          >
            <div className="rounded-2xl p-6 w-full max-w-sm" style={glass}>
              <Lock size={28} color={GOLD} className="mx-auto mb-3" />
              <p style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>Market Pulse is a Pro feature</p>
              <p style={{ color: TEXT_DIM, fontSize: 13, marginTop: 8, lineHeight: "19px" }}>
                See which sectors investors are backing right now, median SAFE caps, and why
                deals get passed — aggregated across the whole platform.
              </p>
              <button
                onClick={() => navigate("/settings")}
                className="mt-4 w-full py-2.5 rounded-xl font-bold"
                style={{
                  background: "radial-gradient(ellipse 120% 120% at 30% 20%, #E7CB7E 0%, #C6A02C 100%)",
                  color: "#2A2005",
                  fontSize: 14,
                }}
              >
                Get Pro
              </button>
            </div>
          </div>
        )}

        {/* Sector heat */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} color={GOLD} />
            <span className="text-sm font-medium" style={{ color: TEXT }}>Sector demand</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: TEXT_DIM }}>
            Investor like rate by founder sector (≥ 5 decisions).
            {focusSectors.length > 0 && " Your focus sectors are pinned with a star."}
          </p>
          {sectors.length === 0 ? (
            <EmptyNote text="Accumulating data — sectors appear once they clear 5 investor decisions." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, sectors.length * 32)}>
              <BarChart data={sectors} layout="vertical" margin={{ left: 4, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: TEXT_DIM }} />
                <YAxis
                  type="category"
                  dataKey="sector"
                  width={96}
                  tick={({ x, y, payload }: any) => {
                    const row = sectors.find((s) => s.sector === payload.value);
                    return (
                      <text x={x} y={y} dy={4} textAnchor="end" fontSize={10.5} fill={row?.isFocus ? GOLD_LIGHT : TEXT_DIM}>
                        {row?.isFocus ? "★ " : ""}{payload.value}
                      </text>
                    );
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as SectorRow;
                    return (
                      <div className="rounded-lg p-2 text-xs" style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.14)", color: TEXT }}>
                        <div className="font-semibold">{d.sector}</div>
                        <div style={{ color: TEXT_DIM }}>{d.likes} likes · {d.passes} passes</div>
                        <div style={{ color: GOLD_LIGHT }}>{d.like_rate_pct?.toFixed(1)}% like rate</div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="like_rate_pct" radius={[0, 3, 3, 0]}>
                  {sectors.map((s, i) => (
                    <Cell key={i} fill={s.isFocus ? GOLD : "rgba(198,160,44,0.38)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Deal terms */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} color={GOLD} />
            <span className="text-sm font-medium" style={{ color: TEXT }}>SAFE terms benchmark</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: TEXT_DIM }}>
            From {dealTerms?.total_safes ?? 0} SAFEs executed on platform
          </p>
          {!dealTerms || dealTerms.total_safes < 3 ? (
            <EmptyNote text="Accumulating SAFE data — benchmarks unlock at 3+ recorded SAFEs." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Cap · P25" value={fmt$(dealTerms.cap_p25)} />
              <Stat label="Cap · Median" value={fmt$(dealTerms.cap_median)} gold />
              <Stat label="Cap · P75" value={fmt$(dealTerms.cap_p75)} />
              <Stat label="Avg check" value={fmt$(dealTerms.avg_check_size)} />
              {dealTerms.discount_median != null && (
                <Stat label="Median discount" value={`${dealTerms.discount_median.toFixed(1)}%`} />
              )}
            </div>
          )}
        </div>

        {/* Pass reasons */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-center gap-2 mb-1">
            <ThumbsDown size={15} color={GOLD} />
            <span className="text-sm font-medium" style={{ color: TEXT }}>Why deals get passed</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: TEXT_DIM }}>
            One-tap pass reasons across all investors
          </p>
          {passReasons.length === 0 ? (
            <EmptyNote text="No pass reasons recorded yet — data accumulates as investors pass with a reason." />
          ) : (
            <div className="space-y-3">
              {passReasons.map((r, i) => (
                <div key={r.pass_reason}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize" style={{ color: TEXT }}>{r.pass_reason}</span>
                    <span style={{ color: TEXT_DIM }}>{r.count} ({r.pct?.toFixed(0) ?? 0}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.pct ?? 0}%`, background: i === 0 ? GOLD : GOLD_LIGHT }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] pb-2" style={{ color: TEXT_DIM }}>
          All figures are aggregated and anonymized. Segments with fewer than 5 underlying
          decisions are excluded.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_DIM }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: gold ? GOLD_LIGHT : TEXT }}>{value}</div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div
      className="h-20 flex items-center justify-center text-sm rounded-xl px-4 text-center"
      style={{ color: TEXT_DIM, background: "rgba(255,255,255,0.03)" }}
    >
      {text}
    </div>
  );
}
