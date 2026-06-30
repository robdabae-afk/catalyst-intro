import { Calendar } from "lucide-react";
import type { UpcomingEvent } from "@/hooks/useHomeFeed";

interface Props {
  events: UpcomingEvent[];
}

export function EventsThisWeek({ events }: Props) {
  return (
    <section className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Events this week</h2>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming events in the next 7 days.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const start = new Date(e.starts_at);
            const dateStr = start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const timeStr = start.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            });
            return (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr} · {timeStr}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono">
                  {e.code}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
