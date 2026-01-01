import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, User, Camera, Loader2, MessageCircle, SlidersHorizontal, Gift, AlertTriangle } from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import { SupportChat } from "@/components/SupportChat";
import { SubscriptionSettings } from "@/components/SubscriptionSettings";
import { SpotlightManager } from "@/components/SpotlightManager";
import { AdminRevenueAdjustment } from "@/components/AdminRevenueAdjustment";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'founder' | 'investor' | null>(null);
  
  // Profile fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Founder fields
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [traction, setTraction] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [founderBannerUrl, setFounderBannerUrl] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [pitchDeckVisibility, setPitchDeckVisibility] = useState<'public' | 'private'>('public');
  const [videoUrl, setVideoUrl] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  
  // Investor fields
  const [firmName, setFirmName] = useState("");
  const [typicalCheckSize, setTypicalCheckSize] = useState("");
  const [preferredStage, setPreferredStage] = useState("");
  const [sectorsOfInterest, setSectorsOfInterest] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [investorBannerUrl, setInvestorBannerUrl] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      
      setUserId(user.id);
      
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profile) {
        navigate('/');
        return;
      }
      
      setUserType(profile.user_type);
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
      
      if (profile.user_type === 'founder') {
        const { data: founderProfile } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (founderProfile) {
          setStartupName(founderProfile.startup_name || "");
          setOneLiner(founderProfile.one_liner || "");
          setSelectedIndustries(founderProfile.industry || []);
          setTraction(founderProfile.traction || "");
          setPreferredCity(founderProfile.preferred_city || "");
          setCompanyName(founderProfile.company_name || "");
          setCompanyState(founderProfile.company_state || "");
          setCompanyAddress(founderProfile.company_address || "");
          setFounderBannerUrl(founderProfile.banner_url || "");
          setPitchDeckUrl(founderProfile.pitch_deck_url || "");
          setPitchDeckVisibility((founderProfile.pitch_deck_visibility as 'public' | 'private') || 'public');
          setVideoUrl(founderProfile.video_url || "");
          setFundingAmount(founderProfile.funding_amount || "");
        }
      } else {
        const { data: investorProfile } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (investorProfile) {
          setFirmName(investorProfile.firm_name || "");
          setTypicalCheckSize(investorProfile.typical_check_size || "");
          setPreferredStage(investorProfile.preferred_stage || "");
          setSectorsOfInterest(investorProfile.sectors_of_interest || []);
          setLocation(investorProfile.location || "");
          setPortfolioLink(investorProfile.portfolio_link || "");
          setInvestorBannerUrl(investorProfile.banner_url || "");
        }
      }
      
      setLoading(false);
    };
    
    loadUserData();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
      toast({ title: "Avatar uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/banner.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (userType === 'founder') {
        setFounderBannerUrl(publicUrl);
      } else {
        setInvestorBannerUrl(publicUrl);
      }
      toast({ title: "Banner uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      // Update main profile with update tracking
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name, 
          avatar_url: avatarUrl,
          has_pending_update: true,
          last_profile_update_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      if (userType === 'founder') {
        const { error: founderError } = await supabase
          .from('founder_profiles')
          .update({
            startup_name: startupName,
            one_liner: oneLiner,
            industry: selectedIndustries,
            traction,
            preferred_city: preferredCity,
            company_name: companyName,
            company_state: companyState,
            company_address: companyAddress,
            banner_url: founderBannerUrl,
            pitch_deck_url: pitchDeckUrl,
            pitch_deck_visibility: pitchDeckVisibility,
            video_url: videoUrl || null,
            funding_amount: fundingAmount || null
          })
          .eq('profile_id', userId);
        
        if (founderError) throw founderError;
      } else {
        const { error: investorError } = await supabase
          .from('investor_profiles')
          .update({
            firm_name: firmName,
            typical_check_size: typicalCheckSize,
            preferred_stage: preferredStage as any,
            sectors_of_interest: sectorsOfInterest,
            location,
            portfolio_link: portfolioLink,
            banner_url: investorBannerUrl
          })
          .eq('profile_id', userId);
        
        if (investorError) throw investorError;
      }
      
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleSector = (sector: string) => {
    setSectorsOfInterest(prev => 
      prev.includes(sector) 
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const bannerUrl = userType === 'founder' ? founderBannerUrl : investorBannerUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Banner & Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photos</CardTitle>
            <CardDescription>Update your avatar and banner image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner Image (Optional)</Label>
              <div 
                className="relative h-40 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden cursor-pointer group"
                onClick={() => document.getElementById('banner-upload')?.click()}
              >
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingBanner ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <input 
                id="banner-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleBannerUpload}
              />
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Avatar className="w-24 h-24 border-4 border-border">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <Upload className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Click to upload a new profile photo
                </div>
              </div>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discovery Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Discovery Filters
            </CardTitle>
            <CardDescription>Set preferences for the profiles you want to see</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate('/filters')}
              className="w-full sm:w-auto"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Manage Filters
            </Button>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Founder-specific fields */}
        {userType === 'founder' && (
          <Card>
            <CardHeader>
              <CardTitle>Startup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startupName">Startup Name</Label>
                  <Input 
                    id="startupName" 
                    value={startupName} 
                    onChange={(e) => setStartupName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industries</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {INDUSTRIES.map((ind) => (
                      <div key={ind} className="flex items-center space-x-2">
                        <Checkbox
                          id={`settings-industry-${ind}`}
                          checked={selectedIndustries.includes(ind)}
                          onCheckedChange={() => {
                            setSelectedIndustries(prev =>
                              prev.includes(ind)
                                ? prev.filter(i => i !== ind)
                                : [...prev, ind]
                            );
                          }}
                        />
                        <label htmlFor={`settings-industry-${ind}`} className="text-sm cursor-pointer">
                          {ind}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oneLiner">One-Liner</Label>
                <Textarea 
                  id="oneLiner" 
                  value={oneLiner} 
                  onChange={(e) => setOneLiner(e.target.value)}
                  placeholder="A brief description of your startup"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="traction">Traction</Label>
                <Textarea 
                  id="traction" 
                  value={traction} 
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setTraction(e.target.value);
                    }
                  }}
                  placeholder="Key metrics, users, revenue, etc."
                  rows={2}
                  maxLength={250}
                  className={traction.length > 250 ? "border-destructive" : ""}
                />
                <p className={`text-xs ${traction.length > 250 ? "text-destructive" : traction.length > 200 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {traction.length}/250 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredCity">Preferred City</Label>
                <Input 
                  id="preferredCity" 
                  value={preferredCity} 
                  onChange={(e) => setPreferredCity(e.target.value)} 
                  placeholder="City for meetings"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Legal Company Name</Label>
                  <Input 
                    id="companyName" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyState">State of Incorporation</Label>
                  <Input 
                    id="companyState" 
                    value={companyState} 
                    onChange={(e) => setCompanyState(e.target.value)} 
                    placeholder="e.g., Delaware"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input 
                  id="companyAddress" 
                  value={companyAddress} 
                  onChange={(e) => setCompanyAddress(e.target.value)} 
                />
              </div>
              
              {/* Pitch Deck Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="pitchDeckUrl">Pitch Deck URL</Label>
                  <Input 
                    id="pitchDeckUrl" 
                    type="url"
                    value={pitchDeckUrl} 
                    onChange={(e) => setPitchDeckUrl(e.target.value)} 
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Who can see your pitch deck?</Label>
                  <RadioGroup 
                    value={pitchDeckVisibility} 
                    onValueChange={(value: 'public' | 'private') => setPitchDeckVisibility(value)}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="settings-visibility-public" />
                      <Label htmlFor="settings-visibility-public" className="font-normal cursor-pointer">
                        Public on Discover — visible to all investors
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="settings-visibility-private" />
                      <Label htmlFor="settings-visibility-private" className="font-normal cursor-pointer">
                        Private — share manually or upon request
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Video Profile Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Video Profile (Optional)</h3>
                <p className="text-sm text-muted-foreground">Add a video to make your profile stand out. This will replace the banner image on your swipe card.</p>
                
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input 
                    id="videoUrl" 
                    type="url"
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)} 
                    placeholder="https://... (mp4, webm, or hosted video link)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingAmount">Funding Amount Sought</Label>
                  <Input 
                    id="fundingAmount" 
                    value={fundingAmount} 
                    onChange={(e) => setFundingAmount(e.target.value)} 
                    placeholder="e.g., 500K, 1M, 2.5M"
                  />
                  <p className="text-xs text-muted-foreground">This will be displayed on your video profile card</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investor-specific fields */}
        {userType === 'investor' && (
          <Card>
            <CardHeader>
              <CardTitle>Investor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firm Name (Optional)</Label>
                  <Input 
                    id="firmName" 
                    value={firmName} 
                    onChange={(e) => setFirmName(e.target.value)} 
                    placeholder="Leave blank if angel investor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typicalCheckSize">Typical Check Size</Label>
                  <Input 
                    id="typicalCheckSize" 
                    value={typicalCheckSize} 
                    onChange={(e) => setTypicalCheckSize(e.target.value)} 
                    placeholder="e.g., $25K - $100K"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredStage">Preferred Stage</Label>
                  <Select value={preferredStage} onValueChange={setPreferredStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNDING_STAGES.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="City, Country"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sectors of Interest</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(sector => (
                    <Button
                      key={sector}
                      type="button"
                      variant={sectorsOfInterest.includes(sector) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSector(sector)}
                    >
                      {sector}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioLink">Portfolio Link (Optional)</Label>
                <Input 
                  id="portfolioLink" 
                  value={portfolioLink} 
                  onChange={(e) => setPortfolioLink(e.target.value)} 
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Settings */}
        {userId && userType && (
          <SubscriptionSettings userId={userId} userType={userType} />
        )}

        {/* Spotlight Manager (Pro users only) */}
        {userId && userType && (
          <SpotlightManager userId={userId} userType={userType} />
        )}

        {/* Referral Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Refer & Earn
            </CardTitle>
            <CardDescription>Invite friends and unlock rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate('/referrals')}
              className="w-full sm:w-auto"
            >
              <Gift className="w-4 h-4 mr-2" />
              View Referral Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Platform Disclaimer */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>This platform does not handle or facilitate the exchange of funds or securities.</strong> All financial transactions, SAFE agreements, and investment transfers must be conducted off-platform through proper legal and financial channels. This platform is for networking, tracking, and template generation purposes only.
            </p>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Help & Support
            </CardTitle>
            <CardDescription>Get help from our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setSupportChatOpen(true)}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

        {/* Support Chat Dialog */}
        {userId && (
          <SupportChat 
            open={supportChatOpen} 
            onOpenChange={setSupportChatOpen} 
            userId={userId} 
          />
        )}

        {/* Hidden Admin Revenue Adjustment - Triple click to reveal */}
        {isAdmin && userId && <AdminRevenueAdjustment userId={userId} />}
      </main>
    </div>
  );
};

export default Settings;
