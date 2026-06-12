import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function MatchDiscover() {
  const navigate = useNavigate();
  const { userId, profile, activeEventId, loading } = useMatchSession();
  const [founders, setFounders] = useState<any[]>([]);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate("/match/auth"); return; }
    if (!profile) { navigate("/match/onboarding"); return; }
    if (!activeEventId) { navigate("/match/event"); return; }
    if (profile.role !== "investor") { navigate("/match/inbox"); return; }
    load();
  }, [userId, profile, activeEventId, loading]);

  const load = async () => {
    if (!activeEventId || !userId) return;
    // Attendees in this event
    const { data: attendees } = await (supabase as any)
      .from("match_event_attendees").select("profile_id").eq("event_id", activeEventId);
    const ids = (attendees ?? []).map((a: any) => a.profile_id).filter((id: string) => id !== userId);
    if (ids.length === 0) { setFounders([]); return; }

    const { data: profs } = await (supabase as any)
      .from("match_profiles").select("*").in("id", ids).eq("role", "founder");
    const founderIds = (profs ?? []).map((p: any) => p.id);
    const { data: fps } = await (supabase as any)
      .from("match_founder_profiles").select("*").in("profile_id", founderIds);
    const map = new Map((fps ?? []).map((f: any) => [f.profile_id, f]));
    setFounders((profs ?? []).map((p: any) => ({ ...p, founder: map.get(p.id) })));

    const { data: interests } = await (supabase as any)
      .from("match_interests").select("founder_id").eq("event_id", activeEventId).eq("investor_id", userId);
    setInterestedIds(new Set((interests ?? []).map((i: any) => i.founder_id)));
  };

  const expressInterest = async (founderId: string) => {
    if (!userId || !activeEventId) return;
    setBusy(founderId);
    try {
      const { data, error } = await supabase.functions.invoke("match-express-interest", {
        body: { event_id: activeEventId, founder_id: founderId },
      });
      if (error) throw error;
      toast.success("Interest sent — chat unlocked");
      setInterestedIds(prev => new Set([...prev, founderId]));
      if ((data as any)?.thread_id) navigate(`/match/thread/${(data as any).thread_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <MatchLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-serif text-3xl mb-6">Founders at this event</h1>
        {founders.length === 0 ? (
          <p className="text-white/60">No founders have joined yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {founders.map(f => (
              <Card key={f.id} className="bg-white/5 border-white/10 p-5 text-white">
                <div className="flex items-start gap-4">
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : <div className="w-14 h-14 rounded-full bg-white/10" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{f.founder?.startup_name || f.name}</div>
                    <div className="text-sm text-white/60">{f.name}</div>
                    {f.founder?.stage && <Badge variant="outline" className="mt-1">{f.founder.stage}</Badge>}
                  </div>
                </div>
                {f.founder?.one_liner && <p className="text-sm text-white/80 mt-3">{f.founder.one_liner}</p>}
                <div className="text-xs text-white/50 mt-2 space-y-0.5">
                  {f.founder?.funding_amount && <div>Raising: {f.founder.funding_amount}</div>}
                  {f.founder?.location && <div>{f.founder.location}</div>}
                </div>
                <Button
                  className="w-full mt-4 bg-white text-black hover:bg-white/90"
                  disabled={interestedIds.has(f.id) || busy === f.id}
                  onClick={() => expressInterest(f.id)}
                >
                  {interestedIds.has(f.id) ? "Interest sent ✓" : busy === f.id ? "..." : "Express Interest"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MatchLayout>
  );
}
