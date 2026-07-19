import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AppSignup() {
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
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill all required fields.",
      });
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
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", padding: "24px", background: "linear-gradient(0deg, var(--color-grey-7, #111111) 0%, var(--color-grey-7, #111111) 100%), var(--color-white-solid, white)", display: "inline-flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "390px", height: "844px", position: "relative", background: "var(--color-blue-5, #0A0A0D)", overflow: "hidden", borderRadius: "40px" }}>
        {/* Header */}
        <div style={{ width: "330px", height: "52px", paddingTop: "8px", left: "30px", top: "744px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
          <div style={{ alignSelf: "stretch", height: "44px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", color: "var(--color-grey-96, #F6F5F2)", fontSize: "15px", fontFamily: "Inter", fontWeight: 400 }}>
              I already have an account
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div style={{ width: "320px", height: "320px", left: "-30px", top: "120px", position: "absolute", opacity: 0.28, background: "var(--color-yellow-47, #C6A02C)", boxShadow: "10px 10px 10px", borderRadius: "160px", filter: "blur(5px)" }}></div>
        <div style={{ width: "300px", height: "300px", left: "160px", top: "220px", position: "absolute", opacity: 0.36, background: "var(--color-yellow-47, #C6A02C)", boxShadow: "10px 10px 10px", borderRadius: "150px", filter: "blur(5px)" }}></div>

        {/* Logo and tagline */}
        <div style={{ width: "390px", left: 0, top: "250px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", gap: 8 }}>
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column" }}>
              <span style={{ color: "var(--color-grey-96, #F6F5F2)", fontSize: "36px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "6.48px" }}>CAT</span>
              <span style={{ color: "var(--color-yellow-47, #C6A02C)", fontSize: "36px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "6.48px" }}>A</span>
              <span style={{ color: "var(--color-grey-96, #F6F5F2)", fontSize: "36px", fontFamily: "Inter", fontWeight: 600, letterSpacing: "6.48px" }}>LYST</span>
            </div>
          </div>
          <div style={{ alignSelf: "stretch", paddingTop: "4px", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center" }}>
            <div style={{ textAlign: "center", color: "var(--color-grey-96, #F6F5F2)", fontSize: "10px", fontFamily: "Inter", fontWeight: 400, textTransform: "uppercase", letterSpacing: "2.20px" }}>Shaping the future of retail investing</div>
          </div>
          <div style={{ width: "120px", height: "2px", background: "var(--color-yellow-47, #C6A02C)" }}></div>
        </div>

        {/* Main tagline */}
        <div style={{ width: "330px", paddingBottom: "14px", left: "30px", top: "491.94px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", color: "var(--color-grey-96, #F6F5F2)", fontSize: "38px", fontFamily: "Fraunces", fontWeight: 600, lineHeight: "41px" }}>
              Where founders<br/>meet capital.
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ width: "300px", maxWidth: "300px", paddingBottom: "30px", left: "30px", top: "588px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
          <div style={{ width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", color: "var(--color-grey-56, #94908A)", fontSize: "15px", fontFamily: "Inter", fontWeight: 400, lineHeight: "24px" }}>
              Curated intros between founders and<br/>investors who actually fit. No noise, no<br/>cold outreach.
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ width: "330px", height: "auto", left: "30px", top: "690px", position: "absolute", background: "var(--color-grey-96, #F6F5F2)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "24px" }}>
          <input id="fullName" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #222", background: "#111", color: "#fff" }} />
          <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #222", background: "#111", color: "#fff" }} />
          <input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #222", background: "#111", color: "#fff" }} />
          <input id="referralCode" placeholder="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #222", background: "#111", color: "#fff" }} />
          <button type="submit" disabled={submitting} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--color-grey-4, #0A0A0C)", color: "var(--color-grey-96, #F6F5F2)", fontSize: "15px", fontFamily: "Inter", fontWeight: 500 }}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
