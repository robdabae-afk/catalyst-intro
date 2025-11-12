import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const CoffeeChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    proposedDate: "",
    meetingLocation: "",
    notes: ""
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUserId(user.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const founderId = searchParams.get('founderId');
    const investorId = searchParams.get('investorId');

    try {
      const { error } = await supabase
        .from('coffee_chats')
        .insert({
          founder_id: founderId || currentUserId,
          investor_id: investorId || currentUserId,
          proposed_date: formData.proposedDate || null,
          meeting_location: formData.meetingLocation || null,
          notes: formData.notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Coffee chat invitation has been sent.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create coffee chat",
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
            <CardTitle className="text-3xl">Schedule Coffee Chat</CardTitle>
            <CardDescription>Propose a time and place to meet</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="proposedDate">Proposed Date & Time</Label>
                <Input
                  id="proposedDate"
                  type="datetime-local"
                  value={formData.proposedDate}
                  onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingLocation">Meeting Location</Label>
                <Input
                  id="meetingLocation"
                  placeholder="Coffee shop name, address, or Google Maps link"
                  value={formData.meetingLocation}
                  onChange={(e) => setFormData({ ...formData, meetingLocation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoffeeChat;
