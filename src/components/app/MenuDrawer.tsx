import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Users,
  Inbox,
  FileText,
  Headphones,
  SlidersHorizontal,
  Gift,
  Share2,
  Settings,
  Shield,
  LogOut,
  Star,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  userType?: "founder" | "investor" | null;
  userId?: string;
  isPro?: boolean;
}

const GOLD = "#0B0B0B";
const RED = "#B42318";

export function MenuDrawer({ open, onClose, userType, userId, isPro }: MenuDrawerProps) {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const pendingRequests = usePendingRequests();
  const unreadMessages = useUnreadMessages();
  const { toast } = useToast();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    onClose();
  };

  const handleShareProfile = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Your profile link is in the clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
    onClose();
  };

  const totalBadge = pendingRequests + unreadMessages;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="p-0 border-0"
        style={{
          width: 224,
          background: "#FFFFFF",
          borderLeft: "1px solid #E6E6E3",
          fontFamily: "'Schibsted Grotesk', system-ui, sans-serif",
        }}
      >
        <nav className="flex flex-col h-full py-2">
          {/* Core items */}
          <MenuItem
            icon={<Users size={17} color={GOLD} />}
            label="Matches"
            badge={totalBadge}
            onClick={() => go("/messages")}
          />
          <MenuItem
            icon={<Inbox size={17} color={GOLD} />}
            label="Inbox"
            badge={unreadMessages}
            onClick={() => go("/messages")}
          />
          {userType === "founder" ? (
            <>
              <MenuItem
                icon={<FileText size={17} color={GOLD} />}
                label="Cap Table"
                onClick={() => go("/captable")}
              />
              <MenuItem
                icon={<BarChart3 size={17} color={GOLD} />}
                label="Profile Analytics"
                onClick={() => go("/founder-analytics")}
              />
            </>
          ) : (
            <>
              <MenuItem
                icon={<FileText size={17} color={GOLD} />}
                label="Cap Table"
                onClick={() => go("/portfolio")}
              />
              <MenuItem
                icon={<TrendingUp size={17} color={GOLD} />}
                label="Market Pulse"
                onClick={() => go("/market-pulse")}
              />
            </>
          )}
          <MenuItem
            icon={<Headphones size={17} color={GOLD} />}
            label="Concierge"
            onClick={() => go("/concierge")}
          />

          <Divider />

          <MenuItem
            icon={<SlidersHorizontal size={17} color={GOLD} />}
            label="Discovery Filters"
            onClick={() => go("/filters")}
          />
          <MenuItem
            icon={<Gift size={17} color={GOLD} />}
            label="Referrals"
            onClick={() => go("/referrals")}
          />
          <MenuItem
            icon={<Share2 size={17} color={GOLD} />}
            label="Share my profile"
            onClick={handleShareProfile}
          />

          <Divider />

          <MenuItem
            icon={<Settings size={17} color={GOLD} />}
            label="Settings"
            onClick={() => go("/settings")}
          />
          {isAdmin && (
            <MenuItem
              icon={<Shield size={17} color={GOLD} />}
              label="Admin"
              onClick={() => go("/admin")}
            />
          )}

          {/* Get Pro CTA */}
          {!isPro && (
            <div className="mx-2 mt-2 mb-1">
              <button
                onClick={() => go("/settings")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                style={{
                  background: "#0B0B0B",
                }}
              >
                <Star size={17} color="#FFFFFF" />
                <span style={{ color: "#FFFFFF", fontSize: 13.5, fontWeight: 700 }}>
                  Get Pro
                </span>
              </button>
            </div>
          )}

          <Divider />

          <MenuItem
            icon={<LogOut size={17} color={RED} />}
            label="Log out"
            labelColor={RED}
            onClick={handleLogout}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MenuItem({
  icon,
  label,
  badge,
  onClick,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
  labelColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl hover:bg-[#F4F4F2] transition-colors text-left"
    >
      {icon}
      <span style={{ fontSize: 13.5, color: labelColor ?? "#0B0B0B", fontWeight: 500, flex: 1 }}>
        {label}
      </span>
      {badge ? (
        <span
          className="flex items-center justify-center text-[10px] font-bold rounded-full"
          style={{
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            background: "#0B0B0B",
            color: "#FFFFFF",
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="mx-4 my-1"
      style={{ height: 1, background: "#E6E6E3" }}
    />
  );
}
