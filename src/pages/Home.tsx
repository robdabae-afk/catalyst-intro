import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/app/BottomNav";
import { MenuDrawer } from "@/components/app/MenuDrawer";
import { StartupUpdateCard } from "@/components/app/StartupUpdateCard";
import { useStartupUpdates } from "@/hooks/useStartupUpdates";
import { Settings } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newMatchCount, setNewMatchCount] = useState(0);
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

  // Fetch new mutual matches (swipes where both parties liked)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("swiped_id", user.id)
        .eq("action", "like");
      setNewMatchCount(count ?? 0);
    })();
  }, [user?.id]);

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
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(212,176,86,0.13) 0%, rgba(212,176,86,0) 58%), radial-gradient(ellipse 95% 90% at 88% 96%, rgba(120,92,30,0.16) 0%, rgba(120,92,30,0) 62%), linear-gradient(139deg, #0B0A07 0%, #060606 55%, #080709 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-10 pb-2">
        <div>
          <p style={{ color: "#94908A", fontSize: 13 }}>Welcome back,</p>
          <h1 style={{ color: "#F6F5F2", fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>
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
              "linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
            outline: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Open menu"
        >
          <Settings size={20} color="#C6A02C" strokeWidth={1.5} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-16 px-6 space-y-3" style={{ paddingTop: 6 }}>
        {/* Priority Match Card */}
        <GlassCard className="relative px-6 py-4">
          <p
            style={{
              color: "#E7CB7E",
              fontSize: 11,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "1.54px",
            }}
          >
            Priority match
          </p>
          <p style={{ color: "#F6F5F2", fontSize: 28, fontWeight: 700, marginTop: 4 }}>
            {newMatchCount > 0 ? `${newMatchCount} new` : "0 new"}
          </p>
          <p style={{ color: "#94908A", fontSize: 13, maxWidth: 210 }}>{matchLabel}</p>
          <button
            onClick={() => navigate("/matches")}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              right: 22,
              top: "50%",
              transform: "translateY(-50%)",
              width: 46,
              height: 46,
              background: "#C6A02C",
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
          <div style={{ color: "#94908A", fontSize: 13, textAlign: "center", padding: 16 }}>
            Loading…
          </div>
        ) : events.length === 0 ? (
          <p style={{ color: "#94908A", fontSize: 13 }}>No upcoming events.</p>
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
                    actionLabel={userType === "founder" ? "Reply" : "Request intro"}
                    onAction={() =>
                      userType === "founder"
                        ? navigate(`/app/messages?user=${item.founder_id}`)
                        : navigate(`/app/profile/${item.founder_id}`)
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
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
          "linear-gradient(169deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
        borderRadius: 22,
        outline: "1px solid rgba(255,255,255,0.12)",
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
          color: "#94908A",
          fontSize: 11.5,
          fontWeight: 400,
          textTransform: "uppercase",
          letterSpacing: "1.15px",
        }}
      >
        {label}
      </p>
      <button onClick={onViewAll} style={{ color: "#E7CB7E", fontSize: 12 }}>
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
          background: "rgba(198,160,44,0.14)",
          borderRadius: 13,
          outline: "1px solid rgba(198,160,44,0.25)",
        }}
      >
        <span
          style={{
            color: "#E7CB7E",
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.95px",
          }}
        >
          {month}
        </span>
        <span style={{ color: "#F6F5F2", fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>
          {day}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p style={{ color: "#F6F5F2", fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>
          {event.name}
        </p>
        <p style={{ color: "#94908A", fontSize: 11.5, marginTop: 2 }}>
          {time} · {event.code || "Virtual"}
        </p>
        {isToday && (
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.57px]"
            style={{ background: "#C6A02C", color: "#2A2005" }}
          >
            Today
          </span>
        )}
      </div>

      {/* Chevron */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
        <path
          d="M6.75 4.5l4.5 4.5-4.5 4.5"
          stroke="#94908A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </GlassCard>
  );
}

