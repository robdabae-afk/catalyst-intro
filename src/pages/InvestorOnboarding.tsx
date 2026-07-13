import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, ImagePlus } from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const InvestorOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    firmName: "",
    position: "",
    investmentThesis: "",
    checkSize: "",
    preferredStage: "" as "pre-seed" | "seed" | "series-a" | "series-b" | "",
    location: "",
    portfolioLink: ""
  });

  // Validate referral code when it changes
  useEffect(() => {
    const validateReferralCode = async () => {
      if (!referralCode || referralCode.length < 4) {
        setReferralValid(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle();

      setReferralValid(!!data);
    };

    const timeout = setTimeout(validateReferralCode, 500);
    return () => clearTimeout(timeout);
  }, [referralCode]);

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        });
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadBanner = async (userId: string): Promise<string | null> => {
    if (!bannerFile) return null;

    const fileExt = bannerFile.name.split('.').pop();
    const filePath = `${userId}/banner.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, bannerFile, { upsert: true });

    if (uploadError) {
      console.error('Banner upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require profile photo
    if (!avatarFile) {
      toast({
        variant: "destructive",
        title: "Profile photo required",
        description: "Please upload a profile photo to continue",
      });
      return;
    }

    if (selectedSectors.length === 0) {
      toast({
        variant: "destructive",
        title: "Sectors required",
        description: "Please select at least one sector of interest",
      });
      return;
    }

    if (!legalAgreed) {
      toast({
        variant: "destructive",
        title: "Agreement required",
        description: "Please agree to the Legal Disclaimer and Terms of Use",
      });
      return;
    }

    setLoading(true);

    // Get user's IP address
    let userIp = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      userIp = ipData.ip;
    } catch (error) {
      console.error('Could not fetch IP:', error);
    }

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: formData.name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Upload avatar and banner if selected
      const avatarUrl = await uploadAvatar(authData.user.id);
      const bannerUrl = await uploadBanner(authData.user.id);

      // Create profile with legal acceptance
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_type: 'investor',
          name: formData.name,
          email: formData.email,
          avatar_url: avatarUrl,
          referred_by: referralValid ? (await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode.toUpperCase())
            .single()).data?.id : null,
          legal_accepted_at: new Date().toISOString(),
          legal_accepted_ip: userIp
        } as any);

      if (profileError) throw profileError;

      // If referred by someone, create the referral record
      if (referralValid && referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .single();

        if (referrer) {
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_user_id: authData.user.id,
            referral_code: referralCode.toUpperCase(),
            status: 'pending',
            referred_user_type: 'investor'
          } as any);
        }
      }

      // Create investor profile
      const { error: investorError } = await supabase
        .from('investor_profiles')
        .insert({
          profile_id: authData.user.id,
          firm_name: formData.firmName || null,
          position: formData.position || null,
          investment_thesis: formData.investmentThesis || null,
          typical_check_size: formData.checkSize || null,
          preferred_stage: formData.preferredStage || null,
          sectors_of_interest: selectedSectors,
          location: formData.location || null,
          portfolio_link: formData.portfolioLink || null,
          banner_url: bannerUrl
        });

      if (investorError) throw investorError;

      toast({
        title: "Success!",
        description: "Your investor profile has been created.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create profile",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Investor Onboarding</CardTitle>
            <CardDescription>Tell us about your investment focus</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-2">
                <Label>Banner Photo (optional)</Label>
                <div
                  className="relative cursor-pointer group w-full h-32 rounded-lg overflow-hidden bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImagePlus className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to upload banner</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </div>

              {/* Avatar Upload - REQUIRED */}
              <div className="space-y-2">
                <Label>Profile Photo *</Label>
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`relative cursor-pointer group ${!avatarPreview ? 'ring-2 ring-destructive/50 ring-offset-2 ring-offset-background rounded-full' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-10 h-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className={`text-sm ${avatarPreview ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {avatarPreview ? 'Click to change profile photo' : 'Profile photo is required'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (optional)</Label>
                <div className="relative">
                  <Input
                    id="referralCode"
                    placeholder="Enter referral code if you have one"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className={referralValid === true ? 'border-green-500 pr-10' : referralValid === false ? 'border-red-500 pr-10' : ''}
                  />
                  {referralValid === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓ Valid</span>
                  )}
                  {referralValid === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">Invalid</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">You'll earn bonus swipes when your referrer's invite is approved</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                  id="firmName"
                  placeholder="Optional"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentThesis">Investment Thesis One-Liner</Label>
                <Input
                  id="investmentThesis"
                  placeholder="e.g., Backing technical founders solving climate challenges"
                  value={formData.investmentThesis}
                  onChange={(e) => setFormData({ ...formData, investmentThesis: e.target.value })}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Briefly describe what you look for in investments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkSize">Typical Check Size</Label>
                <Input
                  id="checkSize"
                  placeholder="e.g., $25K-$100K"
                  value={formData.checkSize}
                  onChange={(e) => setFormData({ ...formData, checkSize: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredStage">Preferred Stage</Label>
                <Select value={formData.preferredStage} onValueChange={(value: any) => setFormData({ ...formData, preferredStage: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDING_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sectors of Interest * (select at least one)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-4">
                  {INDUSTRIES.map((sector) => (
                    <div key={sector} className="flex items-center space-x-2 min-w-0">
                      <Checkbox
                        id={`sector-${sector}`}
                        checked={selectedSectors.includes(sector)}
                        onCheckedChange={() => handleSectorToggle(sector)}
                        className="flex-shrink-0"
                      />
                      <label
                        htmlFor={`sector-${sector}`}
                        className="text-sm cursor-pointer truncate"
                        title={sector}
                      >
                        {sector}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedSectors.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedSectors.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, Remote"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioLink">Portfolio Link</Label>
                <Input
                  id="portfolioLink"
                  type="url"
                  placeholder="https://..."
                  value={formData.portfolioLink}
                  onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                />
              </div>

              <LegalDisclaimer agreed={legalAgreed} onAgreeChange={setLegalAgreed} />

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !legalAgreed} className="flex-1">
                  {loading ? "Creating..." : "Create Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorOnboarding;
