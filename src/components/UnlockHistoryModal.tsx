import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Lock, Crown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnlockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPurchaseWithTokens: () => void;
    onUpgrade: () => void;
    tokenCost?: number;
}

export const UnlockHistoryModal = ({
    isOpen,
    onClose,
    onPurchaseWithTokens,
    onUpgrade,
    tokenCost = 30
}: UnlockHistoryModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 p-0 overflow-hidden max-w-sm rounded-[32px]">
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-white/80" />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-white mb-2">
                        Unlock Deal History
                    </h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Get access to confidential funding rounds, valuation data, and exit history.
                    </p>

                    <div className="w-full space-y-3">
                        {/* Option 1: Tokens */}
                        <Button
                            onClick={onPurchaseWithTokens}
                            variant="outline"
                            className="w-full h-14 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white flex items-center justify-between px-4 group"
                        >
                            <span className="font-bold text-sm">Unlock Profile</span>
                            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
                                <span className="text-xs font-bold text-white">- {tokenCost}</span>
                                <Coins className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                            </div>
                        </Button>

                        {/* Option 2: Pro */}
                        <Button
                            onClick={onUpgrade}
                            className="w-full h-14 bg-gradient-to-r from-[#C5A059] to-[#997B40] hover:opacity-90 text-black border-none flex items-center justify-center gap-2"
                        >
                            <Crown className="w-4 h-4 fill-black" />
                            <span className="font-bold text-sm uppercase tracking-wide">Upgrade to Pro</span>
                        </Button>
                    </div>

                    <p className="text-[10px] text-gray-500 mt-6">
                        Pro members get history access included.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
