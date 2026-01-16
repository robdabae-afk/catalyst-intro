import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Quote } from "lucide-react";

interface EndorseUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName: string;
}

export const EndorseUserDialog = ({
    isOpen,
    onClose,
    targetUserId,
    targetUserName
}: EndorseUserDialogProps) => {
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) {
            toast.error("Please enter an endorsement message.");
            return;
        }

        setSubmitting(true);
        try {
            // Mock submission for frontend demo
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Log for debugging
            console.log("Mock Endorsement Submitted:", {
                recipient_id: targetUserId,
                text: text.trim()
            });

            toast.success("Endorsement submitted successfully!");
            setText("");
            onClose();
        } catch (error: any) {
            console.error("Error submitting endorsement:", error);
            toast.error(error.message || "Failed to submit endorsement");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Quote className="w-5 h-5 text-amber-500" />
                        Endorse {targetUserName}
                    </DialogTitle>
                    <DialogDescription>
                        Share your experience working with {targetUserName}. This will be displayed on their profile.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        placeholder={`"Working with ${targetUserName.split(' ')[0]} was..."`}
                        className="min-h-[120px]"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-black">
                        {submitting ? "Submitting..." : "Submit Endorsement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
