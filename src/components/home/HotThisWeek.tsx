import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame } from "lucide-react";
import type { HotProfile } from "@/hooks/useHomeFeed";

interface Props {
  profiles: HotProfile[];
  oppositeLabel: string;
}

export function HotThisWeek({ profiles, oppositeLabel }: Props) {
  const navigate = useNavigate();

  return (
    <section className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold">Hot {oppositeLabel} this week</h2>
      </div>
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No featured profiles yet — check back soon.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/profile/${p.id}`)}
              className="flex flex-col items-center gap-2 min-w-[72px] hover:opacity-80 transition"
            >
              <Avatar className="h-16 w-16 ring-2 ring-orange-500/40">
                <AvatarImage src={p.avatar_url ?? ""} alt={p.name} />
                <AvatarFallback>{p.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground text-center line-clamp-2 max-w-[72px]">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
