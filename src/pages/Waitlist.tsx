import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Zap, Loader2, CheckCircle2 } from "lucide-react";

const Waitlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    user_type: "" as "founder" | "investor" | "",
    linkedin_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.user_type) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("waitlist_signups").insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        user_type: form.user_type,
        linkedin_url: form.linkedin_url.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You're already on the list!", description: "We have your email on file." });
          setSubmitted(true);
          return;
        }
        throw error;
      }

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">You're on the list.</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            We'll reach out when your spot opens. In the meantime, want to skip the line?
          </p>
          <Button
            onClick={() => navigate("/early-access")}
            className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base"
          >
            <Zap className="w-4 h-4 mr-2" />
            Get Early Access — $29
          </Button>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Private Beta</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Join the Waitlist
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Catalyst is currently in private development. Join the waitlist and we'll reach out when your spot opens — or skip the line for $29.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm font-medium">Full Name *</Label>
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm font-medium">Email Address *</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm font-medium">I am a... *</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["founder", "investor"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, user_type: type })}
                  className={`h-12 rounded-xl border text-sm font-semibold capitalize transition-all ${
                    form.user_type === type
                      ? "bg-amber-500 border-amber-500 text-black"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm font-medium">
              LinkedIn URL <span className="text-zinc-600 font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="linkedin.com/in/yourname"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 h-12"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-zinc-100 text-black font-bold text-base"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Join the Waitlist
          </Button>
        </form>

        {/* Early Access Upsell */}
        <div className="border border-amber-500/20 rounded-2xl p-5 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500">Skip the line</span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Get immediate access during development for a one-time $29 founding member fee.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/early-access")}
            className="w-full h-10 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-sm font-semibold"
          >
            Get Early Access — $29
          </Button>
        </div>

        <p className="text-center text-zinc-600 text-sm">
          Already have an account?{" "}
          <button onClick={() => navigate("/auth")} className="text-zinc-400 hover:text-white underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Waitlist;
