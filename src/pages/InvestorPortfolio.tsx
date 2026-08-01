import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, ExternalLink, Newspaper, Pencil, TrendingUp } from "lucide-react";

const GOLD = "#C6A02C";
const TEXT = "#F6F5F2";
const TEXT_DIM = "#94908A";
const glass = {
  background: "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
  outline: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(10px)",
} as const;

interface PortfolioCompany {
  name: string;
  logo_url: string | null;
}

interface StartupUpdate {
  id: string;
  founder_id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  startup_name: string;
  logo_url: string | null;
}

export default function InvestorPortfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [totalInvested, setTotalInvested] = useState<string | null>(null);
  const [dealsCount, setDealsCount] = useState<number>(0);
  const [updates, setUpdates] = useState<StartupUpdate[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: ip } = await supabase
        .from("investor_profiles")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

      const portfolio: PortfolioCompany[] = ((ip as any)?.portfolio_companies ?? []).filter(
        (c: any) => c?.name?.trim()
      );
      setCompanies(portfolio);
      setTotalInvested((ip as any)?.total_invested ?? null);

      const { count } = await supabase
        .from("safes")
        .select("id", { count: "exact", head: true })
        .eq("investor_id", user.id);
      setDealsCount(count ?? 0);

      if (portfolio.length > 0) {
        const { data: rawUpdates } = await (supabase as any)
          .from("startup_updates")
          .select("id, founder_id, title, body, link, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        const founderIds = [...new Set((rawUpdates ?? []).map((u: any) => u.founder_id))];
        let matched: StartupUpdate[] = [];
        if (founderIds.length > 0) {
          const { data: fps } = await supabase
            .from("founder_profiles")
            .select("profile_id, startup_name")
            .in("profile_id", founderIds as string[]);
          const byFounder = new Map((fps ?? []).map((f: any) => [f.profile_id, f]));
          const logoByName = new Map(
            portfolio.map((c) => [c.name.trim().toLowerCase(), c.logo_url])
          );
          matched = (rawUpdates ?? [])
            .map((u: any) => {
              const fp = byFounder.get(u.founder_id);
              const key = (fp?.startup_name ?? "").trim().toLowerCase();
              if (!fp || !logoByName.has(key)) return null;
              return { ...u, startup_name: fp.startup_name, logo_url: logoByName.get(key) ?? null };
            })
            .filter(Boolean) as StartupUpdate[];
        }
        setUpdates(matched);
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const visibleUpdates = useMemo(
    () =>
      selectedCompany
        ? updates.filter((u) => u.startup_name.trim().toLowerCase() === selectedCompany)
        : updates,
    [updates, selectedCompany]
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(212,176,86,0.13) 0%, rgba(212,176,86,0) 58%), radial-gradient(ellipse 95% 90% at 88% 96%, rgba(120,92,30,0.16) 0%, rgba(120,92,30,0) 62%), linear-gradient(139deg, #0B0A07 0%, #060606 55%, #080709 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full"
          style={{ width: 38, height: 38, ...glass }}
          aria-label="Back"
        >
          <ArrowLeft size={17} color={TEXT_DIM} />
        </button>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "2.38px",
            wordWrap: "break-word",
          }}
        >
          <span style={{ color: TEXT }}>CAT</span>
          <span style={{ color: GOLD }}>A</span>
          <span style={{ color: TEXT }}>LYST</span>
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div className="px-6 pb-2">
        <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, fontFamily: "Fraunces, serif" }}>
          Portfolio
        </h1>
        <p style={{ color: TEXT_DIM, fontSize: 13, marginTop: 2 }}>
          Your companies, cap table and startup updates
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-12 space-y-4 no-scrollbar pt-3">
        {loading ? (
          <div className="flex items-center justify-center pt-16">
            <div className="w-8 h-8 border-2 border-[#C6A02C]/30 border-t-[#C6A02C] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Companies" value={String(companies.length)} />
              <StatCard label="Total invested" value={totalInvested || "—"} />
              <StatCard label="Tracked deals" value={String(dealsCount)} />
            </div>

            {/* Portfolio companies */}
            <div className="rounded-[18px] p-4" style={glass}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={15} color={GOLD} />
                  <span style={{ color: TEXT, fontSize: 14.5, fontWeight: 600 }}>
                    Portfolio companies
                  </span>
                </div>
                <button
                  onClick={() => navigate("/settings#section-portfolio")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Pencil size={11} color={TEXT_DIM} />
                  <span style={{ color: TEXT_DIM, fontSize: 11.5 }}>Manage</span>
                </button>
              </div>

              {companies.length === 0 ? (
                <p style={{ color: TEXT_DIM, fontSize: 13 }}>
                  No portfolio companies yet. Add them in Settings to see their news and investor
                  updates here.
                </p>
              ) : (
                <div className="space-y-2">
                  {companies.map((c) => {
                    const key = c.name.trim().toLowerCase();
                    const active = selectedCompany === key;
                    const count = updates.filter(
                      (u) => u.startup_name.trim().toLowerCase() === key
                    ).length;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelectedCompany(active ? null : key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left"
                        style={{
                          background: active ? "rgba(198,160,44,0.12)" : "rgba(255,255,255,0.04)",
                          outline: active
                            ? "1px solid rgba(198,160,44,0.5)"
                            : "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {c.logo_url ? (
                          <img
                            src={c.logo_url}
                            alt={c.name}
                            className="w-9 h-9 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <Building2 size={15} color="#6F6B63" />
                          </div>
                        )}
                        <span className="flex-1 truncate" style={{ color: TEXT, fontSize: 13.5, fontWeight: 500 }}>
                          {c.name}
                        </span>
                        {count > 0 && (
                          <span
                            className="flex items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                            style={{
                              minWidth: 18,
                              height: 18,
                              padding: "0 5px",
                              background: GOLD,
                              color: "#2A2005",
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Updates feed */}
            <div className="rounded-[18px] p-4" style={glass}>
              <div className="flex items-center gap-2 mb-3">
                <Newspaper size={15} color={GOLD} />
                <span style={{ color: TEXT, fontSize: 14.5, fontWeight: 600 }}>
                  News & investor updates
                </span>
                {selectedCompany && (
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="ml-auto px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <span style={{ color: TEXT_DIM, fontSize: 11 }}>Show all</span>
                  </button>
                )}
              </div>

              {visibleUpdates.length === 0 ? (
                <p style={{ color: TEXT_DIM, fontSize: 13 }}>
                  {companies.length === 0
                    ? "Add portfolio companies to follow their updates."
                    : "No updates from your portfolio companies yet."}
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleUpdates.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-2xl p-3.5"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        outline: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {u.logo_url ? (
                          <img src={u.logo_url} alt="" className="w-5 h-5 rounded-md object-cover" />
                        ) : null}
                        <span style={{ color: GOLD, fontSize: 11.5, fontWeight: 600 }}>
                          {u.startup_name}
                        </span>
                        <span style={{ color: "#6F6B63", fontSize: 11 }} className="ml-auto">
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                      <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 600 }}>{u.title}</p>
                      {u.body && (
                        <p style={{ color: "#CFCCC5", fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>
                          {u.body}
                        </p>
                      )}
                      {u.link && (
                        <a
                          href={u.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2"
                          style={{ color: GOLD, fontSize: 12 }}
                        >
                          <ExternalLink size={12} />
                          Open link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracked deals link */}
            <button
              onClick={() => navigate("/investments")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[18px] text-left"
              style={glass}
            >
              <TrendingUp size={16} color={GOLD} />
              <div className="flex-1">
                <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 600 }}>Tracked deals</p>
                <p style={{ color: TEXT_DIM, fontSize: 11.5 }}>
                  Manually track SAFEs and investment terms
                </p>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] px-3 py-3 flex flex-col gap-1" style={glass}>
      <span style={{ color: TEXT_DIM, fontSize: 10.5, letterSpacing: 0.3 }}>{label}</span>
      <span className="truncate" style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
