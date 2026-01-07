import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
import robAndStephen from "@/assets/rob-and-stephen.jpg";

import { MapPin, TrendingUp } from "lucide-react";
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
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800 h-[600px]">
          {/* Background Image - Full Card */}
          <img
            src={profile.avatar_url || ''}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />

          {/* Gradient Overlays for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

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

          {/* Content Section - Positioned at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 space-y-4 z-10">
            {/* Name & Title */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{profile.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-400">⚡</span>
                <span className="text-sm font-medium text-gray-100">Founder @ {founderProfile.startup_name}</span>
              </div>
            </div>

            {/* Industry Tags */}
            <div className="flex flex-wrap gap-2">
              {founderProfile.industry?.map((ind: string) => (
                <div key={ind} className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-medium text-white uppercase tracking-wide">{ind}</span>
                </div>
              ))}
            </div>

            {/* One-liner */}
            {founderProfile.one_liner && (
              <p className="text-sm text-gray-100 leading-relaxed">
                {founderProfile.one_liner}
              </p>
            )}

            {/* Stats Section */}
            <div className="pt-2 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">$50k+</span>
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                  <span className="text-xs text-gray-300 uppercase tracking-wide">Raised</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <div className="bg-amber-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                      PRIORITY
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 uppercase tracking-wide mt-1 block">Featured</span>
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
