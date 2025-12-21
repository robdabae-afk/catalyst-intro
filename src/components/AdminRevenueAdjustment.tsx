import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Loader2 } from 'lucide-react';

interface AdminRevenueAdjustmentProps {
  userId: string;
}

export const AdminRevenueAdjustment = ({ userId }: AdminRevenueAdjustmentProps) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddRevenue = async () => {
    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid positive number'
      });
      return;
    }

    setSaving(true);
    try {
      // Insert a fulfilled manual match record with the specified amount
      const { error } = await supabase
        .from('manual_matches')
        .insert({
          requester_id: userId,
          user_type: 'adjustment',
          payment_status: 'fulfilled',
          amount_paid: amountInCents,
          payment_timestamp: new Date().toISOString(),
          fulfilled_at: new Date().toISOString(),
          fulfilled_by: userId,
          matched_user_id: userId
        });

      if (error) throw error;

      toast({ title: 'Revenue adjustment added successfully' });
      setDialogOpen(false);
      setAmount('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Hidden button - triple click to reveal */}
      <div 
        className="h-4 w-full cursor-default select-none"
        onClick={(e) => {
          if (e.detail === 3) {
            setDialogOpen(true);
          }
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Adjustment
            </DialogTitle>
            <DialogDescription>
              Add a revenue adjustment to the admin panel stats
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRevenue} disabled={saving || !amount}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Revenue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
