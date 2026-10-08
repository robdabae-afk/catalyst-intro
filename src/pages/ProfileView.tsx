import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { logEvent } from "@/lib/analytics";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useExpressInterest } from "@/hooks/useExpressInterest";
import {
  ArrowLeft,
  Share2,
  MapPin,
  BadgeCheck,
  Send,
  X,
} from "lucide-react";
import {
  MAX_TRACTION_TILES,
  POST_REVENUE_DEFAULT_TILES,
  PRE_REVENUE_METRIC_KEYS,
  TractionTileKey,
  isStrongGrowth,
  tileDef,
} from "@/lib/traction-tiles";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: "founder" | "investor";
  is_verified?: boolean | null;
  founder_profile?: {
    startup_name: string;
    company_name: string | null;
    one_liner: string;
    traction: string | null;
    industry: string[] | null;
    preferred_city: string | null;
    company_state: string | null;
    stage: string | null;
    mrr: string | null;
    backed_by: string | null;
    funding_amount: string | null;
    pitch_deck_url: string | null;
    banner_url: string | null;
    team_members?: { name: string; title: string }[] | null;
    headcount?: number | null;
    growth_mom?: string | null;
    paying_customers?: number | null;
    operations_start_date?: string | null;
    team_full_time?: boolean | null;
    waitlist_signups?: number | null;
    active_users?: string | null;
    pilots_lois?: number | null;
    product_status?: string | null;
    user_growth_mom?: string | null;
    traction_tiles?: string[] | null;
  };
  investor_profile?: {
    firm_name: string | null;
    position: string | null;
    typical_check_size: string | null;
    preferred_stage: string | null;
    sectors_of_interest: string[] | null;
    location: string | null;
    portfolio_link: string | null;
    banner_url: string | null;
    investment_thesis: string | null;
    investor_type: string | null;
    investment_count: number | null;
    notable_portfolio: string | null;
    portfolio_companies?: { name: string; logo_url: string | null }[] | null;
    response_rate?: number | null;
    avg_reply_time?: string | null;
    responsiveness_status?: string | null;
    deals_last_12mo?: number | null;
    total_invested?: string | null;
    notable_exits?: number | null;
  };
}

const OG_IMAGE_URL = "/favicon.jpg";

/** Normalizes empty-ish values (null, "", placeholder "Untitled") to undefined. */
const val = (v?: string | number | null): string | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "untitled" || s === "-" || s === "—") return undefined;
  return s;
};

/** Live months-in-operation count from a company start date. */
const monthsInOperation = (startDate?: string | null): string | undefined => {
  if (!startDate) return undefined;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return undefined;
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return undefined;
  return String(months);
};

type FounderProfile = NonNullable<ProfileData["founder_profile"]>;

/** Raw value + green-highlight rule for one traction tile. */
const tileValue = (
  key: TractionTileKey,
  fp?: FounderProfile,
): { value?: string; positive?: boolean } => {
  switch (key) {
    case "mrr":
      return { value: val(fp?.mrr) };
    case "growth_mom":
      return { value: val(fp?.growth_mom), positive: isStrongGrowth(fp?.growth_mom) };
    case "paying_customers":
      return { value: val(fp?.paying_customers) };
    case "user_growth_mom":
      return { value: val(fp?.user_growth_mom), positive: isStrongGrowth(fp?.user_growth_mom) };
    case "waitlist_signups":
      return { value: val(fp?.waitlist_signups) };
    case "active_users":
      return { value: val(fp?.active_users), positive: true };
    case "pilots_lois":
      return { value: val(fp?.pilots_lois) };
    case "product_status":
      return { value: val(fp?.product_status) };
    case "months_in_operation": {
      const months = monthsInOperation(fp?.operations_start_date);
      return { value: months, positive: months !== undefined && Number(months) > 6 };
    }
    case "headcount":
      return { value: val(fp?.headcount) };
    case "stage":
      return { value: val(fp?.stage) };
    default:
      return {};
  }
};

