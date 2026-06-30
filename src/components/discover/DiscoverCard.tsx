import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, BookmarkCheck, Heart, CheckCircle2, Sparkles } from "lucide-react";
import type { DiscoverProfile } from "@/hooks/useDiscoverFeed";

interface Props {
  profile: DiscoverProfile;
  targetType: "founder" | "investor";
  isSaved: boolean;
  interestSent: boolean;
  onExpressInterest: (p: DiscoverProfile) => void;
  onToggleSave: (p: DiscoverProfile) => void;
}

export function DiscoverCard({
  profile,
  targetType,
  isSaved,
  interestSent,
  onExpressInterest,
  onToggleSave,
}: Props) {
  const navigate = useNavigate();
  const detail =
    targetType === "founder"
      ? Array.isArray(profile.founder_profiles)
        ? profile.founder_profiles[0]
        : profile.founder_profiles
      : Array.isArray(profile.investor_profiles)
      ? profile.investor_profiles[0]
      : profile.investor_profiles;

  const title =
    targetType === "founder"
      ? detail?.company_name || detail?.startup_name || profile.name
      : detail?.firm_name || profile.name;

  const subtitle =
    targetType === "founder" ? detail?.one_liner : detail?.position || profile.name;

  const tags: string[] =
    targetType === "founder"
      ? detail?.industry ?? []
      : detail?.sectors_of_interest ?? [];

  const stage =
    targetType === "founder" ? detail?.stage : detail?.preferred_stage;

  const metricLabel =
    targetType === "founder"
      ? detail?.mrr
        ? `MRR ${detail.mrr}`
        : detail?.traction
        ? detail.traction.slice(0, 24)
        : null
      : detail?.typical_check_size
      ? detail.typical_check_size
      : null;

  return (
    <div className="group relative flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
      {/* Bookmark - absolute top-right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(profile);
        }}
        className="absolute top-1.5 right-1.5 z-10 h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
        aria-label={isSaved ? "Remove from watchlist" : "Save to watchlist"}
      >
        {isSaved ? (
          <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      <button
        type="button"
        onClick={() => navigate(`/profile/${profile.id}`)}
        className="text-left p-2.5 flex flex-col gap-1.5 flex-1 min-h-0"
      >
        <div className="flex items-start gap-2">
          <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
            <AvatarImage src={profile.avatar_url || ""} alt={title} />
            <AvatarFallback className="text-xs">{title?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pr-5">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-[13px] leading-tight truncate">{title}</h3>
              {profile.is_verified && (
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              )}
              {profile.is_featured && (
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug mt-0.5">
              {subtitle || "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-auto">
          {stage && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1 uppercase tracking-wide">
              {stage}
            </Badge>
          )}
          {tags.slice(0, 1).map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] h-4 px-1">
              {t}
            </Badge>
          ))}
          {tags.length > 1 && (
            <span className="text-[9px] text-muted-foreground self-center">
              +{tags.length - 1}
            </span>
          )}
          {metricLabel && (
            <span className="ml-auto text-[10px] font-medium text-foreground/70 tabular-nums self-center">
              {metricLabel}
            </span>
          )}
        </div>
      </button>

      <div className="px-2 pb-2">
        <Button
          size="sm"
          variant={interestSent ? "secondary" : "default"}
          disabled={interestSent}
          onClick={(e) => {
            e.stopPropagation();
            onExpressInterest(profile);
          }}
          className="w-full h-7 text-[11px] px-2"
        >
          <Heart className={`w-3 h-3 mr-1 ${interestSent ? "fill-current" : ""}`} />
          {interestSent ? "Sent" : "Express Interest"}
        </Button>
      </div>
    </div>
  );
}
