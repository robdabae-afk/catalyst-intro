import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, User } from "lucide-react";

const FounderOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    startupName: "",
    oneLiner: "",
    industry: "",
    traction: "",
    pitchDeckUrl: "",
    preferredCity: "",
    companyState: "",
    companyAddress: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      // Upload avatar if selected
      const avatarUrl = await uploadAvatar(authData.user.id);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_type: 'founder',
          name: formData.name,
          email: formData.email,
          avatar_url: avatarUrl
        });

      if (profileError) throw profileError;

      // Create founder profile
      const { error: founderError } = await supabase
        .from('founder_profiles')
        .insert({
          profile_id: authData.user.id,
          startup_name: formData.startupName,
          company_name: formData.startupName,
          one_liner: formData.oneLiner,
          industry: formData.industry || null,
          traction: formData.traction || null,
          pitch_deck_url: formData.pitchDeckUrl || null,
          preferred_city: formData.preferredCity || null,
          company_state: formData.companyState || null,
          company_address: formData.companyAddress || null
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
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., FinTech, HealthTech, SaaS"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traction">Traction</Label>
                <Textarea
                  id="traction"
                  placeholder="Revenue, users, key milestones..."
                  value={formData.traction}
                  onChange={(e) => setFormData({ ...formData, traction: e.target.value })}
                />
              </div>

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

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
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