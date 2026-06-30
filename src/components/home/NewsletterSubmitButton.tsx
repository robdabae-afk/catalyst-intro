import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  link: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional(),
});

interface Props {
  userId: string | null;
}

export function NewsletterSubmitButton({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!userId) return;
    const parsed = schema.safeParse({ title, link, note });
    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Invalid submission",
        description: parsed.error.issues[0]?.message ?? "Please check your inputs.",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("home_newsletter_submissions").insert({
      submitter_id: userId,
      title: parsed.data.title,
      link: parsed.data.link || null,
      note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Submission failed", description: error.message });
      return;
    }
    toast({ title: "Submitted!", description: "Thanks — we'll review it shortly." });
    setTitle("");
    setLink("");
    setNote("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Submit to newsletter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Newsletter submission</DialogTitle>
          <DialogDescription>
            Share something the community should know about. Admins review submissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ns-title">Title *</Label>
            <Input
              id="ns-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="What's your submission about?"
            />
          </div>
          <div>
            <Label htmlFor="ns-link">Link (optional)</Label>
            <Input
              id="ns-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={500}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="ns-note">Note (optional, max 500 chars)</Label>
            <Textarea
              id="ns-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !userId}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
