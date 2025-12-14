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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, User, Camera, Loader2 } from "lucide-react";

const INDUSTRIES = [
  "SaaS", "AI", "Fintech", "HealthTech", "EdTech", "Consumer", 
  "Marketplace", "Robotics", "Biotech", "CleanTech", "Web3", "Other"
];

const FUNDING_STAGES = ["pre-seed", "seed", "series-a", "series-b"] as const;

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'founder' | 'investor' | null>(null);
  
  // Profile fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Founder fields
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [industry, setIndustry] = useState("");
  const [traction, setTraction] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [founderBannerUrl, setFounderBannerUrl] = useState("");
  
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
          setIndustry(founderProfile.industry || "");
          setTraction(founderProfile.traction || "");
          setPreferredCity(founderProfile.preferred_city || "");
          setCompanyName(founderProfile.company_name || "");
          setCompanyState(founderProfile.company_state || "");
          setCompanyAddress(founderProfile.company_address || "");
          setFounderBannerUrl(founderProfile.banner_url || "");
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
      // Update main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name, avatar_url: avatarUrl })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      if (userType === 'founder') {
        const { error: founderError } = await supabase
          .from('founder_profiles')
          .update({
            startup_name: startupName,
            one_liner: oneLiner,
            industry,
            traction,
            preferred_city: preferredCity,
            company_name: companyName,
            company_state: companyState,
            company_address: companyAddress,
            banner_url: founderBannerUrl
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
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  onChange={(e) => setTraction(e.target.value)}
                  placeholder="Key metrics, users, revenue, etc."
                  rows={2}
                />
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
                        <SelectItem key={stage} value={stage}>
                          {stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
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
      </main>
    </div>
  );
};

export default Settings;
