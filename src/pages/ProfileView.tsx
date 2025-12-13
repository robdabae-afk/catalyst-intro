import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, TrendingUp, DollarSign, Briefcase, Globe, User, Mail } from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: 'founder' | 'investor';
  founder_profile?: {
    startup_name: string;
    one_liner: string;
    industry: string | null;
    traction: string | null;
    preferred_city: string | null;
    company_name: string | null;
    company_state: string | null;
    company_address: string | null;
    pitch_deck_url: string | null;
    banner_url: string | null;
  };
  investor_profile?: {
    firm_name: string | null;
    typical_check_size: string | null;
    preferred_stage: string | null;
    sectors_of_interest: string[] | null;
    location: string | null;
    portfolio_link: string | null;
    banner_url: string | null;
  };
}

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Get current user type
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      setCurrentUserType(currentProfile?.user_type || null);

      // Fetch the profile being viewed
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !profileData) {
        navigate('/dashboard');
        return;
      }

      // Fetch type-specific profile
      let founderProfile = null;
      let investorProfile = null;

      if (profileData.user_type === 'founder') {
        const { data } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('profile_id', id)
          .single();
        founderProfile = data;
      } else {
        const { data } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('profile_id', id)
          .single();
        investorProfile = data;
      }

      setProfile({
        ...profileData,
        founder_profile: founderProfile,
        investor_profile: investorProfile,
      });
      setLoading(false);
    };

    fetchProfile();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isFounder = profile.user_type === 'founder';
  const bannerUrl = isFounder ? profile.founder_profile?.banner_url : profile.investor_profile?.banner_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-background/50 backdrop-blur-sm hover:bg-background/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-4 md:pt-0 md:pb-4">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {isFounder && profile.founder_profile && (
                  <p className="text-xl text-muted-foreground">{profile.founder_profile.startup_name}</p>
                )}
                {!isFounder && profile.investor_profile?.firm_name && (
                  <p className="text-xl text-muted-foreground">{profile.investor_profile.firm_name}</p>
                )}
                <Badge className="mt-2" variant="secondary">
                  {isFounder ? 'Founder' : 'Investor'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Main Info Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">
                {isFounder ? 'Startup Details' : 'Investment Focus'}
              </h2>

              {isFounder && profile.founder_profile && (
                <>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">One-liner</p>
                      <p className="font-medium">{profile.founder_profile.one_liner}</p>
                    </div>

                    {profile.founder_profile.industry && (
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="font-medium">{profile.founder_profile.industry}</p>
                        </div>
                      </div>
                    )}

                    {profile.founder_profile.traction && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Traction</p>
                        <p className="font-medium">{profile.founder_profile.traction}</p>
                      </div>
                    )}

                    {profile.founder_profile.preferred_city && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Preferred City</p>
                          <p className="font-medium">{profile.founder_profile.preferred_city}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isFounder && profile.investor_profile && (
                <>
                  <div className="space-y-3">
                    {profile.investor_profile.typical_check_size && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Check Size</p>
                          <p className="font-medium">{profile.investor_profile.typical_check_size}</p>
                        </div>
                      </div>
                    )}

                    {profile.investor_profile.preferred_stage && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Preferred Stage</p>
                          <p className="font-medium capitalize">{profile.investor_profile.preferred_stage}</p>
                        </div>
                      </div>
                    )}

                    {profile.investor_profile.sectors_of_interest && profile.investor_profile.sectors_of_interest.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Sectors of Interest</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.investor_profile.sectors_of_interest.map((sector) => (
                            <Badge key={sector} variant="outline">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.investor_profile.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{profile.investor_profile.location}</p>
                        </div>
                      </div>
                    )}

                    {profile.investor_profile.portfolio_link && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Portfolio</p>
                          <a 
                            href={profile.investor_profile.portfolio_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            View Portfolio
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company/Contact Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">
                {isFounder ? 'Company Information' : 'Contact'}
              </h2>

              {isFounder && profile.founder_profile && (
                <div className="space-y-3">
                  {profile.founder_profile.company_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-medium">{profile.founder_profile.company_name}</p>
                      </div>
                    </div>
                  )}

                  {profile.founder_profile.company_state && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">State of Incorporation</p>
                        <p className="font-medium">{profile.founder_profile.company_state}</p>
                      </div>
                    </div>
                  )}

                  {profile.founder_profile.company_address && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Company Address</p>
                      <p className="font-medium">{profile.founder_profile.company_address}</p>
                    </div>
                  )}

                  {profile.founder_profile.pitch_deck_url && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Pitch Deck</p>
                        <a 
                          href={profile.founder_profile.pitch_deck_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          View Pitch Deck
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isFounder && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{profile.name}</p>
                    </div>
                  </div>

                  {profile.investor_profile?.firm_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Firm</p>
                        <p className="font-medium">{profile.investor_profile.firm_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}