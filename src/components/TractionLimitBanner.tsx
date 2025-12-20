import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

const TRACTION_MAX_LENGTH = 250;

export const TractionLimitBanner = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [tractionLength, setTractionLength] = useState(0);

  useEffect(() => {
    const checkTractionLength = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profile?.user_type !== 'founder') return;

      const { data: founderProfile } = await supabase
        .from('founder_profiles')
        .select('traction')
        .eq('profile_id', user.id)
        .single();

      if (founderProfile?.traction && founderProfile.traction.length > TRACTION_MAX_LENGTH) {
        setTractionLength(founderProfile.traction.length);
        setShow(true);
      }
    };

    checkTractionLength();
  }, []);

  if (!show) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-destructive">Traction Section Too Long</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your traction section is {tractionLength} characters, which exceeds the {TRACTION_MAX_LENGTH} character limit. 
            Please update your profile to reduce it.
          </p>
          <Button 
            variant="destructive" 
            size="sm" 
            className="mt-3"
            onClick={() => navigate('/settings')}
          >
            Edit Profile
          </Button>
        </div>
        <button 
          onClick={() => setShow(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const TRACTION_LIMIT = TRACTION_MAX_LENGTH;
