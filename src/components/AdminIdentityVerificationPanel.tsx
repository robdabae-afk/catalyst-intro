import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IdCard, Check, XCircle, Clock, Loader2 } from "lucide-react";
import { getSignedVerificationUrl } from "@/hooks/useIdentityVerification";

interface VerificationRow {
  id: string;
  profile_id: string;
  id_document_url: string;
  selfie_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  profile?: { name: string; email: string; user_type: string };
}

export const AdminIdentityVerificationPanel = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [rejectTarget, setRejectTarget] = useState<VerificationRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("identity_verifications")
      .select("*")
      .order("submitted_at", { ascending: false });

    const list: VerificationRow[] = data ?? [];
    const profileIds = [...new Set(list.map((r) => r.profile_id))];
    let profileMap: Record<string, any> = {};
    if (profileIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, user_type")
        .in("id", profileIds);
      profileMap = (profiles ?? []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
    }

    setRows(list.map((r) => ({ ...r, profile: profileMap[r.profile_id] })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visibleRows = filter === "pending" ? rows.filter((r) => r.status === "pending") : rows;

  useEffect(() => {
    // Lazily resolve signed URLs for the currently visible rows
    (async () => {
      const updates: Record<string, string> = {};
      for (const row of visibleRows) {
        if (!signedUrls[row.id_document_url]) {
          const url = await getSignedVerificationUrl(row.id_document_url);
          if (url) updates[row.id_document_url] = url;
        }
        if (!signedUrls[row.selfie_url]) {
          const url = await getSignedVerificationUrl(row.selfie_url);
          if (url) updates[row.selfie_url] = url;
        }
      }
      if (Object.keys(updates).length) {
        setSignedUrls((prev) => ({ ...prev, ...updates }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter]);

  const approve = async (row: VerificationRow) => {
    setActionLoading(row.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("identity_verifications")
        .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString(), rejection_reason: null })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "Approved", description: `${row.profile?.name ?? "User"}'s identity has been verified.` });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approve failed", description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setActionLoading(rejectTarget.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("identity_verifications")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;
      toast({ title: "Rejected", description: `${rejectTarget.profile?.name ?? "User"} has been notified to resubmit.` });
      setRejectTarget(null);
      setRejectionReason("");
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Reject failed", description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>Review government ID + selfie submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
              Pending ({rows.filter((r) => r.status === "pending").length})
            </Button>
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              All ({rows.length})
            </Button>
          </div>

          {visibleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nothing to review.</p>
          ) : (
            <div className="space-y-4">
              {visibleRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium">{row.profile?.name ?? "Unknown user"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.profile?.email} · <span className="capitalize">{row.profile?.user_type}</span> · submitted {new Date(row.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    {statusBadge(row.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ID document</p>
                      {signedUrls[row.id_document_url] ? (
                        <img src={signedUrls[row.id_document_url]} alt="ID document" className="rounded-md w-full aspect-video object-cover border border-border" />
                      ) : (
                        <div className="rounded-md w-full aspect-video bg-muted flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Selfie</p>
                      {signedUrls[row.selfie_url] ? (
                        <img src={signedUrls[row.selfie_url]} alt="Selfie" className="rounded-md w-full aspect-video object-cover border border-border" />
                      ) : (
                        <div className="rounded-md w-full aspect-video bg-muted flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {row.status === "rejected" && row.rejection_reason && (
                    <p className="text-xs text-destructive">Reason: {row.rejection_reason}</p>
                  )}

                  {row.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(row)} disabled={actionLoading === row.id}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectTarget(row)} disabled={actionLoading === row.id}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
            <DialogDescription>
              {rejectTarget?.profile?.name} will be notified and asked to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="e.g. ID photo is too blurry to read the date of birth."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={!rejectionReason.trim() || actionLoading === rejectTarget?.id}>
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
