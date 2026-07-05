import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Filter, Loader2, X, MapPin, Building2, TrendingUp } from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants";

const FilterPreferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('filter_stages, filter_industries, filter_locations')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading preferences:', error);
    } else if (profile) {
      setSelectedStages(profile.filter_stages || []);
      setSelectedIndustries(profile.filter_industries || []);
      setLocations(profile.filter_locations || []);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        filter_stages: selectedStages.length > 0 ? selectedStages : null,
        filter_industries: selectedIndustries.length > 0 ? selectedIndustries : null,
        filter_locations: locations.length > 0 ? locations : null,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving preferences",
        description: error.message,
      });
    } else {
      toast({
        title: "Preferences saved",
        description: "Your discovery filters have been updated.",
      });
    }
    
    setSaving(false);
  };

  const handleClearAll = async () => {
    setSelectedStages([]);
    setSelectedIndustries([]);
    setLocations([]);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        filter_stages: null,
        filter_industries: null,
        filter_locations: null,
      })
      .eq('id', user.id);

    toast({
      title: "Filters cleared",
      description: "You'll now see all profiles in discovery.",
    });
  };

  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter(l => l !== location));
  };

  const activeFilterCount = 
    (selectedStages.length > 0 ? 1 : 0) + 
    (selectedIndustries.length > 0 ? 1 : 0) + 
    (locations.length > 0 ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Discovery Filters</h1>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Set your preferences to see profiles that match your interests. 
              Leave sections empty to see all profiles.
            </p>
          </CardContent>
        </Card>

        {/* Funding Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Funding Stages
            </CardTitle>
            <CardDescription>
              Select which funding stages you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {FUNDING_STAGES.map(stage => (
                <div
                  key={stage.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStages.includes(stage.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleStage(stage.value)}
                >
                  <Checkbox
                    id={`stage-${stage.value}`}
                    checked={selectedStages.includes(stage.value)}
                    onCheckedChange={() => toggleStage(stage.value)}
                  />
                  <Label htmlFor={`stage-${stage.value}`} className="cursor-pointer flex-1">
                    {stage.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Industries
            </CardTitle>
            <CardDescription>
              Select industries you want to see
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(industry => (
                <Button
                  key={industry}
                  type="button"
                  variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleIndustry(industry)}
                  className="transition-all"
                >
                  {industry}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Locations
            </CardTitle>
            <CardDescription>
              Add cities or regions you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a city or region..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLocation()}
              />
              <Button onClick={addLocation} variant="secondary">
                Add
              </Button>
            </div>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <Badge
                    key={location}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1.5"
                  >
                    <MapPin className="w-3 h-3" />
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1"
            disabled={activeFilterCount === 0}
          >
            Clear All Filters
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FilterPreferences;