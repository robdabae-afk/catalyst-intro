import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Card } from "@/components/ui/card";

export default function MatchInbox() {
  const navigate = useNavigate();
  const { userId, profile, loading } = useMatchSession();
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate("/match/auth"); return; }
    if (!profile) { navigate("/match/onboarding"); return; }
    load();
  }, [userId, profile, loading]);

  const load = async () => {
    if (!userId) return;
    const { data } = await (supabase as any)
      .from("match_threads")
      .select("*")
      .or(`investor_id.eq.${userId},founder_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const otherIds = (data ?? []).map((t: any) => t.investor_id === userId ? t.founder_id : t.investor_id);
    const { data: profs } = await (supabase as any)
      .from("match_profiles").select("id,name,avatar_url,role").in("id", otherIds);
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setThreads((data ?? []).map((t: any) => ({
      ...t, other: map.get(t.investor_id === userId ? t.founder_id : t.investor_id),
    })));
  };

  return (
    <MatchLayout>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-3xl mb-6">Inbox</h1>
        {threads.length === 0 ? (
          <p className="text-white/60">No conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {threads.map(t => (
              <Link key={t.id} to={`/match/thread/${t.id}`}>
                <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 text-white flex items-center gap-3">
                  {t.other?.avatar_url ? (
                    <img src={t.other.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                  ) : <div className="w-10 h-10 rounded-full bg-white/10" />}
                  <div className="flex-1">
                    <div className="font-medium">{t.other?.name || "Conversation"}</div>
                    <div className="text-xs text-white/50 capitalize">{t.other?.role}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MatchLayout>
  );
}
