import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Edit3, ExternalLink } from "lucide-react";
import { DiscoverCard } from "@/components/discover/DiscoverCard";
import type { DiscoverProfile } from "@/hooks/useDiscoverFeed";

interface ReviewedUser {
  id: string;
  name: string;
  email: string;
  user_type: "founder" | "investor";
  created_at?: string;
  has_pending_update?: boolean | null;
}

interface Props {
  user: ReviewedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (userId: string) => void;
  onRequestEdits?: (user: ReviewedUser) => void;
  onReject?: (user: ReviewedUser) => void;
  actionDisabled?: boolean;
}

export function AdminReviewMode({
  user,
  open,
  onOpenChange,
  onApprove,
  onRequestEdits,
  onReject,
  actionDisabled,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [roleProfile, setRoleProfile] = useState<any>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        let rp: any = null;
        if (user.user_type === "founder") {
          const { data } = await supabase
            .from("founder_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .maybeSingle();
          rp = data;
        } else {
          const { data } = await supabase
            .from("investor_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .maybeSingle();
          rp = data;
        }

        if (!cancelled) {
          setProfile(p);
          setRoleProfile(rp);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  const discoverProfile: DiscoverProfile | null = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      user_type: profile.user_type,
      is_verified: profile.is_verified,
      is_featured: profile.is_featured,
      created_at: profile.created_at,
      founder_profiles: profile.user_type === "founder" ? roleProfile : undefined,
      investor_profiles: profile.user_type === "investor" ? roleProfile : undefined,
    };
  }, [profile, roleProfile]);

  if (!user) return null;

  const audienceLabel =
    user.user_type === "founder"
      ? "Shown to investors in Discover"
      : "Shown to founders in Discover";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] p-0 gap-0 max-h-[92vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-12 h-12 border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DialogTitle className="truncate">{user.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                  <Badge variant="secondary" className="capitalize">{user.user_type}</Badge>
                  {user.has_pending_update && (
                    <Badge variant="destructive">Pending Update</Badge>
                  )}
                  {user.created_at && (
                    <span className="text-xs text-muted-foreground">
                      Signed up {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/profile/${user.id}`, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in tab
            </Button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="card" className="w-full">
              <TabsList>
                <TabsTrigger value="card">Discovery Card</TabsTrigger>
                <TabsTrigger value="full">Full Profile</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              {/* Discovery Card */}
              <TabsContent value="card" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">{audienceLabel}</p>
                <div className="flex flex-wrap gap-6 items-start">
                  <div className="w-[260px]">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                      Mini card (feed size)
                    </p>
                    {discoverProfile && (
                      <div className="h-[240px]">
                        <DiscoverCard
                          profile={discoverProfile}
                          targetType={user.user_type}
                          isSaved={false}
                          interestSent={false}
                          onExpressInterest={() => {}}
                          onToggleSave={() => {}}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-[280px]">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                      Perspective
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        A {user.user_type === "founder" ? "founder" : "investor"} appears
                        in the opposite audience's Discover feed. This is the card
                        {" "}{user.user_type === "founder" ? "investors" : "founders"} will
                        see and click.
                      </p>
                      <p>
                        Use the <strong>Full Profile</strong> tab to see the page shown
                        after they click through.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Full Profile — iframe of the real page */}
              <TabsContent value="full" className="mt-4">
                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <iframe
                    src={`/profile/${user.id}`}
                    title="Full profile preview"
                    className="w-full"
                    style={{ height: "70vh" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is the exact page rendered at{" "}
                  <code className="text-[11px]">/profile/{user.id}</code> — identical to
                  what any authenticated user sees when they click through.
                </p>
              </TabsContent>

              {/* Raw Data */}
              <TabsContent value="raw" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RawSection title="Profile" data={profile} />
                  <RawSection
                    title={user.user_type === "founder" ? "Founder Profile" : "Investor Profile"}
                    data={roleProfile}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="border-t border-border bg-background/95 backdrop-blur px-6 py-3 flex flex-wrap items-center justify-end gap-2 shrink-0">
          {onRequestEdits && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionDisabled}
              onClick={() => onRequestEdits(user)}
            >
              <Edit3 className="w-4 h-4 mr-1" /> Request Edits
            </Button>
          )}
          {onReject && (
            <Button
              variant="destructive"
              size="sm"
              disabled={actionDisabled}
              onClick={() => onReject(user)}
            >
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          )}
          {onApprove && (
            <Button
              size="sm"
              disabled={actionDisabled}
              onClick={() => onApprove(user.id)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RawSection({ title, data }: { title: string; data: any }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {data ? (
        <div className="space-y-1">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="text-xs grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground truncate">{k}</span>
              <span className="break-words">
                {v === null || v === undefined || v === ""
                  ? <em className="text-muted-foreground/60">—</em>
                  : Array.isArray(v)
                  ? v.join(", ")
                  : typeof v === "object"
                  ? JSON.stringify(v)
                  : String(v)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No data.</p>
      )}
    </div>
  );
}
