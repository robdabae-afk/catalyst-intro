import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, ImagePlus, Video } from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import LegalDisclaimer from "@/components/LegalDisclaimer";
const FounderOnboarding = () => {
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [pitchDeckVisibility, setPitchDeckVisibility] = useState<'public' | 'private'>('public');
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    startupName: "",
    oneLiner: "",
    stage: "" as "pre-seed" | "seed" | "series-a" | "series-b" | "",
    traction: "",
    pitchDeckUrl: "",
    preferredCity: "",
    companyState: "",
    companyAddress: "",
    fundingAmount: ""
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

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow larger file size for videos (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a video under 50MB",
        });
        return;
      }
      // Validate video file type
      if (!file.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a video file",
        });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
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

  const uploadVideo = async (userId: string): Promise<string | null> => {
    if (!videoFile) return null;

    const fileExt = videoFile.name.split('.').pop();
    const filePath = `${userId}/video.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, videoFile, { upsert: true });

    if (uploadError) {
      console.error('Video upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedIndustries.length === 0) {
      toast({
        variant: "destructive",
        title: "Industry required",
        description: "Please select at least one industry",
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
      const videoUrl = await uploadVideo(authData.user.id);

      // Create profile with legal acceptance
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_type: 'founder',
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
            referred_user_type: 'founder'
          } as any);
        }
      }

        // Create founder profile
        const { error: founderError } = await supabase
          .from('founder_profiles')
          .insert({
            profile_id: authData.user.id,
            startup_name: formData.startupName,
            company_name: formData.startupName,
            one_liner: formData.oneLiner,
            industry: selectedIndustries,
            stage: formData.stage || null,
            traction: formData.traction || null,
            pitch_deck_url: formData.pitchDeckUrl || null,
            pitch_deck_visibility: pitchDeckVisibility,
            preferred_city: formData.preferredCity || null,
            company_state: formData.companyState || null,
            company_address: formData.companyAddress || null,
            banner_url: bannerUrl,
            video_url: videoUrl,
            funding_amount: formData.fundingAmount || null
          });

      if (founderError) throw founderError;

      toast({
        title: "Success!",
        description: "Your founder profile has been created.",
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
            <CardTitle className="text-3xl">Founder Onboarding</CardTitle>
            <CardDescription>Tell us about your startup</CardDescription>
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

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative cursor-pointer group"
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
                <p className="text-sm text-muted-foreground">Click to upload profile photo</p>
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
                <Label htmlFor="startupName">Startup Name *</Label>
                <Input
                  id="startupName"
                  required
                  value={formData.startupName}
                  onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oneLiner">One-Liner *</Label>
                <Input
                  id="oneLiner"
                  required
                  placeholder="Describe your startup in one sentence"
                  value={formData.oneLiner}
                  onChange={(e) => setFormData({ ...formData, oneLiner: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Industries * (select at least one)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-4">
                  {INDUSTRIES.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2 min-w-0">
                      <Checkbox
                        id={`industry-${industry}`}
                        checked={selectedIndustries.includes(industry)}
                        onCheckedChange={() => handleIndustryToggle(industry)}
                        className="flex-shrink-0"
                      />
                      <label
                        htmlFor={`industry-${industry}`}
                        className="text-sm cursor-pointer truncate"
                        title={industry}
                      >
                        {industry}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedIndustries.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedIndustries.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={formData.stage} onValueChange={(value: any) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current stage" />
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
                <Label>Video Pitch (30-45 seconds, optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a short video introducing your startup. This will be shown to investors instead of your banner image.
                </p>
                <div 
                  className="relative cursor-pointer group w-full h-48 rounded-lg overflow-hidden bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
                  onClick={() => videoInputRef.current?.click()}
                >
                  {videoPreview ? (
                    <video src={videoPreview} className="w-full h-full object-cover" controls={false} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Video className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to upload video (max 50MB)</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingAmount">Amount Raising (optional)</Label>
                <Input
                  id="fundingAmount"
                  placeholder="e.g., 500K, 1M, 2.5M"
                  value={formData.fundingAmount}
                  onChange={(e) => setFormData({ ...formData, fundingAmount: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount you're raising (will be displayed on your video profile)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="traction">Traction</Label>
                <Textarea
                  id="traction"
                  placeholder="Revenue, users, key milestones..."
                  value={formData.traction}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setFormData({ ...formData, traction: e.target.value });
                    }
                  }}
                  maxLength={250}
                />
                <p className={`text-xs ${formData.traction.length > 200 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {formData.traction.length}/250 characters
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pitchDeckUrl">Pitch Deck URL</Label>
                  <Input
                    id="pitchDeckUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.pitchDeckUrl}
                    onChange={(e) => setFormData({ ...formData, pitchDeckUrl: e.target.value })}
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
                      <RadioGroupItem value="public" id="visibility-public" />
                      <Label htmlFor="visibility-public" className="font-normal cursor-pointer">
                        Public on Discover — visible to all investors
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="visibility-private" />
                      <Label htmlFor="visibility-private" className="font-normal cursor-pointer">
                        Private — share manually or upon request
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredCity">Preferred City for Meetings</Label>
                <Input
                  id="preferredCity"
                  placeholder="e.g., San Francisco, New York"
                  value={formData.preferredCity}
                  onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyState">Company State/Region</Label>
                <Input
                  id="companyState"
                  placeholder="e.g., Delaware, California"
                  value={formData.companyState}
                  onChange={(e) => setFormData({ ...formData, companyState: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  placeholder="Full company address"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
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

export default FounderOnboarding;
