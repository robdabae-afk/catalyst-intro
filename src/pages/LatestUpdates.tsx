import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Megaphone, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useStartupUpdates } from "@/hooks/useStartupUpdates";
import { BottomNav } from "@/components/app/BottomNav";
import {
  CATEGORY_META,
  CATEGORY_OPTIONS,
  StartupUpdateCard,
  categorize,
  glass,
  type UpdateCategory,
} from "@/components/app/StartupUpdateCard";

const GOLD = "#C6A02C";
const TEXT = "#F6F5F2";
const MUTED = "#94908A";

const INVESTOR_FILTERS = [
  { key: "all", label: "All" },
  { key: "raises", label: "Raises" },
  { key: "milestones", label: "Milestones" },
  { key: "watchlist", label: "Watchlist" },
] as const;
const FOUNDER_FILTERS = [
  { key: "all", label: "All" },
  { key: "milestones", label: "Milestones" },
  { key: "raises", label: "Raises" },
  { key: "hiring", label: "Hiring" },
] as const;
type FilterKey = "all" | "raises" | "milestones" | "watchlist" | "hiring";

export default function LatestUpdates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unread = useUnreadMessages();
  const pending = usePendingRequests();
  const { items, setItems, loading } = useStartupUpdates(user?.id ?? null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postCategory, setPostCategory] = useState<UpdateCategory>("milestone");
  const [posting, setPosting] = useState(false);

  const userType = (user?.user_type ?? null) as "founder" | "investor" | null;
  const isFounder = userType === "founder";
  const FILTERS = isFounder ? FOUNDER_FILTERS : INVESTOR_FILTERS;

  const filtered = useMemo(() => {
    const cat = (i: (typeof items)[number]) =>
      (i.category as UpdateCategory) || categorize(i.title, i.body);
    if (filter === "watchlist") return items.filter((i) => i.watchlisted);
    if (filter === "raises") return items.filter((i) => cat(i) === "raise");
    if (filter === "hiring") return items.filter((i) => cat(i) === "hiring");
    if (filter === "milestones") return items.filter((i) => cat(i) === "milestone");
    return items;
  }, [items, filter]);

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = filtered.filter((i) => new Date(i.created_at).getTime() >= weekAgo);
  const earlier = filtered.filter((i) => new Date(i.created_at).getTime() < weekAgo);

  const watchlistCount = new Set(
    items
      .filter((i) => i.watchlisted && new Date(i.created_at).getTime() >= weekAgo)
      .map((i) => i.founder_id),
  ).size;

  const submitPost = async () => {
    if (!user?.id || !postTitle.trim()) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("startup_updates")
      .insert({
        founder_id: user.id,
        title: postTitle.trim(),
        body: postBody.trim() || null,
        category: postCategory,
      })
      .select(
        "id, founder_id, title, body, link, category, mrr_snapshot, headcount_snapshot, growth_snapshot, runway_snapshot, created_at",
      )
      .single();
    setPosting(false);
    if (error || !data) return;
    setItems((prev) => [
      {
        ...(data as any),
        founderName: user.name ?? "You",
        imageUrl: (user as any).avatar_url ?? null,
        startupName: null,
        stage: null,
        growthMom: null,
        watchlisted: false,
      },
      ...prev,
    ]);
    setPostTitle("");
    setPostBody("");
    setComposerOpen(false);
  };

  const cardAction = (founderId: string) =>
    isFounder ? navigate(`/app/messages?user=${founderId}`) : navigate(`/app/profile/${founderId}`);

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
        <button onClick={() => navigate("/app/home")} aria-label="Back" className="mt-1 shrink-0">
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
          <p style={{ color: MUTED, fontSize: 12 }}>
            {isFounder
              ? "What the community shipped this week"
              : "From founders you follow and match with"}
          </p>
        </div>
        {isFounder && (
          <button
            onClick={() => setComposerOpen((v) => !v)}
            className="mt-1 h-8 px-4 rounded-full shrink-0 inline-flex items-center gap-1.5"
            style={{ background: GOLD, color: "#2A2005", fontSize: 12.5, fontWeight: 600 }}
          >
            <Plus size={14} strokeWidth={2.2} />
            Post
          </button>
        )}
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
        {isFounder ? (
          composerOpen ? (
            <div className="rounded-[20px] p-4 flex flex-col gap-2.5" style={glass}>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORY_OPTIONS.map((c) => {
                  const active = postCategory === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setPostCategory(c)}
                      className="h-7 px-3 rounded-full"
                      style={
                        active
                          ? { background: GOLD, color: "#2A2005", fontSize: 11, fontWeight: 600 }
                          : { ...glass, color: MUTED, fontSize: 11 }
                      }
                    >
                      {CATEGORY_META[c].label}
                    </button>
                  );
                })}
              </div>
              <input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Headline (e.g. We crossed $50k MRR)"
                className="w-full rounded-[12px] px-3 py-2 bg-transparent outline-none"
                style={{ color: TEXT, fontSize: 13.5, border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <textarea
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Add the details investors should know…"
                rows={4}
                className="w-full rounded-[12px] px-3 py-2 bg-transparent outline-none resize-none"
                style={{ color: TEXT, fontSize: 12.5, border: "1px solid rgba(255,255,255,0.12)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setComposerOpen(false)}
                  className="h-9 flex-1 rounded-full"
                  style={{ ...glass, color: MUTED, fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitPost}
                  disabled={posting || !postTitle.trim()}
                  className="h-9 flex-1 rounded-full disabled:opacity-50"
                  style={{ background: GOLD, color: "#2A2005", fontSize: 12.5, fontWeight: 600 }}
                >
                  {posting ? "Posting…" : "Post update"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full text-left flex items-center gap-3 rounded-[20px] px-3.5 pt-[21px] pb-3.5"
              style={glass}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ ...glass, width: 40, height: 40, borderRadius: 20, outline: `1px solid ${GOLD}` }}
              >
                <Megaphone size={19} color={GOLD} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 600 }}>Share an update</p>
                <p style={{ color: MUTED, fontSize: 11.5, lineHeight: "16.1px" }}>
                  Founders who post monthly get seen by 3× more investors.
                </p>
              </div>
            </button>
          )
        ) : (
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
        )}

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
                  <StartupUpdateCard
                    key={item.id}
                    item={item}
                    actionLabel={isFounder ? "Reply" : "Request intro"}
                    onAction={() => cardAction(item.founder_id)}
                  />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <SectionLabel>Earlier</SectionLabel>
                {earlier.map((item) => (
                  <StartupUpdateCard
                    key={item.id}
                    item={item}
                    actionLabel={isFounder ? "Reply" : "Request intro"}
                    onAction={() => cardAction(item.founder_id)}
                  />
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
