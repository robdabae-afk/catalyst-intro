import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings as SettingsIcon,
  Share2,
  Shield,
  TrendingUp,
  FileText,
  DollarSign,
  Sparkles,
  Users,
  Bookmark,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { GetProButton } from "@/components/GetProButton";
import { useNewMatches } from "@/hooks/useNewMatches";

interface Props {
  userId?: string;
  userType?: "founder" | "investor" | null;
  userName?: string;
  avatarUrl?: string | null;
  isPro?: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  view: "all" | "trending" | "new" | "featured" | "saved";
  onViewChange: (v: "all" | "trending" | "new" | "featured" | "saved") => void;
}

const VIEWS: { id: Props["view"]; label: string; icon: any }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "new", label: "New", icon: Sparkles },
  { id: "featured", label: "Featured", icon: Crown },
  { id: "saved", label: "Saved", icon: Bookmark },
];

export function DiscoverMenuBar({
  userId,
  userType,
  userName,
  avatarUrl,
  isPro,
  search,
  onSearchChange,
  view,
  onViewChange,
}: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const pendingRequests = usePendingRequests();
  const unreadMessages = useUnreadMessages();
  const newMatches = useNewMatches();
  const { isAdmin } = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleShare = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}`);
      toast({ title: "Profile link copied" });
    } catch {
      toast({ variant: "destructive", title: "Copy failed" });
    }
  };

  const NavItems = (
    <>
      <Link
        to="/matches"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted relative"
      >
        <MessageSquare className="w-4 h-4" /> Matches
        {newMatches > 0 && (
          <Badge className="ml-auto h-5 px-1.5 text-[10px]">{newMatches}</Badge>
        )}
      </Link>
      <Link
        to="/requests"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted relative"
      >
        <Inbox className="w-4 h-4" /> Inbox
        {pendingRequests + unreadMessages > 0 && (
          <Badge className="ml-auto h-5 px-1.5 text-[10px]">
            {pendingRequests + unreadMessages}
          </Badge>
        )}
      </Link>
      {userType === "investor" && (
        <Link
          to="/investments"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
        >
          <DollarSign className="w-4 h-4" /> My Investments
        </Link>
      )}
      {userType === "founder" && (
        <Link
          to="/captable"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
        >
          <FileText className="w-4 h-4" /> Cap Table
        </Link>
      )}
      <Link
        to="/concierge"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
      >
        <Users className="w-4 h-4" /> Concierge
      </Link>
      <Link
        to="/filters"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
      >
        <SettingsIcon className="w-4 h-4" /> Discovery Filters
      </Link>
      <Link
        to="/referrals"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
      >
        <Share2 className="w-4 h-4" /> Referrals
      </Link>
      <Link
        to="/settings"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
      >
        <SettingsIcon className="w-4 h-4" /> Settings
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
        >
          <Shield className="w-4 h-4" /> Admin
        </Link>
      )}
      {!isPro && userType && (
        <div className="px-1 pt-1">
          <GetProButton userType={userType} variant="menu" />
        </div>
      )}
      <button
        onClick={handleLogout}
        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted text-destructive"
      >
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </>
  );

  return (
    <nav className="glass-nav shrink-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-3 h-11 sm:h-12">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-sm sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer shrink-0"
          >
            CATALYST
          </h1>
          {isPro && (
            <Badge className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] h-5">
              <Crown className="w-3 h-3 mr-0.5" /> PRO
            </Badge>
          )}

          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="pl-7 h-8 text-xs"
            />
          </div>

          {/* View tabs (desktop only) */}
          <div className="hidden lg:flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-muted/30">
            {VIEWS.map((v) => {
              const active = view === v.id;
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => onViewChange(v.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* View dropdown (mobile/tablet) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden h-8 px-2 text-xs shrink-0">
                {(() => {
                  const cur = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
                  const Icon = cur.icon;
                  return <Icon className="w-3.5 h-3.5" />;
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                return (
                  <DropdownMenuItem key={v.id} onClick={() => onViewChange(v.id)}>
                    <Icon className="w-4 h-4 mr-2" /> {v.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar dropdown (always visible) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 shrink-0">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatarUrl || ""} alt={userName || ""} />
                  <AvatarFallback className="text-xs">{userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/matches")}>
                <MessageSquare className="w-4 h-4 mr-2" /> Matches
                {newMatches > 0 && <Badge className="ml-auto h-5">{newMatches}</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/requests")}>
                <Inbox className="w-4 h-4 mr-2" /> Inbox
                {pendingRequests + unreadMessages > 0 && (
                  <Badge className="ml-auto h-5">{pendingRequests + unreadMessages}</Badge>
                )}
              </DropdownMenuItem>
              {userType === "investor" && (
                <DropdownMenuItem onClick={() => navigate("/investments")}>
                  <DollarSign className="w-4 h-4 mr-2" /> My Investments
                </DropdownMenuItem>
              )}
              {userType === "founder" && (
                <DropdownMenuItem onClick={() => navigate("/captable")}>
                  <FileText className="w-4 h-4 mr-2" /> Cap Table
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/concierge")}>
                <Users className="w-4 h-4 mr-2" /> Concierge
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/filters")}>
                <SettingsIcon className="w-4 h-4 mr-2" /> Discovery Filters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/referrals")}>
                <Share2 className="w-4 h-4 mr-2" /> Referrals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" /> Share my profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="w-4 h-4 mr-2" /> Admin
                </DropdownMenuItem>
              )}
              {!isPro && userType && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <GetProButton userType={userType} variant="menu" />
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
