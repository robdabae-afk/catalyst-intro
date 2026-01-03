import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import { TOKEN_COSTS } from '@/lib/stripe-constants';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';
import { Loader2, MessageSquare, Coins, Send } from 'lucide-react';

interface InstantMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderId: string;
  receiverId: string;
  receiverName: string;
  userType: 'founder' | 'investor';
  isPopular?: boolean;
  onMessageSent?: () => void;
}

export const InstantMessageDialog = ({
  open,
  onOpenChange,
  senderId,
  receiverId,
  receiverName,
  userType,
  isPopular = false,
  onMessageSent,
}: InstantMessageDialogProps) => {
  const { toast } = useToast();
  const { balance, loading: balanceLoading } = useTokens(senderId);
  const tokenCost = userType === 'founder' ? TOKEN_COSTS.INSTANT_MESSAGE_FOUNDER : TOKEN_COSTS.INSTANT_MESSAGE_INVESTOR;
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a message',
      });
      return;
    }

    // Check token balance
    if (balance < tokenCost) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Tokens',
        description: `You need ${tokenCost} tokens but only have ${balance}. Purchase more tokens to continue.`,
      });
      setShowTokenPurchase(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-instant-message', {
        body: {
          receiverId,
          content: message.trim(),
        },
      });

      if (error) {
        if (error.error?.includes('Insufficient tokens')) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Tokens',
            description: error.error,
          });
          setShowTokenPurchase(true);
        } else {
          throw new Error(error.error || 'Failed to send message');
        }
        return;
      }

      if (data?.success) {
        toast({
          title: 'Message Sent!',
          description: `Your instant message has been sent to ${receiverName}. ${tokenCost} tokens deducted.`,
        });
        setMessage('');
        onOpenChange(false);
        if (onMessageSent) onMessageSent();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send instant message',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TokenPurchaseDialog
        userId={senderId}
        open={showTokenPurchase}
        onOpenChange={setShowTokenPurchase}
        onPurchaseComplete={() => setShowTokenPurchase(false)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Send Instant Message
            </DialogTitle>
            <DialogDescription>
              {isPopular 
                ? `${receiverName} is popular and receives many messages. Send an instant message to stand out!`
                : `Send a direct message to ${receiverName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Token Cost Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Cost:</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-bold">{tokenCost} tokens</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Balance:</span>
                {balanceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span className={`text-lg font-bold ${balance < tokenCost ? 'text-red-600' : 'text-green-600'}`}>
                      {balance} tokens
                    </span>
                  </div>
                )}
              </div>
              {balance < tokenCost && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-red-600">
                    Insufficient tokens. Purchase more to continue.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTokenPurchase(true)}
                    className="w-full"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Purchase Here
                  </Button>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Message</label>
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={loading || balanceLoading || balance < tokenCost || !message.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Instant Message ({tokenCost} tokens)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