/** The four tile keys to render, honouring the founder's picks and revenue mode. */
const resolveTractionTiles = (fp: FounderProfile | undefined, isPostRevenue: boolean): TractionTileKey[] => {
  if (isPostRevenue) {
    const picked = (fp?.traction_tiles ?? []).filter((k) => tileDef(k)) as TractionTileKey[];
    const tiles = picked.length ? picked : POST_REVENUE_DEFAULT_TILES;
    return tiles.slice(0, MAX_TRACTION_TILES);
  }

  const picked = (fp?.traction_tiles ?? []).filter((k) => {
    const def = tileDef(k);
    return def && !def.revenueOnly;
  }) as TractionTileKey[];

  const tiles = [...picked];
  const push = (k: TractionTileKey) => {
    if (!tiles.includes(k) && tiles.length < MAX_TRACTION_TILES) tiles.push(k);
  };

  // Fill remaining slots: metrics that actually have values, then the defaults.
  PRE_REVENUE_METRIC_KEYS.forEach((k) => {
    if (tileValue(k, fp).value) push(k);
  });
  push("user_growth_mom");
  push("months_in_operation");
  PRE_REVENUE_METRIC_KEYS.forEach(push);

  return tiles.slice(0, MAX_TRACTION_TILES);
};



function PlaceholderText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "#6E6B66", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>
      {children}
    </p>
  );
}

function EmptyLine({ children = "Not added yet" }: { children?: React.ReactNode }) {
  return (
    <span style={{ color: "#6E6B66", fontSize: 13.5, fontStyle: "italic" }}>{children}</span>
  );
}

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isPro } = useAuth();
  const { expressInterest } = useExpressInterest(user?.id);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !profileData) {
        navigate("/dashboard");
        return;
      }

      if (authUser.id !== id) logEvent("profile_view", id);

      let founderProfile = null;
      let investorProfile = null;

      if (profileData.user_type === "founder") {
        const { data } = await supabase
          .from("founder_profiles")
          .select("*")
          .eq("profile_id", id)
          .single();
        founderProfile = data;
      } else {
        const { data } = await supabase
          .from("investor_profiles")
          .select("*")
          .eq("profile_id", id)
          .single();
        investorProfile = data;
      }

      setProfile({
        ...profileData,
        founder_profile: founderProfile,
        investor_profile: investorProfile,
      } as ProfileData);
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Profile link is in the clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
  };

  const handleLike = async () => {
    if (!profile || !user) return;
    const res = await expressInterest(profile.id);
    if (res.ok) {
      toast({ title: "Interest sent!" });
    } else {
      toast({ variant: "destructive", title: "Could not send interest" });
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "#060606" }}
      >
        <div className="w-8 h-8 border-2 border-[#C6A02C]/30 border-t-[#C6A02C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const isFounder = profile.user_type === "founder";
  const ogTitle = `${profile.name} on Catalyst`;
  const ogDescription = isFounder
    ? `${profile.founder_profile?.industry?.join(", ") ?? "Founder"} — Catalyst`
    : `${profile.investor_profile?.sectors_of_interest?.join(", ") ?? "Investor"} — Catalyst`;

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col"
      style={{ background: "#060606" }}
    >
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={`${window.location.origin}${OG_IMAGE_URL}`} />
        <meta property="og:url" content={`${window.location.origin}/profile/${id}`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {isFounder ? (
        <FounderView profile={profile} isOwn={user?.id === profile.id} onBack={() => navigate(-1)} onShare={handleShare} onLike={handleLike} onPass={() => navigate(-1)} />
      ) : (
        <InvestorView profile={profile} isOwn={user?.id === profile.id} onBack={() => navigate(-1)} onShare={handleShare} onLike={handleLike} onPass={() => navigate(-1)} />
      )}
    </div>
  );
}

/* ───────────────────────────────── Founder Full Profile ───────────────────────────────── */

