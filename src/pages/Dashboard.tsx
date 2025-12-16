import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import { SwipeCard } from "@/components/SwipeCard";
import { MatchModal } from "@/components/MatchModal";
import { AppNavigation } from "@/components/AppNavigation";

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
      <AppNavigation 
        userType={currentUser?.user_type}
        userName={currentUser?.name}
        avatarUrl={currentUser?.avatar_url}
      />

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
