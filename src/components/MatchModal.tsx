import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: any;
  userType: 'founder' | 'investor';
}

export const MatchModal = ({ isOpen, onClose, matchedProfile, userType }: MatchModalProps) => {
  const navigate = useNavigate();

  const handleScheduleChat = () => {
    const queryParam = userType === 'investor' 
      ? `founderId=${matchedProfile.id}`
      : `investorId=${matchedProfile.id}`;
    navigate(`/coffeechat?${queryParam}`);
  };

  const profileData = userType === 'founder' 
    ? matchedProfile?.investor_profiles?.[0] 
    : matchedProfile?.founder_profiles?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center animate-scale-in">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">It's a Match!</DialogTitle>
          <DialogDescription className="text-center text-base">
            You and {matchedProfile?.name} both liked each other. Start a conversation!
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="font-medium text-center">
            {userType === 'investor' 
              ? profileData?.startup_name 
              : profileData?.firm_name || matchedProfile?.name}
          </p>
          {profileData?.one_liner && (
            <p className="text-sm text-center text-muted-foreground">{profileData.one_liner}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Keep Swiping
          </Button>
          <Button className="flex-1" onClick={handleScheduleChat}>
            Schedule Coffee Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
