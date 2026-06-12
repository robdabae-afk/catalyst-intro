import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function MatchAdminEvents() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();
  const [events, setEvents] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { navigate("/match"); return; }
    load();
  }, [isAdmin, loading]);

  const load = async () => {
    const { data } = await (supabase as any).from("match_events").select("*").order("starts_at", { ascending: false });
    setEvents(data ?? []);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("match_events").insert({
      name, code: code.toUpperCase(), starts_at: startsAt, ends_at: endsAt, created_by: user?.id, is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Event created");
      setName(""); setCode(""); setStartsAt(""); setEndsAt("");
      load();
    }
  };

  const toggleActive = async (ev: any) => {
    await (supabase as any).from("match_events").update({ is_active: !ev.is_active }).eq("id", ev.id);
    load();
  };

  if (loading) return <MatchLayout><div className="p-10 text-white/60">Loading…</div></MatchLayout>;

  return (
    <MatchLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl mb-4">Manage Events</h1>
          <form onSubmit={create} className="grid sm:grid-cols-2 gap-3 bg-white/5 border border-white/10 p-4 rounded">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required /></div>
            <div><Label>Starts At</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div>
            <div><Label>Ends At</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required /></div>
            <Button type="submit" className="sm:col-span-2 bg-white text-black hover:bg-white/90">Create Event</Button>
          </form>
        </div>

        <div className="space-y-3">
          {events.map(ev => (
            <Card key={ev.id} className="bg-white/5 border-white/10 p-4 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold">{ev.name} <span className="font-mono text-white/60 ml-2">{ev.code}</span></div>
                <div className="text-xs text-white/50">{new Date(ev.starts_at).toLocaleString()} → {new Date(ev.ends_at).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleActive(ev)}>
                {ev.is_active ? "Deactivate" : "Activate"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </MatchLayout>
  );
}