function FounderView({
  profile,
  isOwn,
  onBack,
  onShare,
  onLike,
  onPass,
}: {
  profile: ProfileData;
  isOwn?: boolean;
  onBack: () => void;
  onShare: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  const fp = profile.founder_profile;
  const companyName = val(fp?.startup_name) ?? val(fp?.company_name);
  const location = val(fp?.preferred_city);
  const isPostRevenue = !!val(fp?.mrr) && fp?.mrr !== "Pre-revenue";
  const tractionTiles = resolveTractionTiles(fp, isPostRevenue);
  const hasRaised = !!val(fp?.funding_amount);
  const teamMembers = (fp?.team_members ?? []).filter((m) => val(m?.name));

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Hero Header */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: 390 }}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "#1A1916" }} />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,6,6,0.4) 0%, rgba(6,6,6,0) 35%, rgba(6,6,6,0.85) 70%, rgba(6,6,6,1) 100%)",
          }}
        />

        {/* Back + Share */}
        <div className="absolute top-14 left-5 right-5 flex justify-between">
          <button onClick={onBack} className="icon-btn">
            <ArrowLeft size={18} color="#F6F5F2" strokeWidth={2} />
          </button>
          <button onClick={onShare} className="icon-btn">
            <Share2 size={17} color="#F6F5F2" strokeWidth={2} />
          </button>
        </div>

        {/* Name + subtitle + location */}
        <div className="absolute left-5 right-5 bottom-3">
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#F6F5F2",
              lineHeight: 1.1,
            }}
          >
            {profile.name}
          </h1>
          <p style={{ color: "#CFCCC5", fontSize: 13.5, marginTop: 3 }}>
            Founder ·{" "}
            <span style={companyName ? undefined : { color: "#8E8B84", fontStyle: "italic" }}>
              {companyName ?? "Startup not added"}
            </span>
          </p>
          <div className="flex gap-2 flex-wrap mt-2">
            <InfoChip muted={!location}>
              <MapPin size={10} color={location ? "#F6F5F2" : "#8E8B84"} strokeWidth={2} />
              {location ?? "Location not set"}
            </InfoChip>
          </div>
        </div>
      </div>


      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-1 space-y-4 no-scrollbar">
        {isOwn && !val(fp?.one_liner) && (
          <a
            href="/onboarding"
            className="block px-4 py-3 rounded-2xl"
            style={{ background: "rgba(198,160,44,0.12)", border: "1px solid rgba(198,160,44,0.3)" }}
          >
            <span style={{ color: "#E7CB7E", fontSize: 13.5, fontWeight: 600 }}>
              Complete your profile →
            </span>
          </a>
        )}

        {/* One-liner */}
        <div>
          {val(fp?.one_liner) ? (
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#F6F5F2",
                lineHeight: 1.3,
              }}
            >
              {fp?.one_liner}
            </p>
          ) : (
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#6E6B66",
                lineHeight: 1.3,
                fontStyle: "italic",
              }}
            >
              No one-liner yet
            </p>
          )}
        </div>

        {/* Traction Card */}
        <SectionCard
          label="Traction"
          badge={isPostRevenue ? "Post-revenue" : "Pre-revenue"}
          badgeActive={isPostRevenue}
          extraBadge={fp?.team_full_time ? "Full-time team" : undefined}
        >
          <div className="space-y-3">
            <div>
              {val(fp?.traction) ? (
                <p style={{ fontFamily: "Fraunces, serif", color: "#F6F5F2", fontSize: 14, lineHeight: 1.6 }}>{fp?.traction}</p>
              ) : (
                <PlaceholderText>No traction details yet</PlaceholderText>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tractionTiles.map((key) => {
                const def = tileDef(key)!;
                const { value, positive } = tileValue(key, fp);
                return (
                  <TractionStat
                    key={key}
                    label={def.label}
                    value={value}
                    sub={def.sub}
                    positive={positive}
                  />
                );
              })}
            </div>
          </div>
        </SectionCard>


        {/* Funding Card */}
        <SectionCard label="Funding" badge={hasRaised ? "Raised" : "Not raised"} badgeActive={hasRaised}>
          <div>
            <FundingRow label="Round" value={val(fp?.stage)} />
            <FundingRow label="Amount" value={val(fp?.funding_amount)} />
            <FundingRow label="Lead" value={val(fp?.backed_by)} last />
          </div>
        </SectionCard>

        {/* Industries */}
        <SectionCard label="Industries">
          {fp?.industry && fp.industry.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {fp.industry.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          ) : (
            <EmptyLine />
          )}
        </SectionCard>

        {/* Team */}
        <SectionCard label="Team">
          {teamMembers.length > 0 || fp?.headcount != null ? (
            <div>
              {teamMembers.map((m, i) => (
                <FundingRow key={i} label={m.name} value={val(m.title)} last={i === teamMembers.length - 1 && fp?.headcount == null} />
              ))}
              {fp?.headcount != null && <FundingRow label="Headcount" value={String(fp.headcount)} last />}
            </div>
          ) : (
            <EmptyLine />
          )}
        </SectionCard>

        {/* Pitch Deck */}
        {val(fp?.pitch_deck_url) ? (
          <a
            href={fp?.pitch_deck_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logEvent("deck_open", profile?.id)}
            className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ color: "#E9E7E1", fontSize: 14 }}>View Pitch Deck</span>
            <ArrowLeft size={16} color="#94908A" style={{ transform: "rotate(180deg)" }} />
          </a>
        ) : (
          <div
            className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.12)",
            }}
          >
            <span style={{ color: "#6E6B66", fontSize: 14, fontStyle: "italic" }}>
              No pitch deck yet
            </span>
          </div>
        )}
      </div>


      {/* Sticky action bar */}
      <ActionBar onPass={onPass} onSend={() => {}} onLike={onLike} />
    </div>
  );
}

