import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDiscoverFeed, type DiscoverFilters } from "@/hooks/useDiscoverFeed";
import { useExpressInterest } from "@/hooks/useExpressInterest";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { BottomNav } from "@/components/app/BottomNav";
import { MenuDrawer } from "@/components/app/MenuDrawer";
import { MatchModal } from "@/components/MatchModal";
import { supabase } from "@/integrations/supabase/client";
import { Send, X, BadgeCheck, MapPin, Settings } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const { toast } = useToast();
  const unread = useUnreadMessages();
  const pending = usePendingRequests();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [swipesRemaining, setSwipesRemaining] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const { excludedIds } = useSwipeHistory(user?.id);
  const [filters] = useState<DiscoverFilters>({ view: "all" });
  const { profiles, loading, targetType } = useDiscoverFeed(
    user?.id,
    (user?.user_type as "founder" | "investor" | null) ?? null,
    filters,
    excludedIds
  );
  const { expressInterest } = useExpressInterest(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("swiper_id", user.id)
        .eq("action", "like")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      setSwipesRemaining(Math.max(0, 5 - (count ?? 0)));
    })();
  }, [user?.id]);

  const userType = (user?.user_type ?? null) as "founder" | "investor" | null;
  const inboxBadge = unread + pending;
  const currentProfile = profiles[cardIndex] ?? null;

  const getDetail = (p: any) => {
    if (!p) return null;
    return targetType === "founder"
      ? Array.isArray(p.founder_profiles) ? p.founder_profiles[0] : p.founder_profiles
      : Array.isArray(p.investor_profiles) ? p.investor_profiles[0] : p.investor_profiles;
  };

  const advance = () => {
    setCardIndex((i) => Math.min(i + 1, profiles.length));
    setDragX(0);
  };

  const handleLike = async () => {
    if (!currentProfile || !user) return;
    const res = await expressInterest(currentProfile.id);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Could not send interest" });
    } else if (res.matched) {
      setMatchedProfile(currentProfile);
    }
    if (!isPro && swipesRemaining !== null) setSwipesRemaining((s) => Math.max(0, (s ?? 0) - 1));
    advance();
  };

  const handlePass = () => {
    advance();
  };

  const handleSend = () => {
    if (!currentProfile) return;
    navigate(`/profile/${currentProfile.id}`);
  };

  // Drag to swipe
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - dragStartX.current);
  };

  const onPointerUp = () => {
    setIsDragging(false);
    if (dragX > 80) {
      handleLike();
    } else if (dragX < -80) {
      handlePass();
    } else {
      setDragX(0);
    }
  };

  const detail = currentProfile ? getDetail(currentProfile) : null;
  const isFounderCard = targetType === "founder";
  const isInvestorCard = targetType === "investor";

  const bgImage = currentProfile?.avatar_url ?? null;
  const name = currentProfile?.name ?? "";

  // Founder card data
  const founderStage = detail?.stage ?? null;
  const founderLocation = detail?.preferred_city ?? detail?.location ?? null;
  const founderCompany = detail?.startup_name ?? detail?.company_name ?? null;
  const founderIndustries: string[] = detail?.industry ?? [];
  const founderOneLiner: string = detail?.one_liner ?? "";
  const founderMrr: string = detail?.mrr ?? "";
  const founderBacked: string = detail?.backed_by ?? "";

  // Investor card data
  const investorLocation: string = detail?.location ?? "";
  const investorFirm: string = detail?.firm_name ?? "";
  const investorPosition: string = detail?.position ?? "";
  const investorCheck: string = detail?.typical_check_size ?? "";
  const investorStage: string = detail?.preferred_stage ?? "";
  const investorLeads: string = detail?.investor_type ?? "—";
  const investorSectors: string[] = detail?.sectors_of_interest ?? [];
  const investorThesis: string = detail?.investment_thesis ?? "";
  const isVerified = currentProfile?.is_verified ?? false;

  const outOfCards = !loading && cardIndex >= profiles.length;
  const swipeOpacity = Math.min(Math.abs(dragX) / 120, 1);
  const swipeColor = dragX > 0 ? `rgba(198,160,44,${swipeOpacity * 0.4})` : `rgba(180,60,60,${swipeOpacity * 0.4})`;

  return (
    <div
      className="relative flex flex-col min-h-[100dvh] overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(212,176,86,0.1) 0%, transparent 60%), linear-gradient(139deg, #0B0A07 0%, #060606 55%, #080709 100%)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-14 pb-3">
        <span
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#E7CB7E",
            letterSpacing: "2px",
          }}
        >
          CATALYST
        </span>
        <div className="flex items-center gap-3">
          {swipesRemaining !== null && !isPro && (
            <span style={{ color: "#94908A", fontSize: 12 }}>
              {swipesRemaining} right swipes left
            </span>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 38,
              height: 38,
              background: "rgba(255,255,255,0.05)",
              boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.2)",
              outline: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Settings size={16} color="#C6A02C" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col px-4 pb-4" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C6A02C]/30 border-t-[#C6A02C] rounded-full animate-spin" />
          </div>
        ) : outOfCards ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-10">
            <p style={{ color: "#94908A", fontSize: 15 }}>You've seen everyone for now.</p>
            {!isPro && (
              <button
                onClick={() => navigate("/settings")}
                className="px-6 py-3 rounded-full text-sm font-semibold"
                style={{ background: "#C6A02C", color: "#2A2005" }}
              >
                Go Pro — unlock the full directory
              </button>
            )}
          </div>
        ) : (
          <div
            ref={cardRef}
            className="relative flex-1 rounded-3xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
              background: bgImage
                ? "transparent"
                : "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
              outline: "1px solid rgba(255,255,255,0.12)",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Photo background */}
            {bgImage && (
              <img
                src={bgImage}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            )}

            {/* Gradient overlays */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,6,6,0.5) 0%, rgba(6,6,6,0.1) 30%, rgba(6,6,6,0.0) 45%, rgba(6,6,6,0.6) 65%, rgba(6,6,6,0.96) 100%)",
              }}
            />

            {/* Swipe color overlay */}
            {isDragging && (
              <div className="absolute inset-0" style={{ background: swipeColor, zIndex: 2 }} />
            )}

            {/* Card content */}
            <div className="relative z-10 flex flex-col h-full px-5 pb-7 pt-5">
              {/* Top chips */}
              <div className="flex items-start gap-2 flex-wrap">
                {isInvestorCard && isVerified && (
                  <Chip gold>
                    <BadgeCheck size={11} color="#2A2005" strokeWidth={2.5} />
                    Verified investor
                  </Chip>
                )}
                {isFounderCard && founderStage && <Chip>{founderStage}</Chip>}
                {isFounderCard && founderLocation && (
                  <Chip>
                    <MapPin size={10} color="#F6F5F2" strokeWidth={2} />
                    {founderLocation}
                  </Chip>
                )}
                {isInvestorCard && investorLocation && (
                  <Chip>
                    <MapPin size={10} color="#F6F5F2" strokeWidth={2} />
                    {investorLocation}
                  </Chip>
                )}
              </div>

              {/* Spacer pushes content to bottom */}
              <div className="flex-1" />

              {/* Name + subtitle */}
              <h2
                style={{
                  fontFamily: "Fraunces, serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#F6F5F2",
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}
              >
                {name}
              </h2>
              <p style={{ color: "#CFCCC5", fontSize: 13.5, marginBottom: 12 }}>
                {isFounderCard
                  ? `Founder${founderCompany ? ` · ${founderCompany}` : ""}`
                  : `${investorPosition ? investorPosition : ""}${investorFirm ? (investorPosition ? " · " : "") + investorFirm : ""}${investorLocation ? (investorFirm || investorPosition ? " · " : "") + investorLocation : ""}`}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {isFounderCard &&
                  founderIndustries.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-block px-2.5 py-1 rounded-full text-[11px]"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "#E9E7E1",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                {isInvestorCard &&
                  investorSectors.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-block px-2.5 py-1 rounded-full text-[11px]"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "#E9E7E1",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
              </div>

              {/* One-liner or thesis */}
              {isFounderCard && founderOneLiner && (
                <p
                  style={{
                    color: "#94908A",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                  }}
                >
                  {founderOneLiner}
                </p>
              )}
              {isInvestorCard && investorThesis && (
                <p
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontStyle: "italic",
                    color: "#CFCCC5",
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                  }}
                >
                  "{investorThesis}"
                </p>
              )}

              {/* Stat chips */}
              <div className="flex gap-2">
                {isFounderCard && (
                  <>
                    {founderMrr && <StatChip label="MRR" value={founderMrr} />}
                    {founderBacked && <StatChip label="Backed by" value={founderBacked} />}
                  </>
                )}
                {isInvestorCard && (
                  <>
                    {investorCheck && <StatChip label="Check" value={investorCheck} />}
                    {investorStage && <StatChip label="Focus" value={investorStage} />}
                    {investorLeads && <StatChip label="Leads" value={investorLeads} gold />}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!outOfCards && !loading && (
          <div className="flex items-center justify-center gap-5 pt-5 pb-2">
            {/* Pass */}
            <button
              onClick={handlePass}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 60,
                height: 60,
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(255,255,255,0.18)",
              }}
              aria-label="Pass"
            >
              <X size={24} color="#8E8B84" strokeWidth={2} />
            </button>

            {/* Send / Connect */}
            <button
              onClick={handleSend}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 74,
                height: 74,
                background: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(255,255,255,0.2)",
              }}
              aria-label="Connect"
            >
              <Send size={26} color="#0A0A0C" strokeWidth={2} />
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 60,
                height: 60,
                background: "#C6A02C",
                boxShadow: "0 8px 20px rgba(198,160,44,0.4)",
              }}
              aria-label="Like"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21C12 21 3 13.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 13.5 14 21 12 21Z"
                  fill="#2A2005"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Go Pro banner */}
        {!isPro && !outOfCards && !loading && (
          <div className="mt-1 pb-20 text-center">
            <button
              onClick={() => navigate("/settings")}
              style={{ color: "#94908A", fontSize: 11.5 }}
            >
              Out of swipes?{" "}
              <span style={{ color: "#E7CB7E", textDecoration: "underline" }}>
                Go Pro to search the full directory
              </span>
            </button>
          </div>
        )}
        {(outOfCards || loading) && <div style={{ paddingBottom: 80 }} />}
      </div>

      {/* Bottom Nav */}
      <BottomNav userType={userType} inboxBadge={inboxBadge} />

      {/* Menu Drawer */}
      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userType={userType}
        userId={user?.id}
        isPro={isPro}
      />

      <MatchModal
        isOpen={!!matchedProfile}
        onClose={() => setMatchedProfile(null)}
        matchedProfile={matchedProfile}
        userType={(userType ?? "founder") as "founder" | "investor"}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Chip({
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
              background: "rgba(255,255,255,0.12)",
              color: "#E9E7E1",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
            }
      }
    >
      {children}
    </span>
  );
}

function StatChip({
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
      className="inline-flex flex-col px-3 py-2 rounded-xl"
      style={{
        background: gold ? "rgba(198,160,44,0.15)" : "rgba(255,255,255,0.08)",
        border: gold ? "1px solid rgba(198,160,44,0.35)" : "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ color: "#94908A", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.7px" }}>
        {label}
      </span>
      <span style={{ color: gold ? "#E7CB7E" : "#F6F5F2", fontSize: 13, fontWeight: 600, marginTop: 1 }}>
        {value}
      </span>
    </div>
  );
}
