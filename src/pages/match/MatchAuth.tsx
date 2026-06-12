import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { MatchLayout } from "@/match/MatchLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MatchAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") as "founder" | "investor") || "founder";
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"founder" | "investor">(initialRole);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/match/onboarding`,
            data: { match_role: role, match_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          // Create match profile
          await (supabase as any).from("match_profiles").insert({
            id: data.user!.id, role, name, email,
          });
          navigate("/match/onboarding");
        } else {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/match/event");
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Persist chosen role so MatchOnboarding can pick it up after the OAuth round-trip
      try { localStorage.setItem("match_pending_role", role); } catch {}
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/match/onboarding`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/match/onboarding");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MatchLayout showNav={false}>
      <div className="max-w-md mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl mb-6">{mode === "signup" ? "Join Match" : "Welcome back"}</h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label>I am a</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" variant={role === "founder" ? "default" : "outline"} onClick={() => setRole("founder")} className="flex-1">Founder</Button>
                  <Button type="button" variant={role === "investor" ? "default" : "outline"} onClick={() => setRole("investor")} className="flex-1">Investor</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
            {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-white/60 text-center">
          {mode === "signup" ? "Have an account?" : "New here?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="underline">
            {mode === "signup" ? "Sign in" : "Sign up"}
          </button>
        </p>
        <p className="mt-2 text-sm text-center"><Link to="/match" className="text-white/50 underline">← Back</Link></p>
      </div>
    </MatchLayout>
  );
}
