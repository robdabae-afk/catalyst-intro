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
        ? detail.traction.slice(0, 40)
        : null
      : detail?.typical_check_size
      ? `Check ${detail.typical_check_size}`
      : null;

  const isNew =
    profile.created_at &&
    Date.now() - new Date(profile.created_at).getTime() < 1000 * 60 * 60 * 24 * 14;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.15)] transition-all">
      <button
        type="button"
        onClick={() => navigate(`/profile/${profile.id}`)}
        className="text-left p-4 flex flex-col gap-3 flex-1"
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 ring-1 ring-border">
            <AvatarImage src={profile.avatar_url || ""} alt={title} />
            <AvatarFallback className="text-sm">{title?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              {profile.is_verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              {profile.is_featured && (
                <Badge className="h-4 px-1.5 text-[9px] uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Featured
                </Badge>
              )}
              {isNew && (
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] uppercase tracking-wider">
                  New
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug min-h-[2rem]">
              {subtitle || "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {stage && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-wide">
              {stage}
            </Badge>
          )}
          {tags.slice(0, 2).map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] h-5 px-1.5">
              {t}
            </Badge>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{tags.length - 2}
            </span>
          )}
        </div>

        {metricLabel && (
          <div className="text-[11px] font-medium text-foreground/80 tabular-nums border-t border-border pt-2 mt-auto">
            {metricLabel}
          </div>
        )}
      </button>

      <div className="flex items-center gap-2 px-3 pb-3">
        <Button
          size="sm"
          variant={interestSent ? "secondary" : "default"}
          disabled={interestSent}
          onClick={(e) => {
            e.stopPropagation();
            onExpressInterest(profile);
          }}
          className="flex-1 h-8 text-xs"
        >
          <Heart className={`w-3.5 h-3.5 mr-1.5 ${interestSent ? "fill-current" : ""}`} />
          {interestSent ? "Interest Sent" : "Express Interest"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(profile);
          }}
          className="h-8 w-8 p-0"
          aria-label={isSaved ? "Remove from watchlist" : "Save to watchlist"}
        >
          {isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
