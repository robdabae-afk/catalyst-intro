import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Please enter your full name." })
    .max(120, { message: "Name must be less than 120 characters." })
    .regex(/^[\p{L}\p{M}'\-.\s]+$/u, { message: "Name contains invalid characters." }),
  email: z
    .union([
      z.string().email({ message: "Please enter a valid email address." }),
      z.literal(""),
    ])
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, {
      message: "Use international format including country code, e.g. +15555555555.",
    }),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree before continuing." }),
  }),
});

type FormValues = z.infer<typeof schema>;

const EventSignIn = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "", consent: false as unknown as true },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      const { error: insertError } = await (supabase as any)
        .from("event_attendees")
        .insert({
          full_name: values.full_name,
          phone: values.phone,
          consent_accepted: true,
        });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center px-5 py-10">
      <main className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="text-[#FFFFFF]">CATALYST</span>
            <span className="text-[#AAAAAA] font-light"> INTRO</span>
          </h1>
          <p className="mt-1 text-[11px] tracking-[0.3em] text-[#666666] uppercase">
            Events
          </p>
        </header>

        <section className="rounded-2xl border border-[#222222] bg-[#111111] p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">You're checked in!</h2>
              <p className="mt-2 text-sm text-[#AAAAAA]">
                Welcome. Enjoy the event — our team will be in touch.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#888888] mb-3">
                  <Sparkles className="h-3 w-3" />
                  Welcome to Catalyst Events
                </div>
                <p className="text-sm text-[#CCCCCC] leading-relaxed">
                  You're moments away from meeting your next investor, portfolio company, or partner.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#FFFFFF]">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            autoComplete="name"
                            maxLength={120}
                            {...field}
                            className="bg-[#0A0A0A] border-[#2A2A2A] text-[#FFFFFF] placeholder:text-[#555555] h-11"
                          />
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
                          <Input
                            type="tel"
                            inputMode="tel"
                            placeholder="+1 555 555 5555"
                            autoComplete="tel"
                            maxLength={20}
                            {...field}
                            className="bg-[#0A0A0A] border-[#2A2A2A] text-[#FFFFFF] placeholder:text-[#555555] h-11"
                          />
                        </FormControl>
                        <p className="text-[11px] text-[#666666]">
                          Include your country code (e.g. +1 for US, +44 for UK).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-3">
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={(c) => field.onChange(c === true)}
                              className="mt-0.5 border-[#444444] data-[state=checked]:bg-[#FFFFFF] data-[state=checked]:text-[#000000]"
                            />
                          </FormControl>
                          <label className="text-xs text-[#BBBBBB] leading-relaxed cursor-pointer">
                            I agree that Catalyst Intro may securely store my name and phone number
                            for internal event purposes only. My information{" "}
                            <span className="text-[#FFFFFF] font-medium">
                              will not be sold, shared, or distributed to third parties.
                            </span>
                          </label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive" className="bg-red-900/10 border-red-900/30 text-red-400">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-[#FFFFFF] text-[#000000] hover:bg-[#DDDDDD] font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking you in...
                      </>
                    ) : (
                      "Check In"
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </section>

        <p className="mt-6 text-center text-[10px] text-[#555555]">
          © {new Date().getFullYear()} Catalyst Intro · Internal use only
        </p>
      </main>
    </div>
  );
};

export default EventSignIn;
