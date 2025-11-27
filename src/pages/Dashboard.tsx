import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Coffee, FileText, TrendingUp, Users, RotateCcw } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { NavLink } from "@/components/NavLink";

interface Profile {
  id: string;
  user_type: 'founder' | 'investor';
  name: string;
  email: string;
}

interface FounderProfile {
  startup_name: string;
  one_liner: string;
  industry: string | null;
  preferred_city: string | null;
}

interface InvestorProfile {
  firm_name: string | null;
  typical_check_size: string | null;
  preferred_stage: string | null;
  location: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadProfiles();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setCurrentUser(profile);
  };

  const loadProfiles = async () => {
    if (!currentUser) return;

    try {
      // Load profiles of opposite type
      const targetType = currentUser.user_type === 'founder' ? 'investor' : 'founder';
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          *,
          founder_profiles (*),
          investor_profiles (*)
        `)
        .eq('user_type', targetType)
        .neq('id', currentUser.id);

      // Get user's swipes to filter out already swiped profiles
      const { data: swipesData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', currentUser.id);

      const swipedIds = new Set(swipesData?.map(s => s.swiped_id) || []);
      const unswipedProfiles = profilesData?.filter(p => !swipedIds.has(p.id)) || [];

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

  const handleReset = () => {
    setCurrentIndex(0);
    loadProfiles();
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
              FundMatch
            </h1>
            <div className="flex gap-2 sm:gap-4">
              <NavLink to="/dashboard">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Discover</span>
              </NavLink>
              <NavLink to="/matches">
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink to="/coffeechat">
                <Coffee className="w-5 h-5" />
                <span className="hidden sm:inline">Coffee Chats</span>
              </NavLink>
              {currentUser?.user_type === 'founder' && (
                <>
                  <NavLink to="/safes">
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">SAFEs</span>
                  </NavLink>
                  <NavLink to="/captable">
                    <TrendingUp className="w-5 h-5" />
                    <span className="hidden sm:inline">Cap Table</span>
                  </NavLink>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
                Logout
              </Button>
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
              Check back later for new {currentUser?.user_type === 'founder' ? 'investors' : 'founders'} to connect with
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
