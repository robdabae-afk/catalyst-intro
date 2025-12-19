import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Megaphone, Link2, Building2, Briefcase, Upload, X } from "lucide-react";

type AdProfileType = 'startup' | 'investment_fund' | 'external';
type SpotlightDuration = '1_day' | '1_week' | '1_month';

interface AdProfile {
  id: string;
  linked_profile_id: string | null;
  ad_type: AdProfileType;
  name: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  company_name: string | null;
  one_liner: string | null;
  industry: string[] | null;
  stage: string | null;
  website_url: string | null;
  firm_name: string | null;
  typical_check_size: string | null;
  sectors_of_interest: string[] | null;
  portfolio_link: string | null;
  external_company_name: string | null;
  service_description: string | null;
  cta_text: string | null;
  cta_url: string | null;
  spotlight_duration: SpotlightDuration | null;
  spotlight_start_date: string | null;
  spotlight_end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ExistingProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_type: 'founder' | 'investor';
}

const INDUSTRIES = [
  'SaaS', 'AI', 'Fintech', 'HealthTech', 'EdTech', 
  'Consumer', 'Marketplace', 'Robotics', 'Biotech', 'Climate',
  'Enterprise', 'Web3', 'Hardware', 'Gaming', 'Media'
];

const STAGES = ['pre-seed', 'seed', 'series-a', 'series-b'];

const SPOTLIGHT_DURATION_LABELS: Record<SpotlightDuration, string> = {
  '1_day': '1 Day',
  '1_week': '1 Week',
  '1_month': '1 Month'
};

const AD_TYPE_LABELS: Record<AdProfileType, string> = {
  'startup': 'Startup',
  'investment_fund': 'Investment Fund',
  'external': 'External Company'
};

const AD_TYPE_ICONS: Record<AdProfileType, React.ReactNode> = {
  'startup': <Building2 className="w-4 h-4" />,
  'investment_fund': <Briefcase className="w-4 h-4" />,
  'external': <Megaphone className="w-4 h-4" />
};

