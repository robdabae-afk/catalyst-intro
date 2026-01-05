import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import robAndStephen from "@/assets/rob-and-stephen.jpg";

import { MapPin, TrendingUp, CheckCircle2 } from "lucide-react";
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

  // Hardcoded Catalyst Profile
  const catalystProfile: ProfileData = {
    id: 'catalyst-intro',
    name: 'Rob and Stephen',
    email: 'stephenmonster88@gmail.com',
    avatar_url: robAndStephen,
    user_type: 'founder',
    founder_profile: {
      startup_name: 'Catalyst Intro',
      one_liner: 'Tinder for Founders and Investors',
      stage: 'Pre Seed',
      industry: ['FinTech', 'B2B SaaS'],
      traction: '-Helping 65+ users\n-Launched "Pro" our initial monetization feature\n-Over 10 investor X founder matches per week',
      preferred_city: 'New York',
      pitch_deck_url: '#',
      company_name: 'Catalyst Intro',
      company_state: 'NY',
      banner_url: heroBg,
    }
  };

  useEffect(() => {
    setProfile(catalystProfile);
    setLoading(false);
  }, []);

  if (loading || !profile || !profile.founder_profile) {
    return null;
  }

  const founderProfile = profile.founder_profile;
  const imageUrl = founderProfile.banner_url || profile.avatar_url || '';
  const title = `${profile.name}${founderProfile.startup_name ? ` - ${founderProfile.startup_name}` : ''}`;
  const description = founderProfile.one_liner || 'Connect with founders and investors on Catalyst';

  return (
    <>
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

      <div className="w-full max-w-md mx-auto">
        {/* Modern Profile Card */}
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800">
          {/* Header Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-black uppercase tracking-wide">{founderProfile.stage?.replace(' ', '-')}</span>
              </div>
              {founderProfile.preferred_city && (
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1">
                  <MapPin size={12} className="text-white" />
                  <span className="text-xs font-medium text-white uppercase">{founderProfile.preferred_city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Section */}
          <div className="relative h-80 bg-gradient-to-br from-zinc-800 to-zinc-900">
            <img
              src={profile.avatar_url || ''}
              alt={profile.name}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>

          {/* Content Section */}
          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Name & Title */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{profile.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-400">⚡</span>
                <span className="text-sm font-medium text-gray-300">Founder @ {founderProfile.startup_name}</span>
              </div>
            </div>

            {/* Industry Tags */}
            <div className="flex flex-wrap gap-2">
              {founderProfile.industry?.map((ind: string) => (
                <div key={ind} className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-medium text-white uppercase tracking-wide">{ind}</span>
                </div>
              ))}
            </div>

            {/* One-liner */}
            {founderProfile.one_liner && (
              <p className="text-sm text-gray-300 leading-relaxed">
                {founderProfile.one_liner}
              </p>
            )}

            {/* Stats Section */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">$50k+</span>
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Raised</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <div className="bg-amber-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                      PRIORITY
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide mt-1 block">Featured</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <p className="text-2xl font-semibold text-center text-white mt-8">
          Swipe on profiles like us.
        </p>
      </div>
    </>
  );
};

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
                <Badge variant="secondary" className="mt-1 capitalize text-black bg-white">Founder</Badge>
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
                <Badge variant="outline" className="text-xs text-black bg-white">
                  {founderProfile.stage.replace('-', ' ')}
                </Badge>
              )}
              {founderProfile.industry?.map((ind: string) => (
                <Badge key={ind} variant="secondary" className="text-xs text-black bg-white">
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
