import { useState } from "react";
import { Heart, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExpressInterest } from "@/hooks/useExpressInterest";
import { glass } from "@/components/app/StartupUpdateCard";

const GOLD = "#C6A02C";
const TEXT = "#F6F5F2";
const MUTED = "#94908A";

export type IntroTarget = {
  founderId: string;
  founderName: string;
  startupName?: string | null;
  updateTitle?: string | null;
};

/**
 * Slide-up banner shown to investors when they request an intro from an update.
 * Sends a like to the founder plus a priority message request.
 */
export function RequestIntroBanner({
  target,
  investorId,
  onClose,
}: {
  target: IntroTarget;
  investorId: string | undefined;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { expressInterest } = useExpressInterest(investorId);
  const [note, setNote] = useState(
    target.updateTitle
      ? `Saw your update "${target.updateTitle}" — would love an intro.`
      : "Would love an intro to learn more.",
  );
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!investorId) return;
    setSending(true);
    try {
      const result = await expressInterest(target.founderId);
      if (!result.ok) throw new Error(result.error || "Could not send interest");

      await supabase.from("intro_requests").insert({
        founder_id: target.founderId,
        investor_id: investorId,
        why_you: note.trim() || null,
        status: "pending",
      });

      await supabase.from("messages").insert({
        sender_id: investorId,
        receiver_id: target.founderId,
        content: `Intro request${target.startupName ? ` · ${target.startupName}` : ""}\n\n${note.trim()}`,
      });

      toast({
        title: "Intro request sent",
        description: `${target.founderName} received your interest and message.`,
      });
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not send", description: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      <div
        className="relative w-full rounded-t-[24px] p-5 pb-8 flex flex-col gap-3"
        style={{ ...glass, borderTop: `1px solid ${GOLD}` }}
      >
        <div className="flex items-start gap-3">
          <Heart size={18} color={GOLD} strokeWidth={1.6} className="mt-0.5" />
          <div className="flex-1">
            <p style={{ color: TEXT, fontSize: 16, fontFamily: "Fraunces, serif", fontWeight: 600 }}>
              Request an intro
            </p>
            <p style={{ color: MUTED, fontSize: 12.5, marginTop: 2 }}>
              Sends a like to {target.founderName}
              {target.startupName ? ` (${target.startupName})` : ""} and a priority message straight
              to their inbox.
            </p>
          </div>
          <button onClick={onClose} aria-label="Dismiss">
            <X size={18} color={MUTED} strokeWidth={1.6} />
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-[14px] p-3 outline-none resize-none"
          style={{ ...glass, color: TEXT, fontSize: 13.5 }}
          placeholder="Add a short note for the founder"
        />

        <button
          onClick={send}
          disabled={sending}
          className="h-11 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: GOLD, color: "#2A2005", fontSize: 14, fontWeight: 600 }}
        >
          <Send size={15} strokeWidth={1.8} />
          {sending ? "Sending…" : "Send intro request"}
        </button>
      </div>
    </div>
  );
}