export const AdminAdPanel = () => {
  const { toast } = useToast();
  const [adProfiles, setAdProfiles] = useState<AdProfile[]>([]);
  const [existingProfiles, setExistingProfiles] = useState<ExistingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    ad_type: 'startup' as AdProfileType,
    linked_profile_id: '',
    name: '',
    description: '',
    image_url: '',
    banner_url: '',
    company_name: '',
    one_liner: '',
    industry: [] as string[],
    stage: '',
    website_url: '',
    firm_name: '',
    typical_check_size: '',
    sectors_of_interest: [] as string[],
    portfolio_link: '',
    external_company_name: '',
    service_description: '',
    cta_text: '',
    cta_url: '',
    spotlight_duration: '1_week' as SpotlightDuration,
    is_active: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load ad profiles
      const { data: ads, error: adsError } = await supabase
        .from('ad_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;
      setAdProfiles(ads || []);

      // Load existing profiles for linking
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, user_type')
        .order('name');

      if (profilesError) throw profilesError;
      setExistingProfiles(profiles || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ad_type: 'startup',
      linked_profile_id: '',
      name: '',
      description: '',
      image_url: '',
      banner_url: '',
      company_name: '',
      one_liner: '',
      industry: [],
      stage: '',
      website_url: '',
      firm_name: '',
      typical_check_size: '',
      sectors_of_interest: [],
      portfolio_link: '',
      external_company_name: '',
      service_description: '',
      cta_text: '',
      cta_url: '',
      spotlight_duration: '1_week',
      is_active: false
    });
    setEditingAd(null);
  };

  const handleProfileSelect = async (profileId: string) => {
    if (profileId === "none" || !profileId) {
      setFormData(prev => ({ ...prev, linked_profile_id: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, linked_profile_id: profileId }));

    // Find the profile
    const profile = existingProfiles.find(p => p.id === profileId);
    if (!profile) return;

    try {
      if (profile.user_type === 'founder') {
        // Fetch founder profile data
        const { data: founderProfile, error } = await supabase
          .from('founder_profiles')
          .select('*')
          .eq('profile_id', profileId)
          .single();

        if (error) {
          console.error('Error fetching founder profile:', error);
          return;
        }

        if (founderProfile) {
          setFormData(prev => ({
            ...prev,
            ad_type: 'startup',
            name: profile.name,
            image_url: profile.avatar_url || '',
            banner_url: founderProfile.banner_url || '',
            company_name: founderProfile.company_name || founderProfile.startup_name || '',
            one_liner: founderProfile.one_liner || '',
            industry: founderProfile.industry || [],
            stage: founderProfile.stage || '',
          }));
        }
      } else if (profile.user_type === 'investor') {
        // Fetch investor profile data
        const { data: investorProfile, error } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('profile_id', profileId)
          .single();

        if (error) {
          console.error('Error fetching investor profile:', error);
          return;
        }

        if (investorProfile) {
          setFormData(prev => ({
            ...prev,
            ad_type: 'investment_fund',
            name: profile.name,
            image_url: profile.avatar_url || '',
            banner_url: investorProfile.banner_url || '',
            firm_name: investorProfile.firm_name || '',
            typical_check_size: investorProfile.typical_check_size || '',
            sectors_of_interest: investorProfile.sectors_of_interest || [],
            portfolio_link: investorProfile.portfolio_link || '',
          }));
        }
      }

      toast({
        title: "Profile loaded",
        description: "Data from the linked profile has been auto-populated."
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'banner'): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `ad-profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError.message
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const url = await uploadFile(file, 'image');
    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
    setUploadingImage(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const url = await uploadFile(file, 'banner');
    if (url) {
      setFormData(prev => ({ ...prev, banner_url: url }));
    }
    setUploadingBanner(false);
  };

  const openEditDialog = (ad: AdProfile) => {
    setEditingAd(ad);
    setFormData({
      ad_type: ad.ad_type,
      linked_profile_id: ad.linked_profile_id || '',
      name: ad.name,
      description: ad.description || '',
      image_url: ad.image_url || '',
      banner_url: ad.banner_url || '',
      company_name: ad.company_name || '',
      one_liner: ad.one_liner || '',
      industry: ad.industry || [],
      stage: ad.stage || '',
      website_url: ad.website_url || '',
      firm_name: ad.firm_name || '',
      typical_check_size: ad.typical_check_size || '',
      sectors_of_interest: ad.sectors_of_interest || [],
      portfolio_link: ad.portfolio_link || '',
      external_company_name: ad.external_company_name || '',
      service_description: ad.service_description || '',
      cta_text: ad.cta_text || '',
      cta_url: ad.cta_url || '',
      spotlight_duration: ad.spotlight_duration || '1_week',
      is_active: ad.is_active
    });
    setDialogOpen(true);
  };

  const calculateEndDate = (startDate: Date, duration: SpotlightDuration): Date => {
    const endDate = new Date(startDate);
    switch (duration) {
      case '1_day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case '1_week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case '1_month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    return endDate;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name is required"
      });
      return;
    }

    setActionLoading('submit');

    try {
      const now = new Date();
      const endDate = calculateEndDate(now, formData.spotlight_duration);

      const adData = {
        ad_type: formData.ad_type,
        linked_profile_id: formData.linked_profile_id || null,
        name: formData.name,
        description: formData.description || null,
        image_url: formData.image_url || null,
        banner_url: formData.banner_url || null,
        company_name: formData.company_name || null,
        one_liner: formData.one_liner || null,
        industry: formData.industry.length > 0 ? formData.industry : null,
        stage: formData.stage || null,
        website_url: formData.website_url || null,
        firm_name: formData.firm_name || null,
        typical_check_size: formData.typical_check_size || null,
        sectors_of_interest: formData.sectors_of_interest.length > 0 ? formData.sectors_of_interest : null,
        portfolio_link: formData.portfolio_link || null,
        external_company_name: formData.external_company_name || null,
        service_description: formData.service_description || null,
        cta_text: formData.cta_text || null,
        cta_url: formData.cta_url || null,
        spotlight_duration: formData.spotlight_duration,
        spotlight_start_date: formData.is_active ? now.toISOString() : null,
        spotlight_end_date: formData.is_active ? endDate.toISOString() : null,
        is_active: formData.is_active
      };

      if (editingAd) {
        const { error } = await supabase
          .from('ad_profiles')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;

        toast({
          title: "Ad Profile Updated",
          description: "The ad profile has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('ad_profiles')
          .insert(adData);

        if (error) throw error;

        toast({
          title: "Ad Profile Created",
          description: "The new ad profile has been created successfully."
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving ad profile",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (ad: AdProfile) => {
    setActionLoading(ad.id);

    try {
      const now = new Date();
      const endDate = calculateEndDate(now, ad.spotlight_duration || '1_week');

      const { error } = await supabase
        .from('ad_profiles')
        .update({
          is_active: !ad.is_active,
          spotlight_start_date: !ad.is_active ? now.toISOString() : ad.spotlight_start_date,
          spotlight_end_date: !ad.is_active ? endDate.toISOString() : ad.spotlight_end_date
        })
        .eq('id', ad.id);

      if (error) throw error;

      toast({
        title: ad.is_active ? "Ad Deactivated" : "Ad Activated",
        description: ad.is_active 
          ? "The ad profile is now inactive." 
          : "The ad profile is now live in the swipe deck."
      });

      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating ad",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad profile?')) return;

    setActionLoading(adId);

    try {
      const { error } = await supabase
        .from('ad_profiles')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Ad Deleted",
        description: "The ad profile has been deleted."
      });

      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting ad",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const isExpired = (ad: AdProfile) => {
    if (!ad.spotlight_end_date) return false;
    return new Date(ad.spotlight_end_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <Megaphone className="w-5 h-5" />
          Ad Profiles ({adProfiles.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ad Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Ad Profile' : 'Create Ad Profile'}</DialogTitle>
              <DialogDescription>
                {editingAd ? 'Update the ad profile details below.' : 'Create a new ad profile that will appear in the swipe deck.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Ad Type */}
              <div className="space-y-2">
                <Label>Ad Type *</Label>
                <Select
                  value={formData.ad_type}
                  onValueChange={(value: AdProfileType) => setFormData({ ...formData, ad_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="investment_fund">Investment Fund</SelectItem>
                    <SelectItem value="external">External Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Link to Existing Profile */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to Existing Profile (Optional)
                </Label>
              <Select
                  value={formData.linked_profile_id || "none"}
                  onValueChange={handleProfileSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile to promote..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Manual Ad)</SelectItem>
                    {existingProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.user_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a profile to auto-populate fields. You can override any values after.
                </p>
              </div>

              {/* Basic Info */}
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Company or person name"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {formData.image_url ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={formData.image_url} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Change"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>

              {/* Banner Upload */}
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerUpload}
                  accept="image/*"
                  className="hidden"
                />
                {formData.banner_url ? (
                  <div className="space-y-2">
                    <img 
                      src={formData.banner_url} 
                      alt="Banner" 
                      className="w-full h-24 rounded-md object-cover border"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                      >
                        {uploadingBanner ? "Uploading..." : "Change Banner"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, banner_url: '' }))}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingBanner ? "Uploading..." : "Upload Banner"}
                  </Button>
                )}
              </div>

              {/* Startup-specific fields */}
              {formData.ad_type === 'startup' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Startup Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => setFormData({ ...formData, stage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>One-liner</Label>
                    <Input
                      value={formData.one_liner}
                      onChange={(e) => setFormData({ ...formData, one_liner: e.target.value })}
                      placeholder="What does this startup do?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industries</Label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRIES.map(ind => (
                        <Badge
                          key={ind}
                          variant={formData.industry.includes(ind) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newIndustries = formData.industry.includes(ind)
                              ? formData.industry.filter(i => i !== ind)
                              : [...formData.industry, ind];
                            setFormData({ ...formData, industry: newIndustries });
                          }}
                        >
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {/* Investment Fund-specific fields */}
              {formData.ad_type === 'investment_fund' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Investment Fund Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Firm Name</Label>
                      <Input
                        value={formData.firm_name}
                        onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Typical Check Size</Label>
                      <Input
                        value={formData.typical_check_size}
                        onChange={(e) => setFormData({ ...formData, typical_check_size: e.target.value })}
                        placeholder="$25K - $100K"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sectors of Interest</Label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRIES.map(sector => (
                        <Badge
                          key={sector}
                          variant={formData.sectors_of_interest.includes(sector) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newSectors = formData.sectors_of_interest.includes(sector)
                              ? formData.sectors_of_interest.filter(s => s !== sector)
                              : [...formData.sectors_of_interest, sector];
                            setFormData({ ...formData, sectors_of_interest: newSectors });
                          }}
                        >
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Portfolio Link</Label>
                    <Input
                      value={formData.portfolio_link}
                      onChange={(e) => setFormData({ ...formData, portfolio_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {/* External Company-specific fields */}
              {formData.ad_type === 'external' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    External Company Details
                  </h4>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.external_company_name}
                      onChange={(e) => setFormData({ ...formData, external_company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Description</Label>
                    <Textarea
                      value={formData.service_description}
                      onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                      placeholder="What service do they offer?"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Button Text</Label>
                      <Input
                        value={formData.cta_text}
                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                        placeholder="Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA URL</Label>
                      <Input
                        value={formData.cta_url}
                        onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Spotlight Settings */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Spotlight Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spotlight Duration</Label>
                    <Select
                      value={formData.spotlight_duration}
                      onValueChange={(value: SpotlightDuration) => setFormData({ ...formData, spotlight_duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_day">1 Day</SelectItem>
                        <SelectItem value="1_week">1 Week</SelectItem>
                        <SelectItem value="1_month">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Activate Now</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_active ? 'Will be live immediately' : 'Save as draft'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={actionLoading === 'submit'}>
                  {actionLoading === 'submit' ? 'Saving...' : editingAd ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {adProfiles.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Ad Profiles Yet</h3>
          <p className="text-muted-foreground mt-1">Create your first ad profile to start promoting in the swipe deck.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Profile</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adProfiles.map(ad => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      {AD_TYPE_ICONS[ad.ad_type]}
                      {AD_TYPE_LABELS[ad.ad_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ad.linked_profile_id ? (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Link2 className="w-3 h-3" />
                        Linked
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ad.spotlight_duration ? SPOTLIGHT_DURATION_LABELS[ad.spotlight_duration] : '-'}
                  </TableCell>
                  <TableCell>
                    {ad.is_active && !isExpired(ad) ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : isExpired(ad) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ad.spotlight_end_date 
                      ? new Date(ad.spotlight_end_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant={ad.is_active ? "outline" : "default"}
                      onClick={() => toggleActive(ad)}
                      disabled={actionLoading === ad.id}
                    >
                      {ad.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(ad)}
                      disabled={actionLoading === ad.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAd(ad.id)}
                      disabled={actionLoading === ad.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
