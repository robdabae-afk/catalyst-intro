import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const SafeGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  
  // Pre-fill from URL params (from funding request approval)
  const [formData, setFormData] = useState({
    investorId: searchParams.get('investor_id') || "",
    amount: searchParams.get('amount') || "",
    valuationCap: "",
    discountRate: "",
    executionDate: ""
  });

  useEffect(() => {
    checkUser();
    loadInvestors();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUserId(user.id);
  };

  const loadInvestors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, investor_profiles(*)')
      .eq('user_type', 'investor');
    
    setInvestors(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('safes')
        .insert({
          founder_id: currentUserId,
          investor_id: formData.investorId,
          amount: parseFloat(formData.amount),
          valuation_cap: formData.valuationCap ? parseFloat(formData.valuationCap) : null,
          discount_rate: formData.discountRate ? parseFloat(formData.discountRate) : null,
          execution_date: formData.executionDate || null,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "SAFE agreement has been created.",
      });

      // Get the created SAFE ID to navigate to it
      const { data: createdSafe } = await supabase
        .from('safes')
        .select('id')
        .eq('founder_id', currentUserId)
        .eq('investor_id', formData.investorId)
        .eq('amount', parseFloat(formData.amount))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (createdSafe) {
        navigate(`/safe/${createdSafe.id}`);
      } else {
        navigate('/captable');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create SAFE",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">SAFE Generator</CardTitle>
            <CardDescription>Create a Simple Agreement for Future Equity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="investor">Investor *</Label>
                <Select value={formData.investorId} onValueChange={(value) => setFormData({ ...formData, investorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investor" />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((investor) => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.name} {investor.investor_profiles?.[0]?.firm_name && `(${investor.investor_profiles[0].firm_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationCap">Valuation Cap ($)</Label>
                <Input
                  id="valuationCap"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 5000000"
                  value={formData.valuationCap}
                  onChange={(e) => setFormData({ ...formData, valuationCap: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountRate">Discount Rate (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g., 20"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionDate">Execution Date</Label>
                <Input
                  id="executionDate"
                  type="date"
                  value={formData.executionDate}
                  onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.investorId} className="flex-1">
                  {loading ? "Creating..." : "Generate SAFE"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeGenerator;
