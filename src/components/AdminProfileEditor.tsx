import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface AdminProfileEditorProps {
  userId: string;
  userType: "founder" | "investor";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AdminProfileEditor({
  userId,
  userType,
  open,
  onOpenChange,
  onSaved,
}: AdminProfileEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [base, setBase] = useState<any>({});
  const [role, setRole] = useState<any>({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("name, email, linkedin_url, avatar_url, is_hidden")
        .eq("id", userId)
        .maybeSingle();
      setBase(p || {});
      const table = userType === "founder" ? "founder_profiles" : "investor_profiles";
      const { data: r } = await supabase
        .from(table as any)
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle();
      setRole(r || {});
      setLoading(false);
    })();
  }, [open, userId, userType]);

  const save = async () => {
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          name: base.name,
          email: base.email,
          linkedin_url: base.linkedin_url || null,
          avatar_url: base.avatar_url || null,
        })
        .eq("id", userId);
      if (pErr) throw pErr;

      const table = userType === "founder" ? "founder_profiles" : "investor_profiles";
      const payload =
        userType === "founder"
          ? {
              startup_name: role.startup_name,
              company_name: role.company_name,
              one_liner: role.one_liner,
              stage: role.stage,
              traction: role.traction,
              preferred_city: role.preferred_city,
              pitch_deck_url: role.pitch_deck_url,
              banner_url: role.banner_url,
              funding_amount: role.funding_amount,
              mrr: role.mrr,
            }
          : {
              firm_name: role.firm_name,
              position: role.position,
              investment_thesis: role.investment_thesis,
              typical_check_size: role.typical_check_size,
              preferred_stage: role.preferred_stage,
              location: role.location,
              portfolio_link: role.portfolio_link,
              banner_url: role.banner_url,
            };
      const { error: rErr } = await supabase
        .from(table as any)
        .update(payload)
        .eq("profile_id", userId);
      if (rErr) throw rErr;

      toast({ title: "Saved", description: "Profile updated successfully." });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const setB = (k: string, v: any) => setBase((s: any) => ({ ...s, [k]: v }));
  const setR = (k: string, v: any) => setRole((s: any) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Edit {userType} profile</DialogTitle>
          <DialogDescription>Direct admin edits. Changes apply immediately.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={base.name} onChange={(v) => setB("name", v)} />
              <Field label="Email" value={base.email} onChange={(v) => setB("email", v)} />
              <Field label="LinkedIn URL" value={base.linkedin_url} onChange={(v) => setB("linkedin_url", v)} />
              <Field label="Avatar URL" value={base.avatar_url} onChange={(v) => setB("avatar_url", v)} />
            </div>
            <div className="border-t border-zinc-800 pt-4 space-y-3">
              {userType === "founder" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Startup name" value={role.startup_name} onChange={(v) => setR("startup_name", v)} />
                    <Field label="Company name" value={role.company_name} onChange={(v) => setR("company_name", v)} />
                    <Field label="Stage" value={role.stage} onChange={(v) => setR("stage", v)} />
                    <Field label="Preferred city" value={role.preferred_city} onChange={(v) => setR("preferred_city", v)} />
                    <Field label="Funding amount" value={role.funding_amount} onChange={(v) => setR("funding_amount", v)} />
                    <Field label="MRR" value={role.mrr} onChange={(v) => setR("mrr", v)} />
                    <Field label="Pitch deck URL" value={role.pitch_deck_url} onChange={(v) => setR("pitch_deck_url", v)} />
                    <Field label="Banner URL" value={role.banner_url} onChange={(v) => setR("banner_url", v)} />
                  </div>
                  <TextField label="One-liner" value={role.one_liner} onChange={(v) => setR("one_liner", v)} />
                  <TextField label="Traction" value={role.traction} onChange={(v) => setR("traction", v)} />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Firm name" value={role.firm_name} onChange={(v) => setR("firm_name", v)} />
                    <Field label="Position" value={role.position} onChange={(v) => setR("position", v)} />
                    <Field label="Typical check size" value={role.typical_check_size} onChange={(v) => setR("typical_check_size", v)} />
                    <Field label="Preferred stage" value={role.preferred_stage} onChange={(v) => setR("preferred_stage", v)} />
                    <Field label="Location" value={role.location} onChange={(v) => setR("location", v)} />
                    <Field label="Portfolio link" value={role.portfolio_link} onChange={(v) => setR("portfolio_link", v)} />
                    <Field label="Banner URL" value={role.banner_url} onChange={(v) => setR("banner_url", v)} />
                  </div>
                  <TextField label="Investment thesis" value={role.investment_thesis} onChange={(v) => setR("investment_thesis", v)} />
                </>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="bg-zinc-900 border-zinc-800" />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="bg-zinc-900 border-zinc-800 min-h-20" />
    </div>
  );
}
