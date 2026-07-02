import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import type { DiscoverProfile } from "@/hooks/useDiscoverFeed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: DiscoverProfile | null;
  founderId: string | undefined;
  onSubmitted: (investor: DiscoverProfile) => Promise<void> | void;
}

export function RequestIntroModal({ open, onOpenChange, investor, founderId, onSubmitted }: Props) {
  const { toast } = useToast();
  const [pitchSummary, setPitchSummary] = useState("");
  const [askAmount, setAskAmount] = useState("");
  const [askStage, setAskStage] = useState("");
  const [whyYou, setWhyYou] = useState("");
  const [includeDeck, setIncludeDeck] = useState(true);
  const [hasDeck, setHasDeck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  // Prefill from founder profile
  useEffect(() => {
    if (!open || !founderId) return;
    let cancelled = false;
    (async () => {
      setPrefillLoading(true);
      const { data } = await supabase
        .from("founder_profiles")
        .select("one_liner, stage, funding_amount, pitch_deck_url")
        .eq("profile_id", founderId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPitchSummary((prev) => prev || data.one_liner || "");
        setAskStage((prev) => prev || (data.stage as string) || "");
        setAskAmount((prev) => prev || data.funding_amount || "");
        setHasDeck(!!data.pitch_deck_url);
      }
      setPrefillLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, founderId]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setWhyYou("");
    }
  }, [open]);

  const submit = async () => {
    if (!founderId || !investor) return;
    if (!whyYou.trim()) {
      toast({ variant: "destructive", title: "Add a short note", description: "Tell the investor why you're reaching out." });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("intro_requests").insert({
        founder_id: founderId,
        investor_id: investor.id,
        pitch_summary: pitchSummary.trim() || null,
        ask_amount: askAmount.trim() || null,
        ask_stage: askStage.trim() || null,
        why_you: whyYou.trim(),
        include_deck: includeDeck && hasDeck,
      });
      if (error) throw error;

      await onSubmitted(investor);
      toast({ title: "Intro request sent", description: `${investor.name} will review and respond.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not send request", description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request intro with {investor?.name}</DialogTitle>
          <DialogDescription>
            Send a structured pitch. They'll accept to open a chat, or pass silently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="pitch" className="text-xs">Your one-liner</Label>
            <Input
              id="pitch"
              value={pitchSummary}
              onChange={(e) => setPitchSummary(e.target.value)}
              placeholder="What your startup does in one sentence"
              maxLength={140}
              disabled={prefillLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="ask" className="text-xs">Raising</Label>
              <Input
                id="ask"
                value={askAmount}
                onChange={(e) => setAskAmount(e.target.value)}
                placeholder="$500k"
              />
            </div>
            <div>
              <Label htmlFor="stage" className="text-xs">Stage</Label>
              <Input
                id="stage"
                value={askStage}
                onChange={(e) => setAskStage(e.target.value)}
                placeholder="Pre-seed"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="why" className="text-xs">Why them <span className="text-muted-foreground">(required)</span></Label>
            <Textarea
              id="why"
              value={whyYou}
              onChange={(e) => setWhyYou(e.target.value.slice(0, 500))}
              placeholder="Why this investor specifically — thesis fit, portfolio overlap, expertise…"
              rows={4}
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">{whyYou.length}/500</div>
          </div>

          {hasDeck && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <div className="text-xs font-medium">Attach pitch deck</div>
                <div className="text-[10px] text-muted-foreground">Share the deck from your profile</div>
              </div>
              <Switch checked={includeDeck} onCheckedChange={setIncludeDeck} />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !whyYou.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send request</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
