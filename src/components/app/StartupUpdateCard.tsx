import { Rocket, TrendingUp, Users, Megaphone, Handshake, Sparkles, MessageCircle, Heart, MessageSquare } from "lucide-react";

const GOLD = "#C6A02C";
const GOLD_SOFT = "#E7CB7E";
const TEXT = "#F6F5F2";
const BODY = "#CFCCC5";
const MUTED = "#94908A";
const DIM = "#5F5C57";
const GREEN = "#5EC98E";

export type UpdateCategory = "raise" | "launch" | "hiring" | "partnership" | "milestone" | "update";

export const CATEGORY_META: Record<UpdateCategory, { label: string; Icon: typeof Rocket }> = {
  raise: { label: "Raise", Icon: TrendingUp },
  launch: { label: "Launch", Icon: Rocket },
  hiring: { label: "Hiring", Icon: Users },
  partnership: { label: "Partnership", Icon: Handshake },
  milestone: { label: "Milestone", Icon: Sparkles },
  update: { label: "Update", Icon: Megaphone },
};

export const CATEGORY_OPTIONS: UpdateCategory[] = [
  "raise",
  "launch",
  "hiring",
  "partnership",
  "milestone",
];

export function categorize(title: string, body?: string | null): UpdateCategory {
  const t = `${title} ${body ?? ""}`.toLowerCase();
  if (/(raise|raised|seed round|series [a-d]|funding|closes \$|round)/.test(t)) return "raise";
  if (/(partner|partnership|integration with|joins forces)/.test(t)) return "partnership";
  if (/(hiring|hire|founding designer|join(ing)? (our|the) team|recruit)/.test(t)) return "hiring";
  if (/(launch|beta|shipped|live|release)/.test(t)) return "launch";
  if (/(mrr|arr|revenue|customers|users|growth|milestone|crossed|crosses)/.test(t))
    return "milestone";
  return "update";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export const glass = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
  boxShadow: "inset 0px 1px 0px 1px rgba(255,255,255,0.24)",
  outline: "1px solid rgba(255,255,255,0.10)",
  outlineOffset: "-1px",
  backdropFilter: "blur(10px)",
} as const;

export interface StartupUpdate {
  id: string;
  founder_id: string;
  title: string;
  body: string | null;
  link: string | null;
  category?: string | null;
  mrr_snapshot: string | null;
  headcount_snapshot: number | null;
  growth_snapshot?: string | null;
  runway_snapshot?: number | null;
  created_at: string;
  founderName: string;
  imageUrl: string | null;
  startupName: string | null;
  stage: string | null;
  growthMom: string | null;
  watchlisted?: boolean;
}

function Tile({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex-1 min-w-0 rounded-[14px] px-[11px] py-[10px] flex flex-col gap-1" style={glass}>
      <p
        style={{
          color: MUTED,
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
        }}
      >
        {label}
      </p>
      <p
        className="truncate"
        style={{
          color: positive ? GREEN : TEXT,
          fontSize: 16,
          fontFamily: "Fraunces, serif",
          fontWeight: 600,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function StartupUpdateCard({
  item,
  actionLabel = "Request intro",
  onAction,
  compact = false,
}: {
  item: StartupUpdate;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const category = (item.category as UpdateCategory) || categorize(item.title, item.body);
  const { label, Icon } = CATEGORY_META[category] ?? CATEGORY_META.update;

  const tiles: { label: string; value: string; positive?: boolean }[] = [];
  if (item.mrr_snapshot) tiles.push({ label: "MRR", value: item.mrr_snapshot, positive: true });
  const growth = item.growth_snapshot || item.growthMom;
  if (growth) tiles.push({ label: "Growth", value: growth, positive: true });
  if (item.runway_snapshot) tiles.push({ label: "Runway", value: `${item.runway_snapshot} mo` });
  if (tiles.length < 3 && item.headcount_snapshot)
    tiles.push({ label: "Team", value: String(item.headcount_snapshot) });
  if (tiles.length < 3 && item.stage) tiles.push({ label: "Stage", value: item.stage });

  return (
    <div className="rounded-[20px] p-[15px] flex flex-col gap-1.5" style={glass}>
      {/* Header */}
      <div className="flex items-center gap-[11px] pb-[7px]">
        <div
          className="flex items-center justify-center shrink-0 overflow-hidden"
          style={{ ...glass, width: 38, height: 38, borderRadius: 19, outline: `1px solid ${GOLD}` }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.startupName ?? item.founderName} className="w-full h-full object-cover" />
          ) : (
            <Icon size={18} color={GOLD} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, lineHeight: "17.5px" }} className="truncate">
            {item.founderName}
          </p>
          <p style={{ color: MUTED, fontSize: 11.5 }} className="truncate">
            {[item.startupName, item.stage].filter(Boolean).join(" · ") || "Founder"}
          </p>
        </div>
        <span style={{ color: DIM, fontSize: 11 }}>{timeAgo(item.created_at)}</span>
      </div>

      {/* Category pill */}
      <span
        className="inline-flex self-start rounded-full"
        style={{ background: GOLD, color: "#2A2005", fontSize: 10.5, fontWeight: 500, padding: "5px 11px" }}
      >
        {label}
      </span>

      <p
        style={{
          color: TEXT,
          fontSize: 18,
          fontFamily: "Fraunces, serif",
          fontWeight: 600,
          lineHeight: "23.4px",
          marginTop: 2,
        }}
      >
        {item.title}
      </p>

      {item.body && (
        <p
          className={compact ? "line-clamp-3" : undefined}
          style={{ color: BODY, fontSize: 13, lineHeight: "19.5px" }}
        >
          {item.body}
        </p>
      )}

      {item.link && (
        <a href={item.link} target="_blank" rel="noreferrer" style={{ color: GOLD_SOFT, fontSize: 12 }}>
          View link
        </a>
      )}

      {tiles.length > 0 && (
        <div className="flex gap-2 pt-[7px] pb-2">
          {tiles.slice(0, 3).map((t) => (
            <Tile key={t.label} {...t} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center gap-[18px] pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >

        {onAction && (
          <button
            onClick={onAction}
            className="ml-auto inline-flex items-center gap-1.5"
            style={{ color: GOLD_SOFT, fontSize: 12, fontWeight: 600 }}
          >
            {actionLabel === "Reply" && <MessageCircle size={14} strokeWidth={1.8} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
