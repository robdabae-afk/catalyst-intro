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
  onBack,
  onShare,
  onLike,
  onPass,
}: {
  profile: ProfileData;
  onBack: () => void;
  onShare: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  const fp = profile.founder_profile;
  const companyName = fp?.startup_name ?? fp?.company_name ?? "";
  const location = fp?.preferred_city ?? "";
  const isPostRevenue = !!fp?.mrr && fp.mrr !== "Pre-revenue";
  const hasRaised = !!fp?.funding_amount;
  const teamMembers = fp?.team_members ?? [];

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Hero Header */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height: 330 }}
      >
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
          {fp?.stage && <InfoChip>{fp.stage}</InfoChip>}
          {location && (
            <InfoChip>
              <MapPin size={10} color="#F6F5F2" strokeWidth={2} />
              {location}
            </InfoChip>
          )}
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
            Founder{companyName ? ` · ${companyName}` : ""}
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-5 space-y-4 no-scrollbar">
        {/* One-liner */}
        {fp?.one_liner && (
          <div>
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#F6F5F2",
                lineHeight: 1.3,
              }}
            >
              {fp.one_liner}
            </p>
          </div>
        )}
        {fp?.traction && (
          <p style={{ color: "#94908A", fontSize: 14, lineHeight: 1.6 }}>{fp.traction}</p>
        )}

        {/* Traction Card */}
        {(fp?.mrr || fp?.backed_by || fp?.funding_amount) && (
          <SectionCard label="Traction" badge={isPostRevenue ? "Post-revenue" : "Pre-revenue"} badgeActive={isPostRevenue}>
            <div className="grid grid-cols-2 gap-3">
              {fp?.mrr && <TractionStat label="MRR" value={fp.mrr} />}
              {fp?.backed_by && <TractionStat label="Backed by" value={fp.backed_by} />}
              {fp?.funding_amount && <TractionStat label="Raised" value={fp.funding_amount} />}
              {fp?.stage && <TractionStat label="Stage" value={fp.stage} />}
            </div>
          </SectionCard>
        )}

        {/* Funding Card */}
        {(fp?.funding_amount || fp?.backed_by) && (
          <SectionCard label="Funding" badge={hasRaised ? "Raised" : "Not raised"} badgeActive={hasRaised}>
            <div>
              {fp?.stage && <FundingRow label="Round" value={fp.stage} />}
              {fp?.funding_amount && <FundingRow label="Amount" value={fp.funding_amount} />}
              {fp?.backed_by && <FundingRow label="Lead" value={fp.backed_by} last />}
            </div>
          </SectionCard>
        )}

        {/* Industries */}
        {fp?.industry && fp.industry.length > 0 && (
          <SectionCard label="Industries">
            <div className="flex flex-wrap gap-2">
              {fp.industry.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Team */}
        {(teamMembers.length > 0 || fp?.headcount) && (
          <SectionCard label="Team">
            <div>
              {teamMembers.map((m, i) => (
                <FundingRow key={i} label={m.name} value={m.title} last={i === teamMembers.length - 1 && !fp?.headcount} />
              ))}
              {fp?.headcount != null && <FundingRow label="Headcount" value={String(fp.headcount)} last />}
            </div>
          </SectionCard>
        )}

        {/* Pitch Deck */}
        {fp?.pitch_deck_url && (
          <a
            href={fp.pitch_deck_url}
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
  onBack,
  onShare,
  onLike,
  onPass,
}: {
  profile: ProfileData;
  onBack: () => void;
  onShare: () => void;
  onLike: () => void;
  onPass: () => void;
}) {
  const ip = profile.investor_profile;
  const location = ip?.location ?? "";
  const subtitle = [ip?.position, ip?.firm_name].filter(Boolean).join(" · ");

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
          {location && (
            <InfoChip>
              <MapPin size={10} color="#F6F5F2" strokeWidth={2} />
              {location}
            </InfoChip>
          )}
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
          {subtitle && (
            <p style={{ color: "#CFCCC5", fontSize: 13.5, marginTop: 3 }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-5 space-y-4 no-scrollbar">
        {/* Stat chips row */}
        <div className="flex gap-2 flex-wrap">
          {ip?.typical_check_size && (
            <BigStatChip label="Check" value={ip.typical_check_size} />
          )}
          {ip?.preferred_stage && (
            <BigStatChip label="Focus" value={String(ip.preferred_stage)} />
          )}
          {ip?.investor_type && (
            <BigStatChip label="Leads" value={ip.investor_type} gold />
          )}
        </div>

        {/* Investment thesis */}
        {ip?.investment_thesis && (
          <SectionCard label="Investment Thesis">
            <p
              style={{
                fontFamily: "Fraunces, serif",
                fontStyle: "italic",
                color: "#E9E7E1",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              "{ip.investment_thesis}"
            </p>
          </SectionCard>
        )}

        {/* Sectors */}
        {ip?.sectors_of_interest && ip.sectors_of_interest.length > 0 && (
          <SectionCard label="Sectors of Interest">
            <div className="flex flex-wrap gap-2">
              {ip.sectors_of_interest.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Responsiveness */}
        {(ip?.response_rate != null || ip?.avg_reply_time || ip?.responsiveness_status) && (
          <SectionCard label="Responsiveness">
            <div>
              {ip?.response_rate != null && <FundingRow label="Response rate" value={`${ip.response_rate}%`} />}
              {ip?.avg_reply_time && <FundingRow label="Avg. reply time" value={ip.avg_reply_time} />}
              {ip?.responsiveness_status && (
                <div className="flex items-center justify-between py-2">
                  <span style={{ color: "#94908A", fontSize: 13.5 }}>Active</span>
                  <span style={{ color: "#5EC98E", fontSize: 13.5, fontWeight: 500 }}>{ip.responsiveness_status}</span>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Portfolio companies */}
        {ip?.portfolio_companies && ip.portfolio_companies.length > 0 && (
          <SectionCard label="Portfolio Companies">
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
          </SectionCard>
        )}

        {/* Portfolio stats */}
        {(ip?.investment_count || ip?.notable_portfolio || ip?.portfolio_link || ip?.deals_last_12mo != null || ip?.total_invested || ip?.notable_exits != null) && (
          <SectionCard label="Portfolio">
            {ip?.deals_last_12mo != null && <FundingRow label="Deals (12 mo)" value={String(ip.deals_last_12mo)} />}
            {ip?.total_invested && <FundingRow label="Total invested" value={ip.total_invested} />}
            {ip?.notable_exits != null && <FundingRow label="Notable exits" value={String(ip.notable_exits)} />}
            {ip?.investment_count != null && ip?.deals_last_12mo == null && (
              <FundingRow label="Total deals" value={String(ip.investment_count)} />
            )}
            {ip?.notable_portfolio && (
              <div className="flex justify-between py-2">
                <span style={{ color: "#94908A", fontSize: 13.5 }}>Notable portfolio</span>
                <span style={{ color: "#F6F5F2", fontSize: 13.5, fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>
                  {ip.notable_portfolio}
                </span>
              </div>
            )}
            {ip?.portfolio_link && (
              <a
                href={ip.portfolio_link}
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
        )}
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
}: {
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium"
      style={
        gold
          ? { background: "#C6A02C", color: "#2A2005" }
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
  children,
}: {
  label: string;
  badge?: string;
  badgeActive?: boolean;
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
      <div className="flex items-center justify-between mb-3">
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
        {badge && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
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
      {children}
    </div>
  );
}

function FundingRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={last ? undefined : { borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span style={{ color: "#94908A", fontSize: 13.5 }}>{label}</span>
      <span style={{ color: "#F6F5F2", fontSize: 13.5, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function TractionStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col px-3 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span style={{ color: "#94908A", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.6px" }}>
        {label}
      </span>
      <span style={{ color: "#F6F5F2", fontSize: 18, fontWeight: 700, marginTop: 2 }}>{value}</span>
    </div>
  );
}

function BigStatChip({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      className="inline-flex flex-col px-4 py-3 rounded-2xl"
      style={{
        background: gold ? "rgba(198,160,44,0.12)" : "rgba(255,255,255,0.06)",
        border: gold ? "1px solid rgba(198,160,44,0.3)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ color: "#94908A", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label}
      </span>
      <span style={{ color: gold ? "#E7CB7E" : "#F6F5F2", fontSize: 17, fontWeight: 700, marginTop: 2 }}>
        {value}
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
