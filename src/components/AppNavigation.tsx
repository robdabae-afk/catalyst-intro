import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ConciergeMatchButton } from "@/components/ConciergeMatchButton";
import { useUnreadSupportReplies } from "@/hooks/useUnreadSupportReplies";
import { supabase } from "@/integrations/supabase/client";
import { GetProButton } from "@/components/GetProButton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Users, 
  Inbox, 
  TrendingUp, 
  FileText, 
  Shield, 
  Settings, 
  LogOut,
  ChevronDown,
  Crown,
  Share2,
  Home as HomeIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppNavigationProps {
  userId?: string;
  userType?: 'founder' | 'investor' | null;
  userName?: string;
  avatarUrl?: string;
  pageTitle?: string;
  isPro?: boolean;
}

export const AppNavigation = ({ 
  userId,
  userType, 
  userName, 
  avatarUrl,
  pageTitle,
  isPro = false
}: AppNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const pendingRequests = usePendingRequests();
  const unreadMessages = useUnreadMessages();
  const { isAdmin } = useIsAdmin();
  const { count: supportReplies } = useUnreadSupportReplies();
  
  // Hub pages show full navigation (Dashboard/Discover)
  const isHubPage = location.pathname === '/dashboard' || location.pathname === '/discover' || location.pathname === '/home' || location.pathname === '/app/home';
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleShareMyProfile = async () => {
    if (!userId) return;
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied to clipboard!",
        description: "Share this link to invite others to view your profile.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again.",
      });
    }
  };

  // Spoke navigation - minimal back button header
  if (!isHubPage) {
    return (
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            
            {pageTitle && (
              <h1 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">
                {pageTitle}
              </h1>
            )}
            
            {/* Minimal user menu on spoke pages */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ''} alt={userName} />
                    <AvatarFallback>{userName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  {supportReplies > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center text-[10px] text-destructive-foreground font-medium">
                      {supportReplies > 9 ? '9+' : supportReplies}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border w-48">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleShareMyProfile}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    );
  }

  // Hub navigation - full navigation bar
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <h1 
              className="text-sm sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              CATALYST
            </h1>
            {isPro && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0 h-5">
                <Crown className="w-3 h-3 mr-0.5" />
                PRO
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Concierge Match Button - Left of Discover */}
            {userId && userType && (
              <ConciergeMatchButton
                userId={userId}
                userType={userType}
                variant="compact"
                showBenefits={false}
              />
            )}
            
            <NavLink to="/home">
              <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink to="/dashboard">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Discover</span>
            </NavLink>
            <NavLink to="/requests" badge={pendingRequests + unreadMessages}>
              <Inbox className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Inbox</span>
            </NavLink>
            
            {/* Founder: Fundraising dropdown */}
            {userType === 'founder' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Fundraising</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border">
                  <DropdownMenuItem onClick={() => navigate('/captable')}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Cap Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Investor: Investments link */}
            {userType === 'investor' && (
              <NavLink to="/investments">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Investments</span>
              </NavLink>
            )}
            
            {/* Spacer */}
            <div className="flex-1" />
            
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8 relative">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarImage src={avatarUrl || ''} alt={userName} />
                    <AvatarFallback className="text-xs sm:text-sm">{userName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  {supportReplies > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center text-[10px] text-destructive-foreground font-medium">
                      {supportReplies > 9 ? '9+' : supportReplies}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border w-48">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isPro && userType && (
                  <>
                    <DropdownMenuItem asChild>
                      <GetProButton userType={userType} variant="menu" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleShareMyProfile}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
