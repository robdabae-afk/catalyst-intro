import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: string;
  founder_profile?: {
    startup_name: string;
    one_liner: string;
    stage: string | null;
    industry: string[] | null;
    traction: string | null;
    preferred_city: string | null;
    pitch_deck_url: string | null;
    company_name: string | null;
    company_state: string | null;
    banner_url: string | null;
  };
}

export const FeaturedProfileCard = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Try searching by email first
        let profileData = null;
        
        const { data: emailData, error: emailError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url, user_type')
          .ilike('email', '%stephenmonster88@gmail.com%')
          .eq('is_hidden', false)
          .maybeSingle();

        if (!emailError && emailData) {
          profileData = emailData;
        } else {
          // Fallback: try searching by name
          const { data: nameData, error: nameError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, user_type')
            .or('name.ilike.%Rob and Stephen%,name.ilike.%Rob%Stephen%')
            .eq('is_hidden', false)
            .maybeSingle();
          
          if (!nameError && nameData) {
            profileData = nameData;
          }
        }

        if (!profileData) {
          setLoading(false);
          return;
        }

        // Fetch founder profile data using public view (accessible to all)
        const { data: founderData, error: founderError } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('profile_id', profileData.id)
          .maybeSingle();

        if (founderError) {
          console.error('Error fetching founder profile:', founderError);
          setLoading(false);
          return;
        }

        setProfile({
          ...profileData,
          founder_profile: founderData || undefined,
        });
      } catch (error) {
        console.error('Error fetching featured profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="overflow-hidden border-border/50 bg-card shadow-lg">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile || !profile.founder_profile) {
    return null;
  }

  const founderProfile = profile.founder_profile;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Profile Card */}
      <Card className="overflow-hidden border-border/50 bg-card shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 px-6 py-4">
          <h2 className="text-2xl font-bold text-foreground">Connect.</h2>
        </div>

        {/* Banner */}
        {founderProfile.banner_url && (
          <div className="relative h-24 bg-gradient-to-br from-primary/20 to-accent/20">
            <img 
              src={founderProfile.banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        {/* Profile Header Section */}
        <CardHeader className="pb-2 pt-4 px-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-background">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {profile.name?.charAt(0) || 'R'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{profile.name}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">Founder</Badge>
            </div>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="space-y-3 pt-2 px-6 pb-6">
          {/* Startup Name */}
          {founderProfile.startup_name && (
            <div>
              <h3 className="text-lg font-semibold text-foreground">{founderProfile.startup_name}</h3>
            </div>
          )}

          {/* One-liner */}
          {founderProfile.one_liner && (
            <p className="text-sm leading-snug text-foreground">
              {founderProfile.one_liner}
            </p>
          )}

          {/* Stage & Industry */}
          <div className="flex flex-wrap items-center gap-1">
            {founderProfile.stage && (
              <Badge variant="outline" className="text-xs">
                {founderProfile.stage.replace('-', ' ')}
              </Badge>
            )}
            {founderProfile.industry?.map((ind: string) => (
              <Badge key={ind} variant="secondary" className="text-xs">
                {ind}
              </Badge>
            ))}
          </div>

          {/* Location */}
          {founderProfile.preferred_city && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{founderProfile.preferred_city}</span>
            </div>
          )}

          {/* Traction */}
          {founderProfile.traction && (
            <div className="bg-muted/50 rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs font-medium text-muted-foreground">Traction</p>
              </div>
              <div className="text-xs text-foreground whitespace-pre-line">
                {founderProfile.traction}
              </div>
            </div>
          )}

          {/* View Pitch Deck Button */}
          {founderProfile.pitch_deck_url && (
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => window.open(founderProfile.pitch_deck_url || '', '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Pitch Deck
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Call to Action Text */}
      <p className="text-2xl font-semibold text-center text-white">
        Swipe on profiles like us.
      </p>
    </div>
  );
};
