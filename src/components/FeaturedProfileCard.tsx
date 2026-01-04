import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import robAndStephen from "@/assets/rob-and-stephen.jpg";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

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

  // Hardcoded Catalyst Profile to ensure instant loading and fix disappearance bug
  const catalystProfile: ProfileData = {
    id: 'catalyst-intro',
    name: 'Rob and Stephen',
    email: 'stephenmonster88@gmail.com',
    avatar_url: robAndStephen,
    user_type: 'founder',
    founder_profile: {
      startup_name: 'Catalyst Intro',
      one_liner: 'Tinder for Founders and Investors',
      stage: 'Pre-Seed',
      industry: ['FinTech', 'B2B SaaS'], // Inferred from "Tinder for..." and context
      traction: '-Helping 65+ users\n-Launched "Pro" our initial monetization feature\n-Over 10 investor X founder matches per week',
      preferred_city: 'New York',
      pitch_deck_url: '#', // Placeholder or keep generic if not known
      company_name: 'Catalyst Intro',
      company_state: 'NY',
      banner_url: heroBg,
    }
  };

  useEffect(() => {
    // Instant load with hardcoded data
    setProfile(catalystProfile);
    setLoading(false);
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

  // Get image URL for meta tags (prefer banner, fallback to avatar)
  const imageUrl = founderProfile.banner_url || profile.avatar_url || '';
  const title = `${profile.name}${founderProfile.startup_name ? ` - ${founderProfile.startup_name}` : ''}`;
  const description = founderProfile.one_liner || 'Connect with founders and investors on Catalyst';

  return (
    <>
      {/* Dynamic meta tags for link previews */}
      <Helmet>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        {imageUrl && <meta property="og:image:width" content="1200" />}
        {imageUrl && <meta property="og:image:height" content="630" />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Helmet>

      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Profile Card */}
        <Card className="overflow-hidden border-border/50 bg-card shadow-lg">
          {/* Header Removed as requested */}

          {/* Banner */}
          {founderProfile.banner_url && (
            <div className="relative h-24 bg-gradient-to-br from-primary/20 to-accent/20">
              <img
                src={founderProfile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent" />
            </div>
          )}

          {/* Profile Header Section */}
          <CardHeader className="pb-2 pt-4 px-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-background">
                <AvatarImage
                  src={profile.avatar_url || ''}
                  alt={profile.name}
                  className="object-cover scale-150"
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {profile.name?.charAt(0) || 'R'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl truncate">{profile.name}</CardTitle>
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
    </>
  );
};
