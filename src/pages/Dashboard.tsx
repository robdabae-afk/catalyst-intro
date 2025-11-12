import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, TrendingUp, LogOut, Search } from "lucide-react";

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
  const [founders, setFounders] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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
    try {
      const { data: foundersData } = await supabase
        .from('profiles')
        .select(`
          *,
          founder_profiles (*)
        `)
        .eq('user_type', 'founder');

      const { data: investorsData } = await supabase
        .from('profiles')
        .select(`
          *,
          investor_profiles (*)
        `)
        .eq('user_type', 'investor');

      setFounders(foundersData || []);
      setInvestors(investorsData || []);
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

  const filterProfiles = (profiles: any[]) => {
    if (!searchTerm) return profiles;
    
    return profiles.filter(profile => {
      const searchLower = searchTerm.toLowerCase();
      return (
        profile.name.toLowerCase().includes(searchLower) ||
        (profile.founder_profiles?.[0]?.startup_name?.toLowerCase().includes(searchLower)) ||
        (profile.founder_profiles?.[0]?.industry?.toLowerCase().includes(searchLower)) ||
        (profile.investor_profiles?.[0]?.firm_name?.toLowerCase().includes(searchLower))
      );
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Catalyst Connect</h1>
          <div className="flex items-center gap-4">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, startup, industry, or firm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {currentUser?.user_type === 'investor' && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Founders</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterProfiles(founders).map((founder) => (
                <FounderCard key={founder.id} founder={founder} />
              ))}
            </div>
          </section>
        )}

        {currentUser?.user_type === 'founder' && (
          <section>
            <h2 className="text-3xl font-bold mb-6 text-foreground">Investors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterProfiles(investors).map((investor) => (
                <InvestorCard key={investor.id} investor={investor} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const FounderCard = ({ founder }: { founder: any }) => {
  const navigate = useNavigate();
  const profile = founder.founder_profiles?.[0];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span>{profile?.startup_name}</span>
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </CardTitle>
        <CardDescription>{founder.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">{profile?.one_liner}</p>
        {profile?.industry && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            {profile.industry}
          </div>
        )}
        {profile?.preferred_city && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {profile.preferred_city}
          </div>
        )}
        <Button 
          className="w-full mt-4"
          onClick={() => navigate(`/coffeechat?founderId=${founder.id}`)}
        >
          Invite to Coffee Chat
        </Button>
      </CardContent>
    </Card>
  );
};

const InvestorCard = ({ investor }: { investor: any }) => {
  const navigate = useNavigate();
  const profile = investor.investor_profiles?.[0];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-start justify-between">
          <span>{profile?.firm_name || investor.name}</span>
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </CardTitle>
        <CardDescription>{investor.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile?.typical_check_size && (
          <div className="text-sm">
            <span className="font-medium">Check Size:</span> {profile.typical_check_size}
          </div>
        )}
        {profile?.preferred_stage && (
          <div className="text-sm">
            <span className="font-medium">Stage:</span> {profile.preferred_stage}
          </div>
        )}
        {profile?.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {profile.location}
          </div>
        )}
        <Button 
          className="w-full mt-4"
          onClick={() => navigate(`/coffeechat?investorId=${investor.id}`)}
        >
          Invite to Coffee Chat
        </Button>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
