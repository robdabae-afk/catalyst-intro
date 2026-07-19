import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AppSignupForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    if (!name || !email || !password) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill all required fields." });
      setSubmitting(false);
      return;
    }
    const metadata = {
      name,
      user_type: "founder",
      legal_accepted_at: new Date().toISOString(),
      legal_accepted_ip: "unknown",
      referral_code: referralCode?.length >= 4 ? referralCode.toUpperCase() : null,
    };
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding`, data: metadata },
      });
      if (authError) throw authError;
      navigate("/onboarding");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Signup failed", description: err.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", padding: "24px", background: "#111111", display: "inline-flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "390px", minHeight: "844px", position: "relative", background: "#0A0A0D", overflow: "hidden", borderRadius: "40px", padding: "40px 30px" }}>
        {/* Back */}
        <div onClick={() => navigate(-1)} style={{ color: "#F6F5F2", fontSize: "14px", fontFamily: "Inter", cursor: "pointer", marginBottom: "32px", display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back
        </div>

        <div style={{ color: "#F6F5F2", fontSize: "24px", fontFamily: "Fraunces", fontWeight: 600, marginBottom: "8px" }}>Create your account</div>
        <div style={{ color: "#94908A", fontSize: "14px", fontFamily: "Inter", marginBottom: "32px" }}>Join Catalyst to connect with investors.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff", fontSize: "15px", fontFamily: "Inter", outline: "none", boxSizing: "border-box" }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff", fontSize: "15px", fontFamily: "Inter", outline: "none", boxSizing: "border-box" }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff", fontSize: "15px", fontFamily: "Inter", outline: "none", boxSizing: "border-box" }} />
          <input placeholder="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#fff", fontSize: "15px", fontFamily: "Inter", outline: "none", boxSizing: "border-box" }} />

          <button onClick={submit} disabled={submitting}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", background: "#F6F5F2", color: "#0A0A0C", fontSize: "15px", fontFamily: "Inter", fontWeight: 500, border: "none", cursor: "pointer", marginTop: "8px" }}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </div>

        <div onClick={() => navigate("/auth")} style={{ textAlign: "center", color: "#F6F5F2", fontSize: "15px", fontFamily: "Inter", marginTop: "24px", cursor: "pointer" }}>
          I already have an account
        </div>
      </div>
    </div>
  );
}
