import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, DollarSign, Calendar, BarChart3, Table, MoreHorizontal } from 'lucide-react';

interface RequestMenuProps {
  targetId: string;
  targetName: string;
}

const REQUEST_TYPES = [
  { value: 'pitch_deck', label: 'Pitch Deck', icon: FileText },
  { value: 'financials', label: 'Financials', icon: BarChart3 },
  { value: 'cap_table', label: 'Cap Table', icon: Table },
  { value: 'funding_interest', label: 'Express Funding Interest', icon: DollarSign },
  { value: 'meeting', label: 'Request Meeting', icon: Calendar },
  { value: 'other', label: 'Other Request', icon: MoreHorizontal },
] as const;

export const RequestMenu = ({ targetId, targetName }: RequestMenuProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = (type: string) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('document_requests').insert({
        requester_id: user.id,
        target_id: targetId,
        request_type: selectedType,
        message: message.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Request sent',
        description: `Your request has been sent to ${targetName}`,
      });
      
      setDialogOpen(false);
      setMessage('');
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
        <DropdownMenuContent align="end" className="w-48">
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
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Send a {selectedTypeInfo?.label.toLowerCase()} request to {targetName}
            </p>
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
