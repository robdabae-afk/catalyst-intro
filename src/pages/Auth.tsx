import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
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

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
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

  // Password Reset Form View
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen w-full bg-[#111111] flex items-center justify-center p-4">
        {/* Outer wrapper */}
        <div style={{
          width: "487px",
          padding: "24px",
          background: "linear-gradient(0deg, #111111 0%, #111111 100%)",
          justifyContent: "center",
          alignItems: "flex-start",
          display: "inline-flex",
          borderRadius: "48px",
        }}>
          {/* Phone container */}
          <div style={{
            width: "390px",
            maxWidth: "100%",
            height: "844px",
            paddingLeft: "30px",
            paddingRight: "30px",
            position: "relative",
            background: "#0A0A0D",
            overflow: "hidden",
            borderRadius: "40px",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "inline-flex"
          }}>
            {/* Background blobs */}
            <div style={{ width: "300px", height: "300px", left: "130px", top: "180px", position: "absolute", opacity: 0.24, background: "#C6A02C", boxShadow: "0px 10px 30px rgba(198, 160, 44, 0.4)", borderRadius: "150px", filter: "blur(60px)" }}></div>
            <div style={{ width: "300px", height: "300px", left: "-70px", top: "380px", position: "absolute", opacity: 0.34, background: "#C6A02C", boxShadow: "0px 10px 30px rgba(198, 160, 44, 0.4)", borderRadius: "150px", filter: "blur(60px)" }}></div>
            
            {/* Logo */}
            <div style={{ width: "390px", left: 0, top: "60px", position: "absolute", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", display: "flex" }}>
              <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ color: "#F6F5F2", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>CAT</span>
                <span style={{ color: "#C6A02C", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>A</span>
                <span style={{ color: "#F6F5F2", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>LYST</span>
              </div>
            </div>

            {/* Header Text */}
            <div style={{ alignSelf: "stretch", paddingTop: "150px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
              <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: "6px", display: "flex" }}>
                <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                  <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#C6A02C", fontSize: "11.50px", fontFamily: "Inter", fontWeight: 400, textTransform: "uppercase", letterSpacing: "1.84px", wordWrap: "break-word" }}>Security</div>
                </div>
                <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                  <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#F6F5F2", fontSize: "30px", fontFamily: "Fraunces", fontWeight: 600, wordWrap: "break-word" }}>Set New Password</div>
                </div>
                <div style={{ alignSelf: "stretch", paddingTop: "2px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                  <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#94908A", fontSize: "14px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>Enter your new password details below.</div>
                </div>
              </div>
            </div>

            {/* Inputs & Form */}
            <form onSubmit={handlePasswordReset} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ alignSelf: "stretch", paddingTop: "26px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: "12px", display: "flex" }}>
                
                {/* New Password input */}
                <div style={{
                  alignSelf: "stretch",
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  background: "rgba(255, 255, 255, 0.06)",
                  boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                  borderRadius: "16px",
                  outline: "1px rgba(255, 255, 255, 0.14) solid",
                  outlineOffset: "-1px",
                  backdropFilter: "blur(9px)",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "12px",
                  display: "inline-flex"
                }}>
                  <div data-variant="3" style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "10.50px", height: "6.75px", left: "3.75px", top: "8.25px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                    <div style={{ width: "6px", height: "5.25px", left: "6px", top: "3px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                  </div>
                  <div style={{ flex: "1 1 0", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex" }}>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent border-none outline-none text-[#F6F5F2] placeholder-[#94908A] text-[15px] font-sans focus:ring-0 focus:outline-none"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password input */}
                <div style={{
                  alignSelf: "stretch",
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  background: "rgba(255, 255, 255, 0.06)",
                  boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                  borderRadius: "16px",
                  outline: "1px rgba(255, 255, 255, 0.14) solid",
                  outlineOffset: "-1px",
                  backdropFilter: "blur(9px)",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "12px",
                  display: "inline-flex"
                }}>
                  <div data-variant="3" style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "10.50px", height: "6.75px", left: "3.75px", top: "8.25px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                    <div style={{ width: "6px", height: "5.25px", left: "6px", top: "3px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                  </div>
                  <div style={{ flex: "1 1 0", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex" }}>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent border-none outline-none text-[#F6F5F2] placeholder-[#94908A] text-[15px] font-sans focus:ring-0 focus:outline-none"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Submit button */}
              <div style={{ alignSelf: "stretch", height: "76px", paddingTop: "22px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    alignSelf: "stretch",
                    height: "54px",
                    background: "#F6F5F2",
                    borderRadius: "16px",
                    justifyContent: "center",
                    alignItems: "center",
                    display: "inline-flex",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    width: "100%"
                  }}
                  className="hover:opacity-90 active:opacity-85 transition-opacity"
                >
                  <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column", color: "#0A0A0C", fontSize: "15px", fontFamily: "Inter", fontWeight: 500, wordWrap: "break-word" }}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </div>
                </button>
              </div>
            </form>

            {/* Back to sign in link */}
            <div style={{ alignSelf: "stretch", paddingTop: "26px", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", display: "flex" }}>
              <button
                type="button"
                onClick={() => setIsRecoveryMode(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                className="hover:opacity-90 transition-opacity"
              >
                <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column" }}>
                  <span>
                    <span style={{ color: "#94908A", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 400 }}>Remember password? </span>
                    <span style={{ color: "#F6F5F2", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 500 }}>Sign in</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Top-left back button */}
            <button
              type="button"
              onClick={() => navigate("/waitlist")}
              style={{
                width: "40px",
                height: "40px",
                left: "30px",
                top: "56px",
                position: "absolute",
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                borderRadius: "20px",
                outline: "1px rgba(255, 255, 255, 0.14) solid",
                outlineOffset: "-1px",
                backdropFilter: "blur(9px)",
                justifyContent: "center",
                alignItems: "center",
                display: "inline-flex",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-white/10 active:bg-white/5 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#F6F5F2]" />
            </button>

          </div>
        </div>
      </div>
    );
  }

  // Normal Sign In / Sign Up Form View
  return (
    <div className="min-h-screen w-full bg-[#111111] flex items-center justify-center p-4">
      {/* Outer wrapper */}
      <div style={{
        width: "487px",
        padding: "24px",
        background: "linear-gradient(0deg, #111111 0%, #111111 100%)",
        justifyContent: "center",
        alignItems: "flex-start",
        display: "inline-flex",
        borderRadius: "48px",
      }}>
        {/* Phone container */}
        <div style={{
          width: "390px",
          maxWidth: "100%",
          height: "844px",
          paddingLeft: "30px",
          paddingRight: "30px",
          position: "relative",
          background: "#0A0A0D",
          overflow: "hidden",
          borderRadius: "40px",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          display: "inline-flex"
        }}>
          {/* Background blobs */}
          <div style={{ width: "300px", height: "300px", left: "130px", top: "180px", position: "absolute", opacity: 0.24, background: "#C6A02C", boxShadow: "0px 10px 30px rgba(198, 160, 44, 0.4)", borderRadius: "150px", filter: "blur(60px)" }}></div>
          <div style={{ width: "300px", height: "300px", left: "-70px", top: "380px", position: "absolute", opacity: 0.34, background: "#C6A02C", boxShadow: "0px 10px 30px rgba(198, 160, 44, 0.4)", borderRadius: "150px", filter: "blur(60px)" }}></div>
          
          {/* Logo */}
          <div style={{ width: "390px", left: 0, top: "60px", position: "absolute", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", display: "flex" }}>
            <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "row", alignItems: "center" }}>
              <span style={{ color: "#F6F5F2", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>CAT</span>
              <span style={{ color: "#C6A02C", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>A</span>
              <span style={{ color: "#F6F5F2", fontSize: "20px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "3.20px", wordWrap: "break-word" }}>LYST</span>
            </div>
          </div>

          {/* Header Text */}
          <div style={{ alignSelf: "stretch", paddingTop: "150px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
            <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: "6px", display: "flex" }}>
              <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#C6A02C", fontSize: "11.50px", fontFamily: "Inter", fontWeight: 400, textTransform: "uppercase", letterSpacing: "1.84px", wordWrap: "break-word" }}>
                  {mode === "signup" ? "Get started" : "Welcome back"}
                </div>
              </div>
              <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#F6F5F2", fontSize: "30px", fontFamily: "Fraunces", fontWeight: 600, wordWrap: "break-word" }}>
                  {mode === "signup" ? "Create your account" : "Sign in to account"}
                </div>
              </div>
              <div style={{ alignSelf: "stretch", paddingTop: "2px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
                <div style={{ alignSelf: "stretch", justifyContent: "center", display: "flex", flexDirection: "column", color: "#94908A", fontSize: "14px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>
                  {mode === "signup" ? "Join the network in under a minute." : "Welcome back. Enter your credentials."}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={mode === "signup" ? handleSignUp : handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ alignSelf: "stretch", paddingTop: "26px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: "12px", display: "flex" }}>
              
              {/* Full name input (only for signup) */}
              {mode === "signup" && (
                <div style={{
                  alignSelf: "stretch",
                  height: "56px",
                  paddingLeft: "10px",
                  paddingRight: "16px",
                  background: "rgba(255, 255, 255, 0.06)",
                  boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                  borderRadius: "16px",
                  outline: "1px rgba(255, 255, 255, 0.14) solid",
                  outlineOffset: "-1px",
                  backdropFilter: "blur(9px)",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "12px",
                  display: "inline-flex"
                }}>
                  <div data-variant="1" style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "6px", height: "6px", left: "6px", top: "3px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                    <div style={{ width: "12px", height: "4.50px", left: "3px", top: "11.25px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                  </div>
                  <div style={{ flex: "1 1 0", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex" }}>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent border-none outline-none text-[#F6F5F2] placeholder-[#94908A] text-[15px] font-sans focus:ring-0 focus:outline-none"
                      required={mode === "signup"}
                    />
                  </div>
                </div>
              )}

              {/* Email input */}
              <div style={{
                alignSelf: "stretch",
                height: "56px",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                borderRadius: "16px",
                outline: "1px rgba(255, 255, 255, 0.14) solid",
                outlineOffset: "-1px",
                backdropFilter: "blur(9px)",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
                display: "inline-flex"
              }}>
                <div data-variant="2" style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
                  <div style={{ width: "12px", height: "9px", left: "3px", top: "4.50px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                </div>
                <div style={{ flex: "1 1 0", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex" }}>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent border-none outline-none text-[#F6F5F2] placeholder-[#94908A] text-[15px] font-sans focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password input */}
              <div style={{
                alignSelf: "stretch",
                height: "56px",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                borderRadius: "16px",
                outline: "1px rgba(255, 255, 255, 0.14) solid",
                outlineOffset: "-1px",
                backdropFilter: "blur(9px)",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "12px",
                display: "inline-flex"
              }}>
                <div data-variant="3" style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
                  <div style={{ width: "10.50px", height: "6.75px", left: "3.75px", top: "8.25px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                  <div style={{ width: "6px", height: "5.25px", left: "6px", top: "3px", position: "absolute", outline: "1.28px #94908A solid", outlineOffset: "-0.64px" }}></div>
                </div>
                <div style={{ flex: "1 1 0", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex" }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent border-none outline-none text-[#F6F5F2] placeholder-[#94908A] text-[15px] font-sans focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Forgot password link (only for signin) */}
              {mode === "signin" && (
                <div style={{ alignSelf: "flex-end", marginTop: "-4px" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-[#94908A] hover:text-[#F6F5F2] transition-colors underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

            </div>

            {/* Submit button */}
            <div style={{ alignSelf: "stretch", height: "76px", paddingTop: "22px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  alignSelf: "stretch",
                  height: "54px",
                  background: "#F6F5F2",
                  borderRadius: "16px",
                  justifyContent: "center",
                  alignItems: "center",
                  display: "inline-flex",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  width: "100%"
                }}
                className="hover:opacity-90 active:opacity-85 transition-opacity"
              >
                <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column", color: "#0A0A0C", fontSize: "15px", fontFamily: "Inter", fontWeight: 500, wordWrap: "break-word" }}>
                  {isLoading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
                </div>
              </button>
            </div>
          </form>

          {/* Social login divider */}
          <div style={{ alignSelf: "stretch", paddingTop: "22px", paddingBottom: "22px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex" }}>
            <div style={{ alignSelf: "stretch", justifyContent: "flex-start", alignItems: "center", gap: "12px", display: "inline-flex" }}>
              <div style={{ flex: "1 1 0", height: "1px", background: "rgba(255, 255, 255, 0.14)" }}></div>
              <div style={{ justifyContent: "center", display: "flex", flexDirection: "column", color: "#94908A", fontSize: "12px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>or continue with</div>
              <div style={{ flex: "1 1 0", height: "1px", background: "rgba(255, 255, 255, 0.14)" }}></div>
            </div>
          </div>

          {/* Social login buttons */}
          <div style={{ alignSelf: "stretch", justifyContent: "center", alignItems: "flex-start", gap: "12px", display: "inline-flex" }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                flex: "1 1 0",
                height: "52px",
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                borderRadius: "14px",
                outline: "1px rgba(255, 255, 255, 0.14) solid",
                outlineOffset: "-1px",
                backdropFilter: "blur(9px)",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                display: "flex",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-white/10 active:bg-white/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.64 9.2045c0-.6391-.0573-1.2518-.1645-1.8414H9v3.4814h4.8445c-.2091 1.125-.8373 2.0782-1.7809 2.7182v2.2582h2.8736c1.6864-1.5518 2.6564-3.84 2.6564-6.6164z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.4691-.8064 5.9564-2.1809l-2.8736-2.2582c-.8064.54-1.8373.8591-3.0828.8591-2.3718 0-4.3836-1.6028-5.0986-3.7573H.9564v2.3318C2.4364 15.9832 5.4818 18 9 18z" fill="#34A853"/>
                <path d="M3.9014 10.6627c-.18-.54-.2836-1.1164-.2836-1.7127s.1036-1.1727.2836-1.7127V5.5055H.9564C.3473 6.72 0 8.0718 0 9.5s.3473 2.78.9564 3.9945l2.945-2.8318z" fill="#FBBC05"/>
                <path d="M9 3.58c1.3218 0 2.5073.4545 3.44 1.3455l2.5818-2.58C13.4636.8918 11.4255 0 9 0 5.4818 0 2.4364 2.0168.9564 4.5055l2.945 2.8318C4.6164 5.1828 6.6282 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column", color: "#F6F5F2", fontSize: "14px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>Google</div>
            </button>
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={isLoading}
              style={{
                flex: "1 1 0",
                height: "52px",
                background: "rgba(255, 255, 255, 0.06)",
                boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
                borderRadius: "14px",
                outline: "1px rgba(255, 255, 255, 0.14) solid",
                outlineOffset: "-1px",
                backdropFilter: "blur(9px)",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                display: "flex",
                border: "none",
                cursor: "pointer",
              }}
              className="hover:bg-white/10 active:bg-white/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 384 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill="#F6F5F2"/>
              </svg>
              <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column", color: "#F6F5F2", fontSize: "14px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>Apple</div>
            </button>
          </div>

          {/* Toggle link */}
          <div style={{ alignSelf: "stretch", paddingTop: "26px", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", display: "flex" }}>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              className="hover:opacity-90 transition-opacity"
            >
              <div style={{ textAlign: "center", justifyContent: "center", display: "flex", flexDirection: "column" }}>
                {mode === "signup" ? (
                  <span>
                    <span style={{ color: "#94908A", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>Already have an account? </span>
                    <span style={{ color: "#F6F5F2", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 500, wordWrap: "break-word" }}>Sign in</span>
                  </span>
                ) : (
                  <span>
                    <span style={{ color: "#94908A", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 400, wordWrap: "break-word" }}>Don't have an account? </span>
                    <span style={{ color: "#F6F5F2", fontSize: "13.50px", fontFamily: "Inter", fontWeight: 500, wordWrap: "break-word" }}>Create account</span>
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Top-left back button */}
          <button
            type="button"
            onClick={() => navigate("/waitlist")}
            style={{
              width: "40px",
              height: "40px",
              left: "30px",
              top: "56px",
              position: "absolute",
              background: "rgba(255, 255, 255, 0.06)",
              boxShadow: "0px 1px 0px 1px rgba(255, 255, 255, 0.25) inset",
              borderRadius: "20px",
              outline: "1px rgba(255, 255, 255, 0.14) solid",
              outlineOffset: "-1px",
              backdropFilter: "blur(9px)",
              justifyContent: "center",
              alignItems: "center",
              display: "inline-flex",
              border: "none",
              cursor: "pointer",
            }}
            className="hover:bg-white/10 active:bg-white/5 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F5F2]" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default Auth;
