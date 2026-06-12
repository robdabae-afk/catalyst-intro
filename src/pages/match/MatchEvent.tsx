import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MatchEvent() {
  const navigate = useNavigate();
  const { userId, profile, activeEventId, loading, reload } = useMatchSession();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate("/match/auth"); return; }
    if (!profile) { navigate("/match/onboarding"); return; }
  }, [userId, profile, loading, navigate]);

  useEffect(() => {
    if (activeEventId) {
      (supabase as any).from("match_events").select("*").eq("id", activeEventId).maybeSingle()
        .then(({ data }: any) => setEvent(data));
    } else setEvent(null);
  }, [activeEventId]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setJoining(true);
    try {
      const { data: ev, error } = await (supabase as any)
        .from("match_events").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
      if (error || !ev) throw new Error("Invalid event code");
      if (!ev.is_active) throw new Error("Event is not active");
      const now = new Date();
      if (new Date(ev.starts_at) > now) throw new Error("Event hasn't started yet");
      if (new Date(ev.ends_at) < now) throw new Error("Event has ended");

      const { error: aErr } = await (supabase as any).from("match_event_attendees")
        .insert({ event_id: ev.id, profile_id: userId });
      if (aErr && !aErr.message.includes("duplicate")) throw aErr;

      toast.success(`Joined ${ev.name}`);
      await reload();
      navigate(profile?.role === "investor" ? "/match/discover" : "/match/inbox");
    } catch (err: any) {
      toast.error(err.message || "Could not join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <MatchLayout>
      <div className="max-w-xl mx-auto px-6 py-10">
        {event ? (
          <div className="space-y-4">
            <h1 className="font-serif text-3xl">You're in: {event.name}</h1>
            <p className="text-white/60">Event runs until {new Date(event.ends_at).toLocaleString()}.</p>
            <div className="flex gap-2">
              {profile?.role === "investor" && (
                <Button onClick={() => navigate("/match/discover")} className="bg-white text-black hover:bg-white/90">Browse Founders</Button>
              )}
              <Button variant="outline" onClick={() => navigate("/match/inbox")}>Open Inbox</Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl mb-2">Join an event</h1>
            <p className="text-white/60 mb-6">Enter the event code provided by the organizer.</p>
            <form onSubmit={join} className="space-y-4">
              <div>
                <Label>Event Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD1234" className="font-mono tracking-widest text-center text-lg" required />
              </div>
              <Button type="submit" disabled={joining} className="w-full bg-white text-black hover:bg-white/90">
                {joining ? "Joining…" : "Join Event"}
              </Button>
            </form>
          </>
        )}
      </div>
    </MatchLayout>
  );
}
