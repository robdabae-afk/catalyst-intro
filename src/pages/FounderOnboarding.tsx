import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FounderOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_type: 'founder',
          name: formData.name,
          email: formData.email
        });

      if (profileError) throw profileError;

      // Create founder profile
      const { error: founderError } = await supabase
        .from('founder_profiles')
        .insert({
          profile_id: authData.user.id,
          startup_name: formData.startupName,
          company_name: formData.startupName, // Default company name to startup name
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
