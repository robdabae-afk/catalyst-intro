import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import "@/features/features.css";
import "@/features/auth.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // Use query param (not hash) so the recovery token can safely use the URL hash.
        redirectTo: `${window.location.origin}/auth?recovery=true`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setEmail("");
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

  return (
    <div className="cf cf-ob">
      <div className="ob ob-auth">
        <div className="ob-top">
          <button type="button" className="ob-back" onClick={() => navigate("/auth")} aria-label="Back to sign in">Back</button>
        </div>
        <div className="ob-body">
          <div className="ob-head">
            <div className="ob-mark" aria-hidden><i /></div>
            <h1>Reset your password.</h1>
            <p>Enter your email and we'll send you a reset link.</p>
          </div>
          <form className="au-form" onSubmit={handleForgotPassword}>
            <div className="au-field">
              <label htmlFor="reset-email">Email</label>
              <input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <button type="submit" className="btn" disabled={isLoading}>{isLoading ? "Sending..." : "Send reset link"}</button>
          </form>
          <p className="au-swap">Remember it? <button type="button" className="ob-link" onClick={() => navigate("/auth")}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
