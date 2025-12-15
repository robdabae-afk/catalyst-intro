import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, FileText, TrendingUp, Users, RotateCcw, Inbox, Shield, Settings, LogOut, ChevronDown } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { NavLink } from "@/components/NavLink";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  user_type: 'founder' | 'investor';
  name: string;
  email: string;
  avatar_url?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const pendingRequests = usePendingRequests();
  const { isAdmin } = useIsAdmin();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is approved (has any role)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roles || roles.length === 0) {
        navigate('/pending-approval');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        navigate('/');
        return;
      }

      setCurrentUser(profile);
      await loadProfiles(profile);
    };

    init();
  }, [navigate]);

  const loadProfiles = async (user: Profile) => {
    try {
      // Load profiles of opposite type
      const targetType = user.user_type === 'founder' ? 'investor' : 'founder';
      
      // Fetch base profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', targetType)
        .neq('id', user.id);

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch related profile data based on target type
      const profileIds = profilesData.map(p => p.id);
      
      let founderProfiles: any[] = [];
      let investorProfiles: any[] = [];

      if (targetType === 'founder') {
        const { data } = await supabase
          .from('founder_profiles')
          .select('*')
          .in('profile_id', profileIds);
        founderProfiles = data || [];
      } else {
        const { data } = await supabase
          .from('investor_profiles')
          .select('*')
          .in('profile_id', profileIds);
        investorProfiles = data || [];
      }

      // Merge profile data
      const mergedProfiles = profilesData.map(profile => ({
        ...profile,
        founder_profiles: founderProfiles.filter(fp => fp.profile_id === profile.id),
        investor_profiles: investorProfiles.filter(ip => ip.profile_id === profile.id)
      }));

      // Get user's swipes to filter out already swiped profiles
      const { data: swipesData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = new Set(swipesData?.map(s => s.swiped_id) || []);
      const unswipedProfiles = mergedProfiles.filter(p => !swipedIds.has(p.id));

      setProfiles(unswipedProfiles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profiles",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!currentUser || currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];

    try {
      // Record the swipe
      await supabase.from('swipes').insert({
        swiper_id: currentUser.id,
        swiped_id: swipedProfile.id,
        action: direction
      });

      // Check if it's a match (they liked us back)
      if (direction === 'like') {
        const { data: matchData } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedProfile.id)
          .eq('swiped_id', currentUser.id)
          .eq('action', 'like')
          .single();

        if (matchData) {
          setMatchedProfile(swipedProfile);
          setMatchModalOpen(true);
        }
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording swipe",
        description: error.message
      });
    }
  };

  const handleReset = async () => {
    setCurrentIndex(0);
    if (currentUser) {
      setLoading(true);
      await loadProfiles(currentUser);
    }
  };

  const remainingProfiles = profiles.length - currentIndex;
  const noMoreProfiles = currentIndex >= profiles.length;
  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              CATALYST
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <NavLink to="/dashboard">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Discover</span>
              </NavLink>
              <NavLink to="/matches">
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink to="/requests" badge={pendingRequests}>
                <Inbox className="w-5 h-5" />
                <span className="hidden sm:inline">Inbox</span>
              </NavLink>
              
              {/* Founder: Fundraising dropdown */}
              {currentUser?.user_type === 'founder' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                      <FileText className="w-5 h-5" />
                      <span className="hidden sm:inline">Fundraising</span>
                      <ChevronDown className="w-4 h-4" />
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
              {currentUser?.user_type === 'investor' && (
                <NavLink to="/investments">
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Investments</span>
                </NavLink>
              )}
              
              {/* Spacer */}
              <div className="flex-1" />
              
              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.avatar_url || ''} alt={currentUser?.name} />
                      <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
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

      {/* Main Content - Swipe Interface */}
      <div className="max-w-md mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          </div>
        ) : noMoreProfiles ? (
          <div className="text-center py-12 px-6">
            <div className="mb-6 text-6xl">🎉</div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">You're All Caught Up!</h3>
            <p className="text-muted-foreground mb-6">
              {profiles.length === 0 
                ? `No ${currentUser?.user_type === 'founder' ? 'investors' : 'founders'} have signed up yet. Check back later!`
                : `Check back later for new ${currentUser?.user_type === 'founder' ? 'investors' : 'founders'} to connect with`
              }
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Review Again
              </Button>
              <Button onClick={() => navigate('/matches')} size="lg">
                View Your Matches
              </Button>
            </div>
          </div>
        ) : currentProfile ? (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span>👈 Pass</span>
                  <span className="mx-2">•</span>
                  <span>Interested 👉</span>
                </span>
              </p>
            </div>
            <SwipeCard
              profile={currentProfile}
              onSwipe={handleSwipe}
              userType={currentUser?.user_type || 'founder'}
            />
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                {remainingProfiles} profile{remainingProfiles !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <MatchModal
        isOpen={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        matchedProfile={matchedProfile}
        userType={currentUser?.user_type || 'founder'}
      />
    </div>
  );
};

export default Dashboard;