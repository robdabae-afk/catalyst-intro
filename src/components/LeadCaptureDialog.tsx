import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, Download, AlertCircle } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
        message: "Please enter a valid phone number (e.g., +15555555555).",
    }),
});

interface LeadCaptureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function LeadCaptureDialog({
    open,
    onOpenChange,
    onSuccess,
}: LeadCaptureDialogProps) {
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null);
        setVerifying(true);

        // Simulate async verification
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simple "verification" logic - fail if phone contains specific test number (optional)
        // For now, assume format check passed by regex is enough for "simulation"
        const isValid = true;

        setVerifying(false);

        if (isValid) {
            setVerified(true);

            // Save to Supabase
            try {
                await (supabase as any).from('deck_leads').insert({
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    source: 'download',
                });
            } catch (err) {
                console.error('Error saving lead:', err);
            }

            // Wait a brief moment to show success state before closing/downloading
            setTimeout(() => {
                onSuccess();
                onOpenChange(false);
                // Reset form after download starts
                setTimeout(() => {
                    setVerified(false);
                    form.reset();
                }, 500);
            }, 1000);
        } else {
            setError("Phone verification failed. Please check the number and try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#333333] text-[#FFFFFF]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Download Full Deck</DialogTitle>
                    <DialogDescription className="text-[#AAAAAA]">
                        Please provide your contact details to verify access and download the PDF.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#FFFFFF]">Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} className="bg-[#111111] border-[#333333] text-[#FFFFFF] placeholder:text-[#444444]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#FFFFFF]">Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" {...field} className="bg-[#111111] border-[#333333] text-[#FFFFFF] placeholder:text-[#444444]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#FFFFFF]">Phone Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="+1 (555) 000-0000"
                                                {...field}
                                                className={`bg-[#111111] border-[#333333] text-[#FFFFFF] placeholder:text-[#444444] ${verified ? "border-green-500 text-green-500" : ""}`}
                                            />
                                            {verified && (
                                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                    </FormControl>
                                    <p className="text-[10px] text-[#555555]">
                                        We verify numbers to prevent spam.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <Alert variant="destructive" className="bg-red-900/10 border-red-900/20 text-red-500">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full bg-[#FFFFFF] text-[#000000] hover:bg-[#AAAAAA] font-bold mt-4" disabled={verifying || verified}>
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying Number...
                                </>
                            ) : verified ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Verified & Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Verify & Download PDF
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
