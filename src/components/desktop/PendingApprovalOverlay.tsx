import React from 'react';
import { Clock, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PendingApprovalOverlayProps {
  onDismiss: () => void;
}

export const PendingApprovalOverlay: React.FC<PendingApprovalOverlayProps> = ({ onDismiss }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-luxury-gold/10 rounded-full border border-luxury-gold/30">
            <Clock className="h-12 w-12 text-luxury-gold" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-playfair text-white mb-4">
          Account Under Review
        </h2>

        {/* Message */}
        <p className="text-zinc-400 mb-2 leading-relaxed">
          Your account is currently under review. Please check your status daily.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          You can still edit your profile while waiting for approval.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            className="border-zinc-700 hover:border-zinc-600 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="text-zinc-400 hover:text-white"
          >
            Dismiss
          </Button>
        </div>

        {/* Logout link */}
        <button
          onClick={handleLogout}
          className="mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <LogOut className="h-3 w-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
