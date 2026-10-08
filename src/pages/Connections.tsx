import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/app/BottomNav";
import { BookmarkX, User } from "lucide-react";

interface SavedProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  user_type: "founder" | "investor";
  subtitle: string;
}

export default function Connections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const userType = (user?.user_type ?? null) as "founder" | "investor" | null;

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: rows } = await supabase
      .from("watchlist")
      .select("target_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const targetIds = (rows ?? []).map((r) => r.target_id);
    if (targetIds.length === 0) {
      setSaved([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, user_type, founder_profiles(startup_name, one_liner), investor_profiles(firm_name, position)")
      .in("id", targetIds);

    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const ordered: SavedProfile[] = targetIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p: any) => {
        const fp = Array.isArray(p.founder_profiles) ? p.founder_profiles[0] : p.founder_profiles;
        const ip = Array.isArray(p.investor_profiles) ? p.investor_profiles[0] : p.investor_profiles;
        const subtitle =
          p.user_type === "founder"
            ? fp?.startup_name ?? fp?.one_liner ?? "Founder"
            : [ip?.position, ip?.firm_name].filter(Boolean).join(" · ") || "Investor";
        return { id: p.id, name: p.name, avatar_url: p.avatar_url, user_type: p.user_type, subtitle };
      });

    setSaved(ordered);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleUnsave = async (targetId: string) => {
    if (!user?.id) return;
    setSaved((prev) => prev.filter((p) => p.id !== targetId));
    await supabase.from("watchlist").delete().eq("user_id", user.id).eq("target_id", targetId);
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 28% 12%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 58%), radial-gradient(ellipse 95% 90% at 88% 96%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 62%), linear-gradient(139deg, #FFFFFF 0%, #FFFFFF 55%, #FFFFFF 100%)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <h1 style={{ color: "#0B0B0B", fontSize: 24, fontWeight: 700, fontFamily: "'Schibsted Grotesk', system-ui, sans-serif" }}>
          Connections
        </h1>
        <p style={{ color: "#74746D", fontSize: 13, marginTop: 2 }}>
          {userType === "investor" ? "Startups you've saved" : "Investors you've saved"}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-28 px-6 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center pt-16">
            <div className="w-8 h-8 border-2 border-[#0B0B0B]/30 border-t-[#0B0B0B] rounded-full animate-spin" />
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <p style={{ color: "#74746D", fontSize: 14 }}>
              No saved {userType === "investor" ? "startups" : "investors"} yet.
            </p>
            <p style={{ color: "#74746D", fontSize: 12.5, marginTop: 6, maxWidth: 240 }}>
              Bookmark a profile from Discover to see it here.
            </p>
          </div>
        ) : (
          saved.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
              style={{
                background: "linear-gradient(165deg, rgba(11,11,11,0.054) 0%, rgba(11,11,11,0.018) 100%)",
                border: "1px solid rgba(11,11,11,0.09)",
              }}
              onClick={() => navigate(`/profile/${p.id}`)}
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(11,11,11,0.054)" }}
                >
                  <User size={20} color="#74746D" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p style={{ color: "#0B0B0B", fontSize: 14.5, fontWeight: 600 }}>{p.name}</p>
                <p style={{ color: "#74746D", fontSize: 12.5, marginTop: 1 }} className="truncate">
                  {p.subtitle}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsave(p.id);
                }}
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 34, height: 34, background: "rgba(11,11,11,0.045)" }}
                aria-label="Remove from saved"
              >
                <BookmarkX size={16} color="#74746D" />
              </button>
            </div>
          ))
        )}
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
