import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const InvestorOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    firmName: "",
    checkSize: "",
    preferredStage: "" as "pre-seed" | "seed" | "series-a" | "series-b" | "",
    sectors: "",
    location: "",
    portfolioLink: ""
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
          user_type: 'investor',
          name: formData.name,
          email: formData.email
        });

      if (profileError) throw profileError;

      // Create investor profile
      const { error: investorError } = await supabase
        .from('investor_profiles')
        .insert({
          profile_id: authData.user.id,
          firm_name: formData.firmName || null,
          typical_check_size: formData.checkSize || null,
          preferred_stage: formData.preferredStage || null,
          sectors_of_interest: formData.sectors ? formData.sectors.split(',').map(s => s.trim()) : null,
          location: formData.location || null,
          portfolio_link: formData.portfolioLink || null
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
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                  id="firmName"
                  placeholder="Optional"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                />
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
                    <SelectItem value="pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series-a">Series A</SelectItem>
                    <SelectItem value="series-b">Series B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectors">Sectors of Interest</Label>
                <Input
                  id="sectors"
                  placeholder="e.g., FinTech, AI, SaaS (comma-separated)"
                  value={formData.sectors}
                  onChange={(e) => setFormData({ ...formData, sectors: e.target.value })}
                />
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

export default InvestorOnboarding;
