import React from 'react';
import { X, Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOKEN_PACKAGES } from '@/lib/stripe-constants';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TokenPurchaseModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState<string | null>(null);

    const handlePurchase = async (packageId: string) => {
        setLoading(packageId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-tokens`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'purchase_tokens',
                        packageId
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe checkout
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to start token purchase',
                variant: "destructive"
            });
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-zinc-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Buy Tokens</h2>
                        <p className="text-sm text-gray-400 mt-1">Choose a package to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Packages */}
                <div className="space-y-3">
                    {TOKEN_PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-amber-500/50 transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Coins size={16} className="text-amber-500" />
                                        <span className="text-amber-400 font-semibold">
                                            {pkg.tokens} Tokens
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">{pkg.displayPrice}</div>
                                    <div className="text-xs text-gray-500">
                                        ${(pkg.priceCents / pkg.tokens / 100).toFixed(2)}/token
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={loading !== null}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                            >
                                {loading === pkg.id ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        <Sparkles size={18} className="mr-2" />
                                        Purchase
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <p className="text-xs text-center text-gray-500 mt-6">
                    You'll be redirected to a secure Stripe checkout page
                </p>
            </div>
        </div>
    );
};
