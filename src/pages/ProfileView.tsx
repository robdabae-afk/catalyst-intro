import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, TrendingUp, DollarSign, Briefcase, Globe, User, Mail, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: 'founder' | 'investor';
  founder_profile?: {
    startup_name: string;
    one_liner: string;
    industry: string[] | null;
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
    investment_thesis: string | null;
  };
}

// OG Image - CATALYST banner from public assets
const OG_IMAGE_URL = "/favicon.jpg";

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied to clipboard!",
        description: "Share this profile with others.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again.",
      });
    }
  };

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
  
  // Dynamic OG meta content
  const ogTitle = `${profile.name} on Catalyst`;
  const headline = isFounder 
    ? (profile.founder_profile?.industry?.join(", ") || "Founder")
    : (profile.investor_profile?.sectors_of_interest?.join(", ") || "Investor");
  const ogDescription = `${headline} - Join the platform where meaningful founder-investor relationships begin.`;
  const ogImageUrl = `${window.location.origin}${OG_IMAGE_URL}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Dynamic SEO/OG Tags */}
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={`${window.location.origin}/profile/${id}`} />
        <meta property="og:site_name" content="Catalyst" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      {/* Banner */}
      <div className={`relative ${bannerUrl ? 'h-24 md:h-64' : 'h-20 md:h-44'} bg-gradient-to-br from-primary/20 to-accent/20`}>
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
        
        <div className="absolute top-3 left-4 right-4 md:top-4 flex justify-between items-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareProfile}
            className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-3 md:mt-6 relative z-10 pb-6 md:pb-12">
        {/* Profile Header */}
        <Card className="mb-3 md:mb-6">
          <CardContent className="p-4 md:pt-6">
            <div className="flex flex-row gap-3 md:gap-4 items-center md:items-end">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 shrink-0 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl md:text-3xl">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              
              <div className="min-w-0 flex-1 md:pb-4">
                <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">{profile.name}</h1>
                {isFounder && profile.founder_profile && (
                  <p className="text-sm md:text-xl text-muted-foreground truncate">{profile.founder_profile.startup_name}</p>
                )}
                {!isFounder && profile.investor_profile?.firm_name && (
                  <p className="text-sm md:text-xl text-muted-foreground truncate">{profile.investor_profile.firm_name}</p>
                )}
                <Badge className="mt-2" variant="secondary">
                  {isFounder ? 'Founder' : 'Investor'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        {!isFounder ? (
          <InvestorProfileSections profile={profile} />
        ) : !profile.founder_profile ? (
          <Card>
            <CardContent className="pt-6 text-center py-10">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Profile not yet completed</h2>
              <p className="text-sm text-muted-foreground">This founder hasn't filled out their startup details yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3 md:gap-6">
            {/* Main Info Card */}
            <Card>
              <CardContent className="p-4 md:pt-6 space-y-3 md:space-y-4">
                <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4">Startup Details</h2>
                <div className="space-y-3">
                  <div className="p-3 md:p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">One-liner</p>
                    <p className="font-medium">{profile.founder_profile.one_liner}</p>
                  </div>
                  {profile.founder_profile.industry && profile.founder_profile.industry.length > 0 && (
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-medium">{profile.founder_profile.industry.join(", ")}</p>
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
               </CardContent>
             </Card>

             {/* Company Card */}
             <Card>
               <CardContent className="p-4 md:pt-6 space-y-3 md:space-y-4">
                 <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4">Company Information</h2>
                 {profile.founder_profile && (
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
               </CardContent>
             </Card>
           </div>
         )}
       </div>
     </div>
   );
 }

/* -------------------- INVESTOR PROFILE SECTIONS -------------------- */
function InvestorProfileSections({ profile }: { profile: ProfileData }) {
  const inv = profile.investor_profile;
  if (!inv) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-10">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Profile not yet completed</h2>
          <p className="text-sm text-muted-foreground">This investor hasn't filled out their profile details yet.</p>
        </CardContent>
      </Card>
    );
  }
  const sectors = inv.sectors_of_interest ?? [];
  const hasFocus = inv.typical_check_size || inv.preferred_stage || sectors.length > 0 || inv.location;

  return (
    <div className="space-y-4">
      {/* Thesis */}
      {inv.investment_thesis && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Investment Thesis</h2>
            <p className="text-base leading-relaxed italic text-foreground/90">"{inv.investment_thesis}"</p>
          </CardContent>
        </Card>
      )}

      {/* Focus chips */}
      {hasFocus && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Investment Focus</h2>
            <div className="grid grid-cols-2 gap-3">
              {inv.typical_check_size && (
                <FocusChip icon={<DollarSign className="w-4 h-4" />} label="Check size" value={inv.typical_check_size} />
              )}
              {inv.preferred_stage && (
                <FocusChip icon={<Briefcase className="w-4 h-4" />} label="Preferred stage" value={String(inv.preferred_stage)} />
              )}
              {inv.location && (
                <FocusChip icon={<MapPin className="w-4 h-4" />} label="Geography" value={inv.location} />
              )}
            </div>
            {sectors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sectors of interest</p>
                <div className="flex flex-wrap gap-2">
                  {sectors.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Track record */}
      {(inv.portfolio_link || inv.firm_name) && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Track Record</h2>
            {inv.firm_name && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Firm</p>
                  <p className="font-medium">{inv.firm_name}</p>
                </div>
              </div>
            )}
            {inv.portfolio_link && (
              <a
                href={inv.portfolio_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="w-4 h-4" /> View portfolio
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FocusChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
