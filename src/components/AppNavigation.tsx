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
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Users, 
  Heart, 
  Inbox, 
  TrendingUp, 
  FileText, 
  Shield, 
  Settings, 
  LogOut,
  ChevronDown 
} from "lucide-react";

interface AppNavigationProps {
  userType?: 'founder' | 'investor' | null;
  userName?: string;
  avatarUrl?: string;
  pageTitle?: string;
}

export const AppNavigation = ({ 
  userType, 
  userName, 
  avatarUrl,
  pageTitle 
}: AppNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingRequests = usePendingRequests();
  const { isAdmin } = useIsAdmin();
  
  // Hub pages show full navigation (Dashboard/Discover)
  const isHubPage = location.pathname === '/dashboard' || location.pathname === '/discover';
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ''} alt={userName} />
                    <AvatarFallback>{userName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
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
          <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CATALYST
          </h1>
          <div className="flex items-center gap-1 sm:gap-4">
            <NavLink to="/dashboard">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Discover</span>
            </NavLink>
            <NavLink to="/matches">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Matches</span>
            </NavLink>
            <NavLink to="/requests" badge={pendingRequests}>
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
                  <DropdownMenuItem onClick={() => navigate('/safes')}>
                    <FileText className="w-4 h-4 mr-2" />
                    SAFEs
                  </DropdownMenuItem>
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
                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarImage src={avatarUrl || ''} alt={userName} />
                    <AvatarFallback className="text-xs sm:text-sm">{userName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
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
