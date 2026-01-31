import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareProfileButtonProps {
  profileId: string;
  variant?: "default" | "ghost" | "outline" | "icon" | "card";
  className?: string;
  showLabel?: boolean;
}

export const ShareProfileButton = ({
  profileId,
  variant = "default",
  className,
  showLabel = true,
}: ShareProfileButtonProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const profileUrl = `${window.location.origin}/profile/${profileId}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: "Link copied to clipboard!",
        description: "Share this link to invite others to view this profile.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again.",
      });
    }
  };

  // Icon-only variant for swipe card (transparent bubble style)
  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className={cn(
          "p-2.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 transition-all hover:bg-black/60 active:scale-95",
          className
        )}
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : (
          <Share2 className="w-5 h-5 text-white/80" />
        )}
      </button>
    );
  }

  // Card variant for settings page
  if (variant === "card") {
    return (
      <div
        onClick={handleShare}
        className={cn(
          "relative cursor-pointer group overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all",
          className
        )}
      >
        <div className="p-6 flex items-center gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            {copied ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <Share2 className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Share My Profile</h3>
            <p className="text-sm text-muted-foreground">
              Copy your unique CATALYST profile link
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              {copied ? "Copied!" : "Copy Link"}
            </span>
          </div>
        </div>
        {/* Decorative CATALYST branding */}
        <div className="absolute top-2 right-2 text-[10px] font-bold tracking-widest text-primary/30 uppercase">
          CATALYST
        </div>
      </div>
    );
  }

  // Default button variants
  return (
    <Button
      variant={variant === "default" ? "default" : variant}
      size="sm"
      onClick={handleShare}
      className={className}
    >
      {copied ? (
        <Check className="w-4 h-4 mr-2" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      )}
      {showLabel && (copied ? "Copied!" : "Share Profile")}
    </Button>
  );
};
