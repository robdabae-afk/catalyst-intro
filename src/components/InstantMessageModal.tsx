import React, { useState } from 'react';
import { X, Send, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TOKEN_COST = 30;

interface InstantMessageModalProps {
    receiverId: string;
    receiverName: string;
    tokenBalance: number;
    onClose: () => void;
    onSuccess: (newBalance: number) => void;
    onOpenPurchase: () => void;
}

export const InstantMessageModal: React.FC<InstantMessageModalProps> = ({
    receiverId,
    receiverName,
    tokenBalance,
    onClose,
    onSuccess,
    onOpenPurchase
}) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    const hasEnoughTokens = tokenBalance >= TOKEN_COST;

    const handleSend = async () => {
        if (!message.trim()) {
            toast({
                title: "Message required",
                description: "Please enter a message before sending.",
                variant: "destructive"
            });
            return;
        }

        if (!hasEnoughTokens) {
            toast({
                title: "Insufficient tokens",
                description: `You need ${TOKEN_COST} tokens to send an instant message.`,
                variant: "destructive"
            });
            return;
        }

        setSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(
                `${supabase.supabaseUrl}/functions/v1/send-instant-message`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        receiverId,
                        content: message
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send message');
            }

            toast({
                title: "Message sent!",
                description: `Your message has been sent to ${receiverName}. ${result.tokensSpent} tokens spent.`
            });

            onSuccess(result.newBalance);
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to send instant message',
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-zinc-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Send Message</h2>
                        <p className="text-sm text-gray-400 mt-1">to {receiverName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Token Balance */}
                <div className="mb-4 flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        <span className="text-sm text-gray-300">Your Balance:</span>
                    </div>
                    <span className="text-white font-bold">{tokenBalance} tokens</span>
                </div>

                {/* Cost Display */}
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-200">
                        <strong>{TOKEN_COST} tokens</strong> will be deducted to send this message
                    </p>
                </div>

                {/* Message Input */}
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="mb-4 min-h-[120px] bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                    disabled={sending}
                />

                {/* Actions */}
                <div className="flex gap-3">
                    {!hasEnoughTokens ? (
                        <Button
                            onClick={onOpenPurchase}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                        >
                            <Coins size={18} className="mr-2" />
                            Buy Tokens
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                            className="flex-1 bg-white hover:bg-gray-200 text-black font-bold"
                        >
                            {sending ? (
                                "Sending..."
                            ) : (
                                <>
                                    <Send size={18} className="mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {!hasEnoughTokens && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                        You need {TOKEN_COST - tokenBalance} more tokens
                    </p>
                )}
            </div>
        </div>
    );
};
