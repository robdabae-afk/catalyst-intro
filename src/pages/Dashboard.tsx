import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, RotateCcw } from "lucide-react";
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

  const handleSignOut = async () => {
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const currentProfile = profiles[currentIndex];
  const noMoreProfiles = currentIndex >= profiles.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">InvestorMatch</h1>
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="text-sm font-medium hover:text-primary" activeClassName="text-primary">
              Dashboard
            </NavLink>
            <NavLink to="/matches" className="text-sm font-medium hover:text-primary" activeClassName="text-primary">
              Matches
            </NavLink>
            <NavLink to="/coffeechat" className="text-sm font-medium hover:text-primary" activeClassName="text-primary">
              Coffee Chats
            </NavLink>
            <span className="text-sm text-muted-foreground">
              {currentUser?.name} ({currentUser?.user_type})
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">
            {currentUser?.user_type === 'investor' ? 'Discover Founders' : 'Discover Investors'}
          </h2>
          <p className="text-muted-foreground">
            Swipe right to like, left to pass
          </p>
        </div>

        {noMoreProfiles ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-muted/50 rounded-lg p-8 space-y-4">
              <h3 className="text-2xl font-bold">No More Profiles</h3>
              <p className="text-muted-foreground">
                You've seen all available {currentUser?.user_type === 'investor' ? 'founders' : 'investors'}!
              </p>
              <Button onClick={handleReset} className="mt-4">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset & View Again
              </Button>
            </div>
          </div>
        ) : currentProfile ? (
          <div className="pt-8 pb-32">
            <SwipeCard
              profile={currentProfile}
              onSwipe={handleSwipe}
              userType={currentUser?.user_type || 'founder'}
            />
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
