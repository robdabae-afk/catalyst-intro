import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useNewMatches } from "@/hooks/useNewMatches";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/app/BottomNav";
import { MenuDrawer } from "@/components/app/MenuDrawer";
import { StartupUpdateCard } from "@/components/app/StartupUpdateCard";
import { useStartupUpdates } from "@/hooks/useStartupUpdates";
import { RequestIntroBanner, type IntroTarget } from "@/components/app/RequestIntroBanner";
import { Settings } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introTarget, setIntroTarget] = useState<IntroTarget | null>(null);
  const newMatchCount = useNewMatches();
  const unread = useUnreadMessages();
  const pending = usePendingRequests();

  useEffect(() => {
    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/auth");
        return;
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const name = user.name ?? "";
    setFirstName(name.split(" ")[0] || "");
  }, [user]);

  const userType = (user?.user_type ?? null) as "founder" | "investor" | null;
  const { events, news: _news, loading } = useHomeFeed(user?.id ?? null, userType);

  // Founder updates feed powers the "Latest updates" previews
  const { items: updates } = useStartupUpdates(user?.id ?? null, 10);

  const inboxBadge = unread + pending;

  const matchLabel =
    userType === "investor"
      ? "Founders who fit your thesis are waiting."
      : "Investors interested in your space are waiting.";

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 58%), radial-gradient(ellipse 95% 90% at 88% 96%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 62%), linear-gradient(139deg, #FFFFFF 0%, #FFFFFF 55%, #FFFFFF 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-2">
        <div>
          <p style={{ color: "#74746D", fontSize: 13 }}>Welcome back,</p>
          <h1 style={{ color: "#0B0B0B", fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>
            {firstName || "…"}
          </h1>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 46,
            height: 46,
            background:
              "linear-gradient(155deg, rgba(11,11,11,0.054) 0%, rgba(11,11,11,0.018) 100%)",
            boxShadow: "inset 0px 1px 0px 1px rgba(11,11,11,0.12)",
            outline: "1px solid rgba(11,11,11,0.108)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Open menu"
        >
          <Settings size={20} color="#0B0B0B" strokeWidth={1.5} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-16 px-6 space-y-3" style={{ paddingTop: 6 }}>
        {/* Priority Match Card */}
        <GlassCard className="relative px-6 py-4">
          <p
            style={{
              color: "#0B0B0B",
              fontSize: 11,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "1.54px",
            }}
          >
            Priority match
          </p>
          <p style={{ color: "#0B0B0B", fontSize: 28, fontWeight: 700, marginTop: 4 }}>
            {newMatchCount > 0 ? `${newMatchCount} new` : "0 new"}
          </p>
          <p style={{ color: "#74746D", fontSize: 13, maxWidth: 210 }}>{matchLabel}</p>
          <button
            onClick={() => navigate("/matches")}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              right: 22,
              top: "50%",
              transform: "translateY(-50%)",
              width: 46,
              height: 46,
              background: "#0B0B0B",
            }}
            aria-label="View matches"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4.17 10h11.66M10 4.17l5.83 5.83L10 15.83"
                stroke="#0A0A0C"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </GlassCard>

        {/* Latest Events */}
        <SectionHeader
          label="Latest events"
          onViewAll={() => navigate("/app/home")}
        />

        {loading ? (
          <div style={{ color: "#74746D", fontSize: 13, textAlign: "center", padding: 16 }}>
            Loading…
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "#74746D", fontSize: 13 }}>No upcoming events.</p>
        ) : (
          events.slice(0, 1).map((event) => <EventCard key={event.id} event={event} />)
        )}

        {/* Latest Updates */}
        {updates.length > 0 && (
          <>
            <SectionHeader
              label="Latest updates"
              onViewAll={() => navigate("/app/updates")}
            />
            <div
              className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory"
              style={{ marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}
            >
              {updates.slice(0, 6).map((item) => (
                <div key={item.id} className="shrink-0 snap-start" style={{ width: 320 }}>
                  <StartupUpdateCard
                    item={item}
                    compact
                    actionLabel="Request intro"
                    onAction={
                      userType === "founder"
                        ? undefined
                        : () =>
                            setIntroTarget({
                              founderId: item.founder_id,
                              founderName: item.founderName,
                              startupName: item.startupName,
                              updateTitle: item.title,
                            })
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {introTarget && (
        <RequestIntroBanner
          target={introTarget}
          investorId={user?.id}
          onClose={() => setIntroTarget(null)}
        />
      )}

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
    </div>
  );
}

/* ---------- Sub-components ---------- */

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background:
          "linear-gradient(169deg, rgba(11,11,11,0.054) 0%, rgba(11,11,11,0.018) 100%)",
        boxShadow: "inset 0px 1px 0px 1px rgba(11,11,11,0.12)",
        borderRadius: 22,
        outline: "1px solid rgba(11,11,11,0.108)",
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ label, onViewAll }: { label: string; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <p
        style={{
          color: "#74746D",
          fontSize: 11.5,
          fontWeight: 400,
          textTransform: "uppercase",
          letterSpacing: "1.15px",
        }}
      >
        {label}
      </p>
      <button onClick={onViewAll} style={{ color: "#0B0B0B", fontSize: 12 }}>
        View all
      </button>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const date = new Date(event.starts_at);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate().toString().padStart(2, "0");
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <GlassCard className="flex items-center gap-3.5 px-4 py-2.5">
      {/* Date badge */}
      <div
        className="flex flex-col items-center justify-center shrink-0"
        style={{
          width: 52,
          paddingTop: 6,
          paddingBottom: 6,
          background: "rgba(11,11,11,0.14)",
          borderRadius: 13,
          outline: "1px solid rgba(11,11,11,0.25)",
        }}
      >
        <span
          style={{
            color: "#0B0B0B",
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.95px",
          }}
        >
          {month}
        </span>
        <span style={{ color: "#0B0B0B", fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>
          {day}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p style={{ color: "#0B0B0B", fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>
          {event.name}
        </p>
        <p style={{ color: "#74746D", fontSize: 11.5, marginTop: 2 }}>
          {time} · {event.code || "Virtual"}
        </p>
        {isToday && (
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.57px]"
            style={{ background: "#0B0B0B", color: "#FFFFFF" }}
          >
            Today
          </span>
        )}
      </div>

      {/* Chevron */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
        <path
          d="M6.75 4.5l4.5 4.5-4.5 4.5"
          stroke="#74746D"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </GlassCard>
  );
}

