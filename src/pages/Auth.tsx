import { initialAuthMode, type AuthMode } from "@/lib/auth-mode";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import "@/features/features.css";
import "@/features/auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<AuthMode>(() => initialAuthMode(window.location.search));
  const [isLoading, setIsLoading] = useState(false);
  
  // Password reset states
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isRecoveryUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    return (
      searchParams.get("recovery") === "true" ||
      hashParams.get("type") === "recovery" ||
      hashParams.get("recovery") === "true" ||
      window.location.hash.includes("recovery=true")
    );
  };

  useEffect(() => {
    // Determine recovery mode from URL (query + hash)
    setIsRecoveryMode(isRecoveryUrl());

    // Listen for auth events (must stay synchronous)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        return;
      }

      // Redirect signed-in users (but never during recovery flows)
      if (event === "SIGNED_IN" && session && !isRecoveryUrl()) {
        navigate("/dashboard");
      }
    });

    // Initialize session / exchange code if needed (no Supabase calls inside callback)
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        if (!isRecoveryUrl()) navigate("/dashboard");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        // PKCE recovery links include ?code=...
        await supabase.auth.exchangeCodeForSession(code);
        setIsRecoveryMode(true);
      }
    })();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // updateUser requires an active recovery session; if missing, try exchanging ?code=... first.
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          ({ data: { session } } = await supabase.auth.getSession());
        }
      }

      if (!session) {
        toast({
          title: "Reset link expired",
          description: "Your password reset session is missing. Please open the newest reset link from your email and try again.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully reset. You can now log in.",
      });

      // Clear recovery mode and redirect
      setIsRecoveryMode(false);
      setNewPassword("");
      setConfirmPassword("");

      // Clear recovery params from URL
      window.history.replaceState(null, "", window.location.pathname);

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message === "Invalid login credentials") {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        }
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !name.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to create an account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            name: name.trim(),
            user_type: "founder", // Default to founder, onboarding flow allows changing
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
        
        if (data.session) {
          navigate("/onboarding");
        } else {
          // If email confirmation is required, switch to signin mode
          setMode("signin");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/onboarding`,
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/onboarding`,
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast({
        title: "Apple sign-in failed",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const field = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="au-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} disabled={isLoading} required {...props} />
    </div>
  );

  const shell = (body: React.ReactNode) => (
    <div className="cf cf-ob">
      <div className="ob ob-auth">
        <div className="ob-top">
          <button type="button" className="ob-back" onClick={() => navigate("/waitlist")} aria-label="Back">Back</button>
        </div>
        <div className="ob-body">{body}</div>
        <p className="ob-legal">By continuing you agree to our <Link to="/legal/terms">Terms</Link> and <Link to="/legal/privacy">Privacy notice</Link>.</p>
      </div>
    </div>
  );

  // Password Reset Form View
  if (isRecoveryMode) {
    return shell(<>
      <div className="ob-head">
        <div className="ob-mark" aria-hidden><i /></div>
        <h1>Set a new password.</h1>
        <p>Pick something you haven't used here before.</p>
      </div>
      <form className="au-form" onSubmit={handlePasswordReset}>
        {field("au-new-password", "New password", { type: "password", autoComplete: "new-password", value: newPassword, onChange: (e) => setNewPassword(e.target.value) })}
        {field("au-confirm-password", "Confirm password", { type: "password", autoComplete: "new-password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) })}
        <button type="submit" className="btn" disabled={isLoading}>{isLoading ? "Updating..." : "Update password"}</button>
      </form>
      <p className="au-swap">Remember it? <button type="button" className="ob-link" onClick={() => setIsRecoveryMode(false)}>Sign in</button></p>
    </>);
  }

  const signup = mode === "signup";

  // Normal Sign In / Sign Up Form View
  return shell(<>
    <div className="ob-head">
      <div className="ob-mark" aria-hidden><i /></div>
      <h1>{signup ? "Create your account." : "Welcome back."}</h1>
      <p>{signup ? "Save your watchlist and RSVPs across devices." : "Sign in to pick up where you left off."}</p>
    </div>
    <form className="au-form" onSubmit={signup ? handleSignUp : handleLogin}>
      {signup && field("au-name", "Full name", { type: "text", autoComplete: "name", placeholder: "Jane Doe", value: name, onChange: (e) => setName(e.target.value) })}
      {field("au-email", "Email", { type: "email", autoComplete: "email", inputMode: "email", autoCapitalize: "none", spellCheck: false, placeholder: "name@company.com", value: email, onChange: (e) => setEmail(e.target.value) })}
      {field("au-password", "Password", { type: "password", autoComplete: signup ? "new-password" : "current-password", value: password, onChange: (e) => setPassword(e.target.value) })}
      {!signup && <button type="button" className="au-forgot" onClick={() => navigate("/forgot-password")}>Forgot password?</button>}
      <button type="submit" className="btn" disabled={isLoading}>{isLoading ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
    </form>
    <div className="au-or">or continue with</div>
    <div className="au-social">
      <button type="button" className="btn ghost" onClick={handleGoogleLogin} disabled={isLoading}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2045c0-.6391-.0573-1.2518-.1645-1.8414H9v3.4814h4.8445c-.2091 1.125-.8373 2.0782-1.7809 2.7182v2.2582h2.8736c1.6864-1.5518 2.6564-3.84 2.6564-6.6164z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.4691-.8064 5.9564-2.1809l-2.8736-2.2582c-.8064.54-1.8373.8591-3.0828.8591-2.3718 0-4.3836-1.6028-5.0986-3.7573H.9564v2.3318C2.4364 15.9832 5.4818 18 9 18z" fill="#34A853"/>
          <path d="M3.9014 10.6627c-.18-.54-.2836-1.1164-.2836-1.7127s.1036-1.1727.2836-1.7127V5.5055H.9564C.3473 6.72 0 8.0718 0 9.5s.3473 2.78.9564 3.9945l2.945-2.8318z" fill="#FBBC05"/>
          <path d="M9 3.58c1.3218 0 2.5073.4545 3.44 1.3455l2.5818-2.58C13.4636.8918 11.4255 0 9 0 5.4818 0 2.4364 2.0168.9564 4.5055l2.945 2.8318C4.6164 5.1828 6.6282 3.58 9 3.58z" fill="#EA4335"/>
        </svg>Google
      </button>
      <button type="button" className="btn ghost" onClick={handleAppleLogin} disabled={isLoading}>
        <svg width="16" height="18" viewBox="0 0 384 512" aria-hidden="true">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill="currentColor"/>
        </svg>Apple
      </button>
    </div>
    <p className="au-swap">{signup ? "Already have an account?" : "Don't have an account?"} <button type="button" className="ob-link" onClick={() => setMode(signup ? "signin" : "signup")}>{signup ? "Sign in" : "Create account"}</button></p>
  </>);
};

export default Auth;
