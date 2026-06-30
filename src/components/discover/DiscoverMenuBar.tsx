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
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4 h-14">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer shrink-0"
          >
            CATALYST
          </h1>
          {isPro && (
            <Badge className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] h-5">
              <Crown className="w-3 h-3 mr-0.5" /> PRO
            </Badge>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name…"
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* View tabs (desktop) */}
          <div className="hidden md:flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-muted/30">
            {VIEWS.map((v) => {
              const active = view === v.id;
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => onViewChange(v.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Avatar dropdown (desktop) */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ""} alt={userName || ""} />
                    <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
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

          {/* Mobile hamburger */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl || ""} alt={userName || ""} />
                  <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{userName}</div>
                  <div className="text-xs text-muted-foreground capitalize">{userType}</div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 mt-3">{NavItems}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* View tabs (mobile, below row) */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium shrink-0 transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
