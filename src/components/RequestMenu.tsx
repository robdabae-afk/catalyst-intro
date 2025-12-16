import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, DollarSign, Calendar, BarChart3, Table, MoreHorizontal, Wallet, Briefcase, FileCheck } from 'lucide-react';

interface RequestMenuProps {
  targetId: string;
  targetName: string;
  requesterType?: 'founder' | 'investor';
}

// Investor requesting from Founder
const INVESTOR_REQUEST_TYPES = [
  { value: 'pitch_deck', label: 'Pitch Deck', icon: FileText },
  { value: 'financials', label: 'Financials', icon: BarChart3 },
  { value: 'cap_table', label: 'Cap Table', icon: Table },
  { value: 'funding_interest', label: 'Express Funding Interest', icon: DollarSign },
  { value: 'meeting', label: 'Request Meeting', icon: Calendar },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal },
] as const;

// Founder requesting from Investor
const FOUNDER_REQUEST_TYPES = [
  { value: 'proof_of_funds', label: 'Proof of Funds', icon: Wallet },
  { value: 'investment_portfolio', label: 'Investment Portfolio', icon: Briefcase },
  { value: 'term_sheet', label: 'Term Sheet', icon: FileCheck },
  { value: 'safe_request', label: 'Request SAFE Signature', icon: FileText },
  { value: 'meeting', label: 'Request Meeting', icon: Calendar },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal },
] as const;

export const RequestMenu = ({ targetId, targetName, requesterType = 'investor' }: RequestMenuProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const REQUEST_TYPES = requesterType === 'founder' ? FOUNDER_REQUEST_TYPES : INVESTOR_REQUEST_TYPES;

  const handleRequest = (type: string) => {
    // Navigate to coffee chat for meeting requests
    if (type === 'meeting') {
      navigate('/coffeechat');
      return;
    }
    setSelectedType(type);
    setDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Include funding amount in message for funding_interest requests
      let finalMessage = message.trim() || null;
      if (selectedType === 'funding_interest' && fundingAmount) {
        finalMessage = `Funding Amount: $${fundingAmount}${message.trim() ? `\n\n${message.trim()}` : ''}`;
      }

      const { error } = await supabase.from('document_requests').insert({
        requester_id: user.id,
        target_id: targetId,
        request_type: selectedType,
        message: finalMessage,
      });

      if (error) throw error;

      toast({
        title: 'Request sent',
        description: `Your request has been sent to ${targetName}`,
      });
      
      setDialogOpen(false);
      setMessage('');
      setFundingAmount('');
      setSelectedType(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeInfo = REQUEST_TYPES.find(t => t.value === selectedType);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Request
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {REQUEST_TYPES.slice(0, 3).map((type) => (
            <DropdownMenuItem key={type.value} onClick={() => handleRequest(type.value)}>
              <type.icon className="mr-2 h-4 w-4" />
              {type.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {REQUEST_TYPES.slice(3).map((type) => (
            <DropdownMenuItem key={type.value} onClick={() => handleRequest(type.value)}>
              <type.icon className="mr-2 h-4 w-4" />
              {type.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTypeInfo && <selectedTypeInfo.icon className="h-5 w-5" />}
              {selectedTypeInfo?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a {selectedTypeInfo?.label.toLowerCase()} request to {targetName}
            </p>
            {selectedType === 'funding_interest' && (
              <div className="space-y-2">
                <Label htmlFor="funding-amount">Investment Amount ($)</Label>
                <Input
                  id="funding-amount"
                  type="number"
                  placeholder="e.g., 50000"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                />
              </div>
            )}
            <Textarea
              placeholder="Add a message (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
