import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Briefcase, DollarSign, FileText, Link as LinkIcon, TrendingUp } from "lucide-react";

interface AdminProfilePreviewProps {
  userId: string;
  userType: 'founder' | 'investor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: string;
}

interface FounderProfile {
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
}

interface InvestorProfile {
  firm_name: string | null;
  typical_check_size: string | null;
  preferred_stage: string | null;
  sectors_of_interest: string[] | null;
  location: string | null;
  portfolio_link: string | null;
  investment_thesis: string | null;
  banner_url: string | null;
}

export function AdminProfilePreview({ userId, userType, open, onOpenChange }: AdminProfilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Load base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, user_type')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load type-specific profile
      if (userType === 'founder') {
        const { data: founderData, error: founderError } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (!founderError && founderData) {
          setFounderProfile(founderData);
        }
      } else {
        const { data: investorData, error: investorError } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('profile_id', userId)
          .single();

        if (!investorError && investorData) {
          setInvestorProfile(investorData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Preview</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Banner */}
            {(founderProfile?.banner_url || investorProfile?.banner_url) && (
              <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                <img
                  src={founderProfile?.banner_url || investorProfile?.banner_url || ''}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="capitalize mt-1">
                  {profile.user_type}
                </Badge>
              </div>
            </div>

            {/* Founder Profile Details */}
            {userType === 'founder' && founderProfile && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{founderProfile.startup_name}</span>
                    {founderProfile.company_name && (
                      <span className="text-muted-foreground">({founderProfile.company_name})</span>
                    )}
                  </div>

                  {founderProfile.one_liner && (
                    <p className="text-foreground">{founderProfile.one_liner}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {founderProfile.stage && (
                      <Badge variant="outline" className="capitalize">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {founderProfile.stage}
                      </Badge>
                    )}
                    {founderProfile.preferred_city && (
                      <Badge variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {founderProfile.preferred_city}
                      </Badge>
                    )}
                    {founderProfile.company_state && (
                      <Badge variant="outline">
                        {founderProfile.company_state}
                      </Badge>
                    )}
                  </div>

                  {founderProfile.industry && founderProfile.industry.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Industries:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {founderProfile.industry.map((ind, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {founderProfile.traction && (
                    <div>
                      <span className="text-sm text-muted-foreground">Traction:</span>
                      <p className="mt-1">{founderProfile.traction}</p>
                    </div>
                  )}

                  {founderProfile.pitch_deck_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={founderProfile.pitch_deck_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Pitch Deck
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Investor Profile Details */}
            {userType === 'investor' && investorProfile && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {investorProfile.firm_name && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{investorProfile.firm_name}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {investorProfile.typical_check_size && (
                      <Badge variant="outline">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {investorProfile.typical_check_size}
                      </Badge>
                    )}
                    {investorProfile.preferred_stage && (
                      <Badge variant="outline" className="capitalize">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {investorProfile.preferred_stage}
                      </Badge>
                    )}
                    {investorProfile.location && (
                      <Badge variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {investorProfile.location}
                      </Badge>
                    )}
                  </div>

                  {investorProfile.sectors_of_interest && investorProfile.sectors_of_interest.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Sectors of Interest:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {investorProfile.sectors_of_interest.map((sector, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {investorProfile.investment_thesis && (
                    <div>
                      <span className="text-sm text-muted-foreground">Investment Thesis:</span>
                      <p className="mt-1">{investorProfile.investment_thesis}</p>
                    </div>
                  )}

                  {investorProfile.portfolio_link && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={investorProfile.portfolio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Portfolio
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No profile data message */}
            {userType === 'founder' && !founderProfile && (
              <p className="text-muted-foreground text-center py-4">
                No founder profile data available yet.
              </p>
            )}
            {userType === 'investor' && !investorProfile && (
              <p className="text-muted-foreground text-center py-4">
                No investor profile data available yet.
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Could not load profile data.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
