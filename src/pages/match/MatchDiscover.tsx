import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function MatchDiscover() {
  const navigate = useNavigate();
  const { userId, profile, activeEventId, loading } = useMatchSession();
  const [founders, setFounders] = useState<any[]>([]);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<any | null>(null);
  const [checkAmount, setCheckAmount] = useState("");
  const [openerNote, setOpenerNote] = useState("");

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
    const { data: attendees } = await (supabase as any)
      .from("match_event_attendees").select("profile_id").eq("event_id", activeEventId);
    let ids = (attendees ?? []).map((a: any) => a.profile_id).filter((id: string) => id !== userId);
    if (ids.length === 0) { setFounders([]); return; }

    const { data: admins } = await (supabase as any)
      .from("user_roles").select("user_id").eq("role", "admin").in("user_id", ids);
    const adminIds = new Set((admins ?? []).map((a: any) => a.user_id));
    ids = ids.filter((id: string) => !adminIds.has(id));
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

  const openInterestDialog = (f: any) => {
    setTarget(f);
    setCheckAmount("");
    setOpenerNote("");
  };

  const submitInterest = async () => {
    if (!target || !userId || !activeEventId) return;
    const dollars = Number(checkAmount.replace(/[, $]/g, ""));
    if (!Number.isFinite(dollars) || dollars < 1) {
      toast.error("Enter a valid check size in USD");
      return;
    }
    setBusy(target.id);
    try {
      const { data, error } = await supabase.functions.invoke("match-express-interest", {
        body: {
          event_id: activeEventId,
          founder_id: target.id,
          message: openerNote || undefined,
          check_size_cents: Math.round(dollars * 100),
        },
      });
      if (error) throw error;
      toast.success("Interest sent — chat unlocked");
      setInterestedIds(prev => new Set([...prev, target.id]));
      const tid = target.id;
      setTarget(null);
      if ((data as any)?.thread_id) navigate(`/match/thread/${(data as any).thread_id}`);
      else void tid;
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = q
    ? founders.filter((f) => {
        const name = (f.name || "").toLowerCase();
        const startup = (f.founder?.startup_name || "").toLowerCase();
        return name.includes(q) || startup.includes(q);
      })
    : founders;

  return (
    <MatchLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-serif text-3xl mb-4">Founders at this event</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by founder name or company…"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        {visible.length === 0 ? (
          <p className="text-white/60">
            {founders.length === 0 ? "No founders have joined yet." : "No matches for your search."}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {visible.map(f => (
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
                  onClick={() => openInterestDialog(f)}
                >
                  {interestedIds.has(f.id) ? "Interest sent ✓" : busy === f.id ? "..." : "Express Interest"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="bg-neutral-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Connect with {target?.founder?.startup_name || target?.name}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Specify the check size you'd like to offer. This is shared with the founder in chat and in their notification email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="check-size">Proposed check size (USD)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <Input
                  id="check-size"
                  inputMode="numeric"
                  value={checkAmount}
                  onChange={(e) => setCheckAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="50,000"
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <p className="text-xs text-white/50 mt-1">Indicative — final terms are discussed off-platform.</p>
            </div>
            <div>
              <Label htmlFor="opener">Short intro note (optional)</Label>
              <Textarea
                id="opener"
                value={openerNote}
                onChange={(e) => setOpenerNote(e.target.value)}
                placeholder="What caught your eye, what you'd like to discuss…"
                rows={3}
                maxLength={500}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={!!busy}>Cancel</Button>
            <Button
              onClick={submitInterest}
              disabled={!!busy || !checkAmount}
              className="bg-white text-black hover:bg-white/90"
            >
              {busy ? "Sending…" : "Send Interest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MatchLayout>
  );
}
