import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EditSuggestion {
  admin_edit_suggestion: string | null;
  admin_edit_message: string | null;
}

export function AdminEditSuggestionBanner() {
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<EditSuggestion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchSuggestion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('admin_edit_suggestion, admin_edit_message')
        .eq('id', user.id)
        .single();

      if (data?.admin_edit_suggestion) {
        setSuggestion(data);
      }
    };

    fetchSuggestion();
  }, []);

  const handleAcknowledge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        admin_edit_suggestion: null,
        admin_edit_message: null,
        has_pending_update: true,
      })
      .eq('id', user.id);

    setSuggestion(null);
    navigate('/settings');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!suggestion || dismissed) return null;

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <MessageSquare className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Admin Review Feedback
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p className="text-amber-700 dark:text-amber-300">
            <strong>Suggested changes:</strong> {suggestion.admin_edit_suggestion}
          </p>
          {suggestion.admin_edit_message && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              <strong>Note:</strong> {suggestion.admin_edit_message}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAcknowledge}>
              <Check className="w-4 h-4 mr-1" />
              Edit My Profile
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              <X className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