/* ───────────────────────────────── Investor Full Profile ───────────────────────────────── */

function InvestorView({
  profile,
  isOwn,
  onBack,
  onShare,
  onLike,
  onPass,
}: {
  profile: ProfileData;
  isOwn?: boolean;
  onBack: () => void;
  onShare: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  const ip = profile.investor_profile;
  const location = val(ip?.location);
  const subtitle = [val(ip?.position), val(ip?.firm_name)].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Hero Header */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 330 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "#1A1916" }} />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,6,6,0.4) 0%, rgba(6,6,6,0) 35%, rgba(6,6,6,0.8) 80%, rgba(6,6,6,1) 100%)",
          }}
        />

        {/* Back + Share */}
        <div className="absolute top-14 left-5 right-5 flex justify-between">
          <button onClick={onBack} className="icon-btn">
            <ArrowLeft size={18} color="#F6F5F2" strokeWidth={2} />
          </button>
          <button onClick={onShare} className="icon-btn">
            <Share2 size={17} color="#F6F5F2" strokeWidth={2} />
          </button>
        </div>

        {/* Chips */}
        <div className="absolute left-5 right-5 flex gap-2 flex-wrap" style={{ bottom: 72 }}>
          {profile.is_verified && (
            <InfoChip gold>
              <BadgeCheck size={11} color="#2A2005" strokeWidth={2.5} />
              Verified investor
            </InfoChip>
          )}
          <InfoChip muted={!location}>
            <MapPin size={10} color={location ? "#F6F5F2" : "#8E8B84"} strokeWidth={2} />
            {location ?? "Location not set"}
          </InfoChip>
        </div>

        {/* Name + subtitle */}
        <div className="absolute left-5 right-5 bottom-5">
          <h1
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#F6F5F2",
              lineHeight: 1.1,
            }}
          >
            {profile.name}
          </h1>
          <p style={{ color: "#CFCCC5", fontSize: 13.5, marginTop: 3 }}>
            {subtitle || (
              <span style={{ color: "#8E8B84", fontStyle: "italic" }}>Firm not added</span>
            )}
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-5 space-y-4 no-scrollbar">
        {isOwn && !val(ip?.investment_thesis) && (
          <a
            href="/onboarding"
            className="block px-4 py-3 rounded-2xl"
            style={{ background: "rgba(198,160,44,0.12)", border: "1px solid rgba(198,160,44,0.3)" }}
          >
            <span style={{ color: "#E7CB7E", fontSize: 13.5, fontWeight: 600 }}>
              Complete your profile →
            </span>
          </a>
        )}

        {/* Stat chips row */}
        <div className="flex gap-2 flex-wrap">
          <BigStatChip label="Check" value={val(ip?.typical_check_size)} />
          <BigStatChip label="Focus" value={val(ip?.preferred_stage)} />
          <BigStatChip label="Leads" value={val(ip?.investor_type)} gold />
        </div>

        {/* Investment thesis */}
        <SectionCard label="Investment Thesis">
          {val(ip?.investment_thesis) ? (
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontStyle: "italic",
                color: "#E9E7E1",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              "{ip?.investment_thesis}"
            </p>
          ) : (
            <EmptyLine>No thesis shared yet</EmptyLine>
          )}
        </SectionCard>

        {/* Sectors */}
        <SectionCard label="Sectors of Interest">
          {ip?.sectors_of_interest && ip.sectors_of_interest.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ip.sectors_of_interest.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          ) : (
            <EmptyLine />
          )}
        </SectionCard>

        {/* Responsiveness */}
        <SectionCard label="Responsiveness">
          <div>
            <FundingRow
              label="Response rate"
              value={ip?.response_rate != null ? `${ip.response_rate}%` : undefined}
            />
            <FundingRow label="Avg. reply time" value={val(ip?.avg_reply_time)} />
            <div className="flex items-center justify-between py-2">
              <span style={{ color: "#94908A", fontSize: 13.5 }}>Active</span>
              {val(ip?.responsiveness_status) ? (
                <span style={{ color: "#5EC98E", fontSize: 13.5, fontWeight: 500 }}>{ip?.responsiveness_status}</span>
              ) : (
                <EmptyLine>—</EmptyLine>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Portfolio companies */}
        <SectionCard label="Portfolio Companies">
          {ip?.portfolio_companies && ip.portfolio_companies.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {ip.portfolio_companies.map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(198,160,44,0.15)", border: "1px solid #C6A02C" }}
                    >
                      <span style={{ color: "#C6A02C", fontSize: 11, fontWeight: 700 }}>{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span style={{ color: "#F6F5F2", fontSize: 13 }}>{c.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine />
          )}
        </SectionCard>

        {/* Portfolio stats */}
        <SectionCard label="Portfolio">
          <FundingRow
            label="Deals (12 mo)"
            value={ip?.deals_last_12mo != null ? String(ip.deals_last_12mo) : undefined}
          />
          <FundingRow label="Total invested" value={val(ip?.total_invested)} />
          <FundingRow
            label="Notable exits"
            value={ip?.notable_exits != null ? String(ip.notable_exits) : undefined}
          />
          <div className="flex justify-between py-2">
            <span style={{ color: "#94908A", fontSize: 13.5 }}>Notable portfolio</span>
            {val(ip?.notable_portfolio) ? (
              <span style={{ color: "#F6F5F2", fontSize: 13.5, fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>
                {ip?.notable_portfolio}
              </span>
            ) : (
              <EmptyLine>—</EmptyLine>
            )}
          </div>
          {val(ip?.portfolio_link) && (
            <a
              href={ip?.portfolio_link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between mt-2 pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span style={{ color: "#E7CB7E", fontSize: 13.5 }}>View portfolio</span>
              <ArrowLeft size={16} color="#E7CB7E" style={{ transform: "rotate(180deg)" }} />
            </a>
          )}
        </SectionCard>
      </div>


      {/* Sticky action bar */}
      <ActionBar onPass={onPass} onSend={() => {}} onLike={onLike} />
    </div>
  );
}

/* ───────────────────────────────── Shared sub-components ───────────────────────────────── */

function ActionBar({
  onPass,
  onSend,
  onLike,
}: {
  onPass: () => void;
  onSend: () => void;
  onLike: () => void;
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-5 px-6 pt-4 pb-8"
      style={{
        background:
          "linear-gradient(0deg, rgba(6,6,6,1) 60%, rgba(6,6,6,0) 100%)",
      }}
    >
      <button
        onClick={onPass}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 58,
          height: 58,
          background: "rgba(255,255,255,0.07)",
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}
        aria-label="Pass"
      >
        <X size={23} color="#8E8B84" strokeWidth={2} />
      </button>
      <button
        onClick={onSend}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 70,
          height: 70,
          background: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(255,255,255,0.2)",
        }}
        aria-label="Connect"
      >
        <Send size={24} color="#0A0A0C" strokeWidth={2} />
      </button>
      <button
        onClick={onLike}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 58,
          height: 58,
          background: "#C6A02C",
          boxShadow: "0 8px 20px rgba(198,160,44,0.4)",
        }}
        aria-label="Like"
      >
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21C12 21 3 13.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 13.5 14 21 12 21Z"
            fill="#2A2005"
          />
        </svg>
      </button>
    </div>
  );
}

