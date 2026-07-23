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
import { ArrowLeft, Upload, User, Camera, Loader2, MessageCircle, SlidersHorizontal, Gift, AlertTriangle, Video, Coins, RotateCcw, Share2, LogOut } from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";
import { SupportChat } from "@/components/SupportChat";
import { SubscriptionSettings } from "@/components/SubscriptionSettings";
import { SpotlightManager } from "@/components/SpotlightManager";
import { AdminRevenueAdjustment } from "@/components/AdminRevenueAdjustment";
import { TokenBalance } from "@/components/TokenBalance";
import { TokenPurchaseDialog } from "@/components/TokenPurchaseDialog";
import { useTokens } from "@/hooks/useTokens";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isAdmin } = useIsAdmin();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resettingHistory, setResettingHistory] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [supportChatOpen, setSupportChatOpen] = useState(false);

    const [userId, setUserId] = useState<string | null>(null);
    const [userType, setUserType] = useState<'founder' | 'investor' | null>(null);
    
    // Swipe history hook
    const { resetSwipeHistory } = useSwipeHistory(userId || undefined);

    const handleResetSwipeHistory = async () => {
        setResettingHistory(true);
        const success = await resetSwipeHistory();
        setResettingHistory(false);
        if (success) {
            toast({ title: "Swipe history reset", description: "You can now see all profiles again." });
        } else {
            toast({ variant: "destructive", title: "Failed to reset", description: "Please try again." });
        }
    };

    // Profile fields
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");

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
    const [mrr, setMrr] = useState("");
    const [backedBy, setBackedBy] = useState("");
    const [einNumber, setEinNumber] = useState("");
    const [location, setLocation] = useState("");

    // Investor fields
    const [firmName, setFirmName] = useState("");
    const [position, setPosition] = useState("");
    const [investorBannerUrl, setInvestorBannerUrl] = useState("");
    const [investorType, setInvestorType] = useState("");
    const [accreditationStatus, setAccreditationStatus] = useState("");
    const [investmentCount, setInvestmentCount] = useState("");
    const [notablePortfolio, setNotablePortfolio] = useState("");

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
            setLinkedinUrl(profile.linkedin_url || "");

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
                    setMrr(founderProfile.mrr || "");
                    setBackedBy(founderProfile.backed_by || "");
                    setEinNumber(founderProfile.ein_number || "");
                    setLocation(founderProfile.location || "");
                }
            } else {
                const { data: investorProfile } = await supabase
                    .from('investor_profiles')
                    .select('*')
                    .eq('profile_id', user.id)
                    .maybeSingle();

                if (investorProfile) {
                    setFirmName(investorProfile.firm_name || "");
                    setPosition(investorProfile.position || "");
                    setInvestorBannerUrl(investorProfile.banner_url || "");
                    setInvestorType(investorProfile.investor_type || "");
                    setAccreditationStatus(investorProfile.accreditation_status || "");
                    setInvestmentCount(investorProfile.investment_count?.toString() || "");
                    setNotablePortfolio(investorProfile.notable_portfolio || "");
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

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        // Validate file size (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please select a video under 100MB"
            });
            return;
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please select an MP4, WebM, or MOV video"
            });
            return;
        }

        setUploadingVideo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/pitch-video.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(filePath);

            setVideoUrl(publicUrl);
            toast({ title: "Video uploaded successfully" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload failed", description: error.message });
        } finally {
            setUploadingVideo(false);
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
                    linkedin_url: linkedinUrl,
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

                        funding_amount: fundingAmount || null,
                        mrr: mrr || null,
                        backed_by: backedBy || null,
                        ein_number: einNumber || null,
                        location: location || null
                    })
                    .eq('profile_id', userId);

                if (founderError) throw founderError;
            } else {
                const { error: investorError } = await supabase
                    .from('investor_profiles')
                    .update({
                        firm_name: firmName,
                        position: position,
                        banner_url: investorBannerUrl,
                        investor_type: investorType || null,
                        accreditation_status: accreditationStatus || null,
                        investment_count: investmentCount ? parseInt(investmentCount) : null,
                        notable_portfolio: notablePortfolio || null
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
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                navigate('/');
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* Share Profile Section - Top of Settings */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative">
                    <div className="absolute top-2 right-3 text-[10px] font-bold tracking-widest text-primary/40 uppercase">
                        CATALYST
                    </div>
                    <CardContent className="p-6">
                        <div 
                            className="flex items-center gap-4 cursor-pointer group"
                            onClick={async () => {
                                if (!userId) return;
                                const profileUrl = `${window.location.origin}/profile/${userId}`;
                                try {
                                    await navigator.clipboard.writeText(profileUrl);
                                    toast({
                                        title: "Link copied to clipboard!",
                                        description: "Share this link to invite others to view your profile.",
                                    });
                                } catch (error) {
                                    toast({
                                        variant: "destructive",
                                        title: "Failed to copy",
                                        description: "Please try again.",
                                    });
                                }
                            }}
                        >
                            <div className="flex-shrink-0 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Share2 className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-xl">Share My Profile</h3>
                                <p className="text-sm text-muted-foreground">
                                    Copy your unique CATALYST profile link to share with investors, founders, or anyone
                                </p>
                            </div>
                            <Button variant="default" size="lg" className="flex-shrink-0">
                                Copy Link
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
                        <div className="space-y-2">
                            <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                            <Input
                                id="linkedinUrl"
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/..."
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
                                    <Label htmlFor="location">Location (HQ)</Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="City, State"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mrr">MRR / Revenue</Label>
                                    <Select value={mrr} onValueChange={setMrr}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select MRR" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pre-revenue">Pre-revenue</SelectItem>
                                            <SelectItem value="$0 - $1k">$0 - $1k</SelectItem>
                                            <SelectItem value="$1k - $10k">$1k - $10k</SelectItem>
                                            <SelectItem value="$10k - $50k">$10k - $50k</SelectItem>
                                            <SelectItem value="$50k+">$50k+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="backedBy">Backed By</Label>
                                    <Input
                                        id="backedBy"
                                        value={backedBy}
                                        onChange={(e) => setBackedBy(e.target.value)}
                                        placeholder="e.g. YC S23, or 'No lead yet'"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            
                            {/* Due Diligence Fields */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium">Due Diligence</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="einNumber">EIN Number</Label>
                                    <Input
                                        id="einNumber"
                                        value={einNumber}
                                        onChange={(e) => setEinNumber(e.target.value)}
                                        placeholder="XX-XXXXXXX"
                                    />
                                </div>
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

                                {/* Video Preview/Upload */}
                                <div className="space-y-2">
                                    <Label>Upload Video</Label>
                                    <div
                                        className="relative cursor-pointer group w-full h-40 rounded-lg overflow-hidden bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                    >
                                        {videoUrl ? (
                                            <video src={videoUrl} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                                <Video className="w-8 h-8 mb-2" />
                                                <span className="text-sm">Click to upload video (max 100MB)</span>
                                                <span className="text-xs mt-1">MP4, WebM, or MOV</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {uploadingVideo ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        id="video-upload"
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                                        className="hidden"
                                        onChange={handleVideoUpload}
                                    />
                                    {videoUrl && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground truncate flex-1">Current: {videoUrl.split('/').pop()}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setVideoUrl('')}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center text-sm text-muted-foreground">— or —</div>

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
                                    <Label htmlFor="position">Position (Optional)</Label>
                                    <Input
                                        id="position"
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        placeholder="e.g. Managing Partner, Associate"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="investorType">Investor Type</Label>
                                    <Select value={investorType} onValueChange={setInvestorType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Retail">Retail Investor</SelectItem>
                                            <SelectItem value="Angel">Angel Investor</SelectItem>
                                            <SelectItem value="Accredited">Accredited Individual</SelectItem>
                                            <SelectItem value="VC">Venture Capital (VC)</SelectItem>
                                            <SelectItem value="PE">Private Equity (PE)</SelectItem>
                                            <SelectItem value="Family Office">Family Office</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accreditationStatus">Accreditation Status</Label>
                                    <Select value={accreditationStatus} onValueChange={setAccreditationStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Accredited">Accredited</SelectItem>
                                            <SelectItem value="Non-Accredited">Non-Accredited</SelectItem>
                                            <SelectItem value="Qualified Purchaser">Qualified Purchaser</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="investmentCount">Total Investments (Est.)</Label>
                                    <Input
                                        id="investmentCount"
                                        type="number"
                                        value={investmentCount}
                                        onChange={(e) => setInvestmentCount(e.target.value)}
                                        placeholder="e.g. 5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notablePortfolio">Notable Portfolio</Label>
                                    <Input
                                        id="notablePortfolio"
                                        value={notablePortfolio}
                                        onChange={(e) => setNotablePortfolio(e.target.value)}
                                        placeholder="e.g. Stripe, Airbnb"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Subscription Settings */}
                {userId && userType && (
                    <SubscriptionSettings userId={userId} userType={userType} />
                )}

                {/* Tokens Section */}
                {userId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Coins className="w-5 h-5 text-amber-500" />
                                Tokens
                            </CardTitle>
                            <CardDescription>
                                Manage your token balance and purchase history
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <TokenBalance userId={userId} variant="default" showPurchaseButton={false} />
                            <div className="flex gap-2">
                                <TokenPurchaseDialog userId={userId} />
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium mb-2">Transaction History</h4>
                                <TokenTransactionHistory userId={userId} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Spotlight Manager (Pro users only) */}
                {userId && userType && (
                    <SpotlightManager userId={userId} userType={userType} />
                )}

                {/* Reset Swipe History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-primary" />
                            Discovery Settings
                        </CardTitle>
                        <CardDescription>Manage your swipe history and profile visibility</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Reset Swipe History</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Profiles you've swiped on will reappear after 14 days. Reset to see all profiles immediately (except matches).
                                </p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" disabled={resettingHistory}>
                                            {resettingHistory ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                            )}
                                            Reset Swipe History
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Reset Swipe History?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will let you see all profiles again that you've previously swiped on. Your matches and conversations will not be affected.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetSwipeHistory}>
                                                Reset History
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
        </div >
    );
};

// Token Transaction History Component - placeholder until token_transactions table is created
const TokenTransactionHistory = ({ userId }: { userId: string }) => {
    return (
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
    );
};

export default Settings;
