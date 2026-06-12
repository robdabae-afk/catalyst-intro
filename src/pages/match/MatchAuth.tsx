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

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-xs text-white/50 uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        <Button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          variant="outline"
          className="w-full bg-white text-black hover:bg-white/90 border-white/20 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 7 29.2 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43c5.1 0 9.7-1.9 13.2-5.1l-6.1-5.2C29.1 34.2 26.7 35 24 35c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43 24 43z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.1 5.2C40.9 35.5 43.5 30.2 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
          </svg>
          Continue with Google
        </Button>
        <p className="mt-3 text-[11px] text-center text-white/40">
          LinkedIn sign-in isn't available yet — use email or Google for now.
        </p>

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
