import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface AdminEditSuggestionProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function AdminEditSuggestion({
  userId,
  userName,
  open,
  onOpenChange,
  onSent,
}: AdminEditSuggestionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a suggestion.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          admin_edit_suggestion: suggestion,
          admin_edit_message: message || null,
          has_pending_update: true,
        })
        .eq("id", userId);

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: { 
            userId, 
            type: 'edit_suggestion',
            editSuggestion: suggestion,
            editMessage: message || undefined
          }
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }

      toast({
        title: "Suggestion sent",
        description: `Edit suggestion sent to ${userName}. They will receive an email notification.`,
      });

      setSuggestion("");
      setMessage("");
      onSent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending suggestion",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Suggest Profile Edits</DialogTitle>
          <DialogDescription>
            Send edit suggestions to {userName}. They will be notified and can
            make changes before approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suggestion">Suggested Edits *</Label>
            <Textarea
              id="suggestion"
              placeholder="Describe what changes should be made to the profile..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Any additional context or explanation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendSuggestion} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Sending..." : "Send Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
