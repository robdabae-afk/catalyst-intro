import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  userId: string;
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const FeedbackModal = ({ userId }: FeedbackModalProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkShouldShowFeedback();
  }, [userId]);

  const checkShouldShowFeedback = async () => {
    try {
      // First check if we have a prompt record
      const { data: promptData, error: promptError } = await supabase
        .from('feedback_prompts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (promptError) throw promptError;

      const now = new Date();

      if (!promptData) {
        // No record exists, create one and show the modal
        await supabase.from('feedback_prompts').insert({
          user_id: userId,
          last_prompt_at: now.toISOString()
        });
        setOpen(true);
        return;
      }

      // Check if admin requested feedback
      if (promptData.admin_requested_at) {
        const adminRequestedAt = new Date(promptData.admin_requested_at);
        const lastFeedbackAt = promptData.last_feedback_at ? new Date(promptData.last_feedback_at) : null;
        
        // Show if admin requested after last feedback
        if (!lastFeedbackAt || adminRequestedAt > lastFeedbackAt) {
          await supabase
            .from('feedback_prompts')
            .update({ last_prompt_at: now.toISOString() })
            .eq('user_id', userId);
          setOpen(true);
          return;
        }
      }

      // Check if 2 days have passed since last prompt
      const lastPromptAt = promptData.last_prompt_at ? new Date(promptData.last_prompt_at) : null;
      
      if (!lastPromptAt || (now.getTime() - lastPromptAt.getTime()) >= TWO_DAYS_MS) {
        await supabase
          .from('feedback_prompts')
          .update({ last_prompt_at: now.toISOString() })
          .eq('user_id', userId);
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  const handleSkip = async () => {
    setOpen(false);
    setRating(0);
    setFeedback('');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Please select a rating'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          rating,
          feedback_text: feedback || null
        });

      if (feedbackError) throw feedbackError;

      // Update prompt status
      await supabase
        .from('feedback_prompts')
        .update({ 
          last_feedback_at: new Date().toISOString(),
          admin_requested_at: null
        })
        .eq('user_id', userId);

      toast({ title: 'Thank you for your feedback!' });
      setOpen(false);
      setRating(0);
      setFeedback('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error submitting feedback',
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic content based on rating
  const getHeader = () => {
    if (rating === 0) return 'How are we doing?';
    if (rating <= 3) return 'How can we fix it?';
    return 'Glad to hear it.';
  };

  const getDescription = () => {
    if (rating === 0) return 'Please rate your experience.';
    return '';
  };

  const getPlaceholder = () => {
    if (rating === 0) return 'Optional details...';
    if (rating <= 3) return 'Please tell us what is not working for you...';
    return 'What feature do you enjoy the most?';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{getHeader()}</DialogTitle>
          {getDescription() && (
            <DialogDescription>{getDescription()}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    'w-10 h-10 transition-colors',
                    (hoveredRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Feedback Text */}
          <Textarea
            placeholder={getPlaceholder()}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
