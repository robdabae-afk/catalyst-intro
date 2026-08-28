import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket, TrendingUp, Users, Bookmark, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { BottomNav } from "@/components/app/BottomNav";

const GOLD = "#C6A02C";
const TEXT = "#F6F5F2";
const MUTED = "#94908A";
const DIM = "#5F5C57";

type Category = "raise" | "milestone" | "launch" | "hiring" | "update";

interface UpdateItem {
  id: string;
  founder_id: string;
  title: string;
  body: string | null;
  link: string | null;
  mrr_snapshot: string | null;
  headcount_snapshot: number | null;
  created_at: string;
  founderName: string;
  avatarUrl: string | null;
  startupName: string | null;
  stage: string | null;
  growthMom: string | null;
  watchlisted: boolean;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "raises", label: "Raises" },
  { key: "milestones", label: "Milestones" },
  { key: "watchlist", label: "Watchlist" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const CATEGORY_META: Record<Category, { label: string; Icon: typeof Rocket }> = {
  raise: { label: "Raise", Icon: TrendingUp },
  milestone: { label: "Milestone", Icon: TrendingUp },
  launch: { label: "Launch", Icon: Rocket },
  hiring: { label: "Hiring", Icon: Users },
  update: { label: "Update", Icon: Megaphone },
};

function categorize(title: string, body?: string | null): Category {
  const t = `${title} ${body ?? ""}`.toLowerCase();
  if (/(raise|raised|seed round|series [a-d]|funding|closes \$|round)/.test(t)) return "raise";
  if (/(hiring|hire|join(ing)? (our|the) team|recruit)/.test(t)) return "hiring";
  if (/(launch|beta|shipped|live|release)/.test(t)) return "launch";
  if (/(mrr|arr|revenue|customers|users|growth|milestone|crossed|crosses)/.test(t))
    return "milestone";
  return "update";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const glass = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
  outline: "1px solid rgba(255,255,255,0.10)",
  outlineOffset: "-1px",
  backdropFilter: "blur(10px)",
};

export default function LatestUpdates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unread = useUnreadMessages();
  const pending = usePendingRequests();
  const [items, setItems] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  const userType = (user?.user_type ?? null) as "founder" | "investor" | null;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);

      const [{ data: updates }, { data: watch }] = await Promise.all([
        supabase
          .from("startup_updates")
          .select("id, founder_id, title, body, link, mrr_snapshot, headcount_snapshot, created_at")
          .order("created_at", { ascending: false })
          .limit(60),
        user?.id
          ? supabase.from("watchlist").select("target_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as { target_id: string }[] }),
      ]);

      const rows = updates ?? [];
      const founderIds = [...new Set(rows.map((r) => r.founder_id))];

      const [{ data: profiles }, { data: founderProfiles }] = await Promise.all([
        founderIds.length
          ? supabase.from("profiles").select("id, name, avatar_url").in("id", founderIds)
          : Promise.resolve({ data: [] as any[] }),
        founderIds.length
          ? supabase
              .from("founder_profiles")
              .select("profile_id, startup_name, company_name, stage, growth_mom")
              .in("profile_id", founderIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const fpMap = new Map((founderProfiles ?? []).map((p: any) => [p.profile_id, p]));
      const watchSet = new Set(((watch as any[]) ?? []).map((w) => w.target_id));

      const mapped: UpdateItem[] = rows.map((r) => {
        const p = profileMap.get(r.founder_id);
        const fp: any = fpMap.get(r.founder_id);
        return {
          ...r,
          founderName: p?.name ?? "Founder",
          avatarUrl: p?.avatar_url ?? null,
          startupName: fp?.startup_name ?? fp?.company_name ?? null,
          stage: fp?.stage ?? null,
          growthMom: fp?.growth_mom ?? null,
          watchlisted: watchSet.has(r.founder_id),
        };
      });

      if (!active) return;
      setItems(mapped);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (filter === "watchlist") return items.filter((i) => i.watchlisted);
    if (filter === "raises") return items.filter((i) => categorize(i.title, i.body) === "raise");
    if (filter === "milestones")
      return items.filter((i) => categorize(i.title, i.body) === "milestone");
    return items;
  }, [items, filter]);

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = filtered.filter((i) => new Date(i.created_at).getTime() >= weekAgo);
  const earlier = filtered.filter((i) => new Date(i.created_at).getTime() < weekAgo);

  const watchlistCount = new Set(
    items.filter((i) => i.watchlisted && new Date(i.created_at).getTime() >= weekAgo).map(
      (i) => i.founder_id,
    ),
  ).size;

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(212,176,86,0.13) 0%, rgba(212,176,86,0) 58%), radial-gradient(ellipse 95% 90% at 88% 96%, rgba(120,92,30,0.16) 0%, rgba(120,92,30,0) 62%), linear-gradient(139deg, #0B0A07 0%, #060606 55%, #080709 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-12 pb-1">
        <button
          onClick={() => navigate("/app/home")}
          aria-label="Back"
          className="mt-1 shrink-0"
        >
          <ArrowLeft size={22} color={TEXT} strokeWidth={1.6} />
        </button>
        <div className="flex-1">
          <h1
            style={{
              color: TEXT,
              fontSize: 28,
              fontFamily: "Fraunces, serif",
              fontWeight: 600,
              lineHeight: "32.2px",
            }}
          >
            Latest updates
          </h1>
          <p style={{ color: MUTED, fontSize: 12 }}>From founders you follow and match with</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-[7px] px-4 pt-2 pb-1 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="h-[30px] px-[13px] rounded-full shrink-0"
              style={
                active
                  ? { background: GOLD, color: "#2A2005", fontSize: 11.5, fontWeight: 500 }
                  : { ...glass, color: MUTED, fontSize: 12 }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 pt-3 space-y-3">
        {/* Watchlist callout */}
        <div className="flex items-center gap-3 rounded-[20px] px-3.5 pt-[21px] pb-3.5" style={glass}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{ ...glass, width: 40, height: 40, borderRadius: 20, outline: `1px solid ${GOLD}` }}
          >
            <Bookmark size={19} color={GOLD} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 600 }}>
              {watchlistCount > 0
                ? `${watchlistCount} ${watchlistCount === 1 ? "company" : "companies"} you saved posted this week`
                : "No watchlist updates this week"}
            </p>
            <p style={{ color: MUTED, fontSize: 11.5, lineHeight: "16.1px" }}>
              Updates from your watchlist appear here first.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: 16 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: 24 }}>
            No updates yet.
          </p>
        ) : (
          <>
            {thisWeek.length > 0 && (
              <>
                <SectionLabel>This week</SectionLabel>
                {thisWeek.map((item) => (
                  <UpdateCard key={item.id} item={item} onIntro={() => navigate(`/app/profile/${item.founder_id}`)} />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <SectionLabel>Earlier</SectionLabel>
                {earlier.map((item) => (
                  <UpdateCard key={item.id} item={item} onIntro={() => navigate(`/app/profile/${item.founder_id}`)} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav userType={userType} inboxBadge={unread + pending} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="pt-3 pl-0.5"
      style={{
        color: MUTED,
        fontSize: 10.5,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "1.47px",
      }}
    >
      {children}
    </p>
  );
}

function UpdateCard({ item, onIntro }: { item: UpdateItem; onIntro: () => void }) {
  const category = categorize(item.title, item.body);
  const { label, Icon } = CATEGORY_META[category];

  const stats: { label: string; value: string }[] = [];
  if (item.mrr_snapshot) stats.push({ label: "MRR", value: item.mrr_snapshot });
  if (item.growthMom) stats.push({ label: "Growth", value: item.growthMom });
  if (item.headcount_snapshot) stats.push({ label: "Team", value: String(item.headcount_snapshot) });
  if (item.stage) stats.push({ label: "Stage", value: item.stage });

  return (
    <div className="rounded-[20px] p-[15px] flex flex-col gap-1.5" style={glass}>
      {/* Header row */}
      <div className="flex items-center gap-[11px] pb-[7px]">
        <div
          className="flex items-center justify-center shrink-0 overflow-hidden"
          style={{ ...glass, width: 38, height: 38, borderRadius: 19, outline: `1px solid ${GOLD}` }}
        >
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.founderName} className="w-full h-full object-cover" />
          ) : (
            <Icon size={18} color={GOLD} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, lineHeight: "17.5px" }}>
            {item.founderName}
          </p>
          <p style={{ color: MUTED, fontSize: 11.5 }} className="truncate">
            {[item.startupName, item.stage].filter(Boolean).join(" · ") || "Founder"}
          </p>
        </div>
        <span style={{ color: DIM, fontSize: 11 }}>{timeAgo(item.created_at)}</span>
      </div>

      {/* Category pill */}
      <span
        className="inline-flex self-start rounded-full"
        style={{
          background: GOLD,
          color: "#2A2005",
          fontSize: 11,
          fontWeight: 500,
          padding: "5px 11px",
        }}
      >
        {label}
      </span>

      <p style={{ color: TEXT, fontSize: 15, fontWeight: 600, lineHeight: "20px", marginTop: 4 }}>
        {item.title}
      </p>
      {item.body && (
        <p style={{ color: MUTED, fontSize: 12.5, lineHeight: "18px" }}>{item.body}</p>
      )}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#E7CB7E", fontSize: 12 }}
        >
          View link
        </a>
      )}

      {stats.length > 0 && (
        <div className="flex gap-2 mt-2">
          {stats.slice(0, 3).map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-[14px] px-2.5 py-2"
              style={{ background: "rgba(255,255,255,0.04)", outline: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                {s.label}
              </p>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onIntro}
        className="mt-3 h-9 rounded-full w-full"
        style={{ background: GOLD, color: "#2A2005", fontSize: 12.5, fontWeight: 600 }}
      >
        Request intro
      </button>
    </div>
  );
}