function InfoChip({
  children,
  gold,
  muted,
}: {
  children: React.ReactNode;
  gold?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium"
      style={
        gold
          ? { background: "#C6A02C", color: "#2A2005" }
          : muted
          ? {
              background: "rgba(255,255,255,0.05)",
              color: "#8E8B84",
              border: "1px dashed rgba(255,255,255,0.18)",
              fontStyle: "italic",
              backdropFilter: "blur(8px)",
            }
          : {
              background: "rgba(255,255,255,0.14)",
              color: "#E9E7E1",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(8px)",
            }
      }
    >
      {children}
    </span>
  );
}

function SectionCard({
  label,
  badge,
  badgeActive = true,
  extraBadge,
  children,
}: {
  label: string;
  badge?: string;
  badgeActive?: boolean;
  extraBadge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="px-4 py-4 rounded-2xl"
      style={{
        background:
          "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <p
          style={{
            color: "#94908A",
            fontSize: 10.5,
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {extraBadge && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={{ border: "1px solid rgba(198,160,44,0.45)", color: "#C6A02C" }}
            >
              {extraBadge}
            </span>
          )}
          {badge && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap"
              style={
                badgeActive
                  ? { background: "#C6A02C", color: "#2A2005" }
                  : { border: "1px solid rgba(255,255,255,0.18)", color: "#CFCCC5" }
              }
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function FundingRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  const v = val(value);
  return (
    <div
      className="flex items-center justify-between py-2"
      style={last ? undefined : { borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span style={{ color: "#94908A", fontSize: 13.5 }}>{label}</span>
      <span
        style={
          v
            ? { color: "#F6F5F2", fontSize: 13.5, fontWeight: 500 }
            : { color: "#6E6B66", fontSize: 13.5, fontWeight: 500 }
        }
      >
        {v ?? "—"}
      </span>
    </div>
  );
}

function TractionStat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value?: string | number | null;
  sub?: string;
  positive?: boolean;
}) {
  const v = val(value);
  return (
    <div
      className="flex flex-col items-center px-3 py-3 rounded-xl"
      style={{
        background: v ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: v ? "1px solid rgba(255,255,255,0.08)" : "1px dashed rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="text-center"
        style={{ color: "#94908A", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.6px" }}
      >
        {label}
      </span>
      <span
        style={{
          color: !v ? "#6E6B66" : positive ? "#5EC98E" : "#F6F5F2",
          fontSize: 18,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {v ?? "—"}
      </span>
      {sub && <span style={{ color: "#7D7972", fontSize: 9.5, marginTop: 1 }}>{sub}</span>}
    </div>
  );
}


function BigStatChip({
  label,
  value,
  gold,
}: {
  label: string;
  value?: string | null;
  gold?: boolean;
}) {
  const v = val(value);
  return (
    <div
      className="inline-flex flex-col px-4 py-3 rounded-2xl"
      style={{
        background: !v
          ? "rgba(255,255,255,0.03)"
          : gold
          ? "rgba(198,160,44,0.12)"
          : "rgba(255,255,255,0.06)",
        border: !v
          ? "1px dashed rgba(255,255,255,0.12)"
          : gold
          ? "1px solid rgba(198,160,44,0.3)"
          : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ color: "#94908A", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label}
      </span>
      <span
        style={{
          color: !v ? "#6E6B66" : gold ? "#E7CB7E" : "#F6F5F2",
          fontSize: 17,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {v ?? "—"}
      </span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1.5 rounded-full text-[12px]"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.14)",
        color: "#E9E7E1",
      }}
    >
      {children}
    </span>
  );
}
