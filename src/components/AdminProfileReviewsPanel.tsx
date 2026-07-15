import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCircle2, XCircle, Edit3, RefreshCw, ClipboardCheck } from "lucide-react";
import { AdminReviewMode } from "./AdminReviewMode";

interface ReviewUser {
  id: string;
  name: string;
  email: string;
  user_type: "founder" | "investor";
  avatar_url: string | null;
  created_at: string;
  has_pending_update: boolean | null;
  rejection_reason: string | null;
  is_flagged: boolean | null;
  roles: string[];
}

interface Props {
  onApprove: (userId: string) => Promise<void> | void;
  onRequestEdits: (user: ReviewUser) => void;
  onReject: (user: ReviewUser) => void;
  actionLoadingId?: string | null;
  refreshKey?: number;
}

export function AdminProfileReviewsPanel({
  onApprove,
  onRequestEdits,
  onReject,
  actionLoadingId,
  refreshKey,
}: Props) {
  const [users, setUsers] = useState<ReviewUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewUser, setReviewUser] = useState<ReviewUser | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "founder" | "investor">("all");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, email, user_type, avatar_url, created_at, has_pending_update, rejection_reason, is_flagged")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r: any) => {
        rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] || []), r.role];
      });

      setUsers(
        (profiles ?? []).map((p: any) => ({
          ...p,
          roles: rolesByUser[p.id] || [],
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const filtered = typeFilter === "all" ? users : users.filter((u) => u.user_type === typeFilter);

  const status = (u: ReviewUser): "pending" | "approved" | "admin" | "rejected" => {
    if (u.roles.includes("admin")) return "admin";
    if (u.roles.includes("user")) return "approved";
    if (u.rejection_reason) return "rejected";
    return "pending";
  };

  const pending = useMemo(() => filtered.filter((u) => status(u) === "pending"), [filtered]);
  const pendingUpdates = useMemo(
    () => filtered.filter((u) => u.has_pending_update && status(u) !== "pending"),
    [filtered]
  );
  const recentlyReviewed = useMemo(
    () =>
      filtered
        .filter((u) => status(u) === "approved" || status(u) === "rejected" || status(u) === "admin")
        .slice(0, 30),
    [filtered]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Profile Reviews
          </h2>
          <p className="text-sm text-muted-foreground">
            Review, approve, or request edits with a preview of what other users actually see.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "founder", "investor"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? "default" : "outline"}
              onClick={() => setTypeFilter(t)}
              className="capitalize"
            >
              {t === "all" ? "All" : t + "s"}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="updates">Needs Re-Review ({pendingUpdates.length})</TabsTrigger>
          <TabsTrigger value="recent">Recently Reviewed ({recentlyReviewed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <ReviewTable
            users={pending}
            emptyText="No pending profiles."
            actionLoadingId={actionLoadingId}
            onOpen={setReviewUser}
            onApprove={onApprove}
            onRequestEdits={onRequestEdits}
            onReject={onReject}
          />
        </TabsContent>
        <TabsContent value="updates" className="mt-4">
          <ReviewTable
            users={pendingUpdates}
            emptyText="No profile updates awaiting review."
            actionLoadingId={actionLoadingId}
            onOpen={setReviewUser}
            onApprove={onApprove}
            onRequestEdits={onRequestEdits}
            onReject={onReject}
          />
        </TabsContent>
        <TabsContent value="recent" className="mt-4">
          <ReviewTable
            users={recentlyReviewed}
            emptyText="No recently reviewed profiles."
            actionLoadingId={actionLoadingId}
            onOpen={setReviewUser}
            statusLabels
          />
        </TabsContent>
      </Tabs>

      <AdminReviewMode
        user={reviewUser}
        open={!!reviewUser}
        onOpenChange={(o) => !o && setReviewUser(null)}
        onApprove={async (id) => {
          await onApprove(id);
          setReviewUser(null);
          load();
        }}
        onRequestEdits={(u) => {
          setReviewUser(null);
          onRequestEdits(u);
        }}
        onReject={(u) => {
          setReviewUser(null);
          onReject(u);
        }}
        actionDisabled={actionLoadingId === reviewUser?.id}
      />
    </div>
  );
}

function ReviewTable({
  users,
  emptyText,
  actionLoadingId,
  onOpen,
  onApprove,
  onRequestEdits,
  onReject,
  statusLabels,
}: {
  users: ReviewUser[];
  emptyText: string;
  actionLoadingId?: string | null;
  onOpen: (u: ReviewUser) => void;
  onApprove?: (userId: string) => Promise<void> | void;
  onRequestEdits?: (user: ReviewUser) => void;
  onReject?: (user: ReviewUser) => void;
  statusLabels?: boolean;
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>{statusLabels ? "Status" : "Signed Up"}</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const s = u.roles.includes("admin")
              ? "admin"
              : u.roles.includes("user")
              ? "approved"
              : u.rejection_reason
              ? "rejected"
              : "pending";
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {u.user_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {statusLabels ? (
                    <Badge
                      variant={
                        s === "admin"
                          ? "default"
                          : s === "approved"
                          ? "secondary"
                          : s === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {s}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {u.has_pending_update && (
                      <Badge variant="destructive" className="text-[10px]">Update</Badge>
                    )}
                    {u.is_flagged && (
                      <Badge variant="destructive" className="text-[10px]">Flagged</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => onOpen(u)}>
                    <Eye className="w-4 h-4 mr-1" /> Review
                  </Button>
                  {onRequestEdits && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRequestEdits(u)}
                      disabled={actionLoadingId === u.id}
                    >
                      <Edit3 className="w-4 h-4 mr-1" /> Edits
                    </Button>
                  )}
                  {onApprove && (
                    <Button
                      size="sm"
                      onClick={() => onApprove(u.id)}
                      disabled={actionLoadingId === u.id}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(u)}
                      disabled={actionLoadingId === u.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
