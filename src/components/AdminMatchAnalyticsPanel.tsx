import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface EventStat {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  founders: number;
  investors: number;
  interests: number;
  total_check_cents: number;
  avg_check_cents: number;
  min_check_cents: number | null;
  max_check_cents: number | null;
}

const fmt = (cents: number | null) =>
  cents == null || !Number.isFinite(cents) || cents <= 0
    ? "—"
    : `$${Math.round(cents / 100).toLocaleString()}`;

export function AdminMatchAnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EventStat[]>([]);
  const [totals, setTotals] = useState({
    founders: 0,
    investors: 0,
    interests: 0,
    totalCheckCents: 0,
    avgCheckCents: 0,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [evRes, attRes, profRes, intRes] = await Promise.all([
          (supabase as any).from("match_events").select("id, name, code, is_active").order("created_at", { ascending: false }),
          (supabase as any).from("match_event_attendees").select("event_id, profile_id"),
          (supabase as any).from("match_profiles").select("id, role"),
          (supabase as any).from("match_interests").select("event_id, check_size_cents"),
        ]);
        const events = evRes.data ?? [];
        const attendees = attRes.data ?? [];
        const profiles = profRes.data ?? [];
        const interests = intRes.data ?? [];

        const roleMap = new Map(profiles.map((p: any) => [p.id, p.role]));

        const perEvent: Record<string, EventStat> = {};
        for (const ev of events) {
          perEvent[ev.id] = {
            id: ev.id,
            name: ev.name,
            code: ev.code,
            is_active: ev.is_active,
            founders: 0,
            investors: 0,
            interests: 0,
            total_check_cents: 0,
            avg_check_cents: 0,
            min_check_cents: null,
            max_check_cents: null,
          };
        }
        const uniqueFounders = new Set<string>();
        const uniqueInvestors = new Set<string>();
        for (const a of attendees) {
          const role = roleMap.get(a.profile_id);
          const e = perEvent[a.event_id];
          if (!e) continue;
          if (role === "founder") { e.founders += 1; uniqueFounders.add(a.profile_id); }
          if (role === "investor") { e.investors += 1; uniqueInvestors.add(a.profile_id); }
        }

        let totalCheck = 0;
        let totalInterests = 0;
        const checksByEvent: Record<string, number[]> = {};
        for (const i of interests) {
          const e = perEvent[i.event_id];
          if (!e) continue;
          e.interests += 1;
          totalInterests += 1;
          const c = Number(i.check_size_cents) || 0;
          if (c > 0) {
            e.total_check_cents += c;
            totalCheck += c;
            (checksByEvent[i.event_id] ||= []).push(c);
          }
        }
        for (const id of Object.keys(perEvent)) {
          const arr = checksByEvent[id] || [];
          if (arr.length) {
            perEvent[id].avg_check_cents = Math.round(perEvent[id].total_check_cents / arr.length);
            perEvent[id].min_check_cents = Math.min(...arr);
            perEvent[id].max_check_cents = Math.max(...arr);
          }
        }

        setStats(Object.values(perEvent));
        const checksAll = interests.map((i: any) => Number(i.check_size_cents) || 0).filter((n: number) => n > 0);
        setTotals({
          founders: uniqueFounders.size,
          investors: uniqueInvestors.size,
          interests: totalInterests,
          totalCheckCents: totalCheck,
          avgCheckCents: checksAll.length ? Math.round(totalCheck / checksAll.length) : 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-muted-foreground p-6">Loading match analytics…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Match — Platform Analytics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Unique Founders" value={totals.founders.toString()} />
        <StatCard label="Unique Investors" value={totals.investors.toString()} />
        <StatCard label="Interests Sent" value={totals.interests.toString()} />
        <StatCard label="Total Offered" value={fmt(totals.totalCheckCents)} />
        <StatCard label="Avg Check Size" value={fmt(totals.avgCheckCents)} />
      </div>

      <Card className="p-4 overflow-x-auto">
        <h3 className="font-semibold mb-3">Per Event</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">Event</th>
              <th className="py-2 pr-3">Code</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3 text-right">Founders</th>
              <th className="py-2 pr-3 text-right">Investors</th>
              <th className="py-2 pr-3 text-right">Interests</th>
              <th className="py-2 pr-3 text-right">Total Offered</th>
              <th className="py-2 pr-3 text-right">Avg Check</th>
              <th className="py-2 pr-3 text-right">Min</th>
              <th className="py-2 pr-3 text-right">Max</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-2 pr-3">{s.name}</td>
                <td className="py-2 pr-3 font-mono">{s.code}</td>
                <td className="py-2 pr-3">
                  <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="py-2 pr-3 text-right">{s.founders}</td>
                <td className="py-2 pr-3 text-right">{s.investors}</td>
                <td className="py-2 pr-3 text-right">{s.interests}</td>
                <td className="py-2 pr-3 text-right">{fmt(s.total_check_cents)}</td>
                <td className="py-2 pr-3 text-right">{fmt(s.avg_check_cents)}</td>
                <td className="py-2 pr-3 text-right">{fmt(s.min_check_cents)}</td>
                <td className="py-2 pr-3 text-right">{fmt(s.max_check_cents)}</td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr><td colSpan={10} className="py-4 text-center text-muted-foreground">No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
