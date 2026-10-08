import { signupChecklist } from "@/lib/signup-checklist";
import { useProfileReview } from "@/hooks/useProfileReview";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Camera,
  Check,
  ChevronRight,
  Building2,
  Grid2X2,
  TrendingUp,
  BarChart2,
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  UserCheck,
  Loader2,
  Trophy,
  FileCheck2,
  Clock,
  IdCard,
  Users,
} from "lucide-react";
import { IdentityVerificationCapture } from "@/components/verification/IdentityVerificationCapture";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";

type UserType = "founder" | "investor";

type ChecklistItem = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  done: boolean;
  onClick?: () => void;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const review = useProfileReview();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>("founder");
  const [profile, setProfile] = useState<any>(null);
  const [roleProfile, setRoleProfile] = useState<any>(null);
  const [showPreBetaNotice, setShowPreBetaNotice] = useState(false);
  const [verificationCaptureOpen, setVerificationCaptureOpen] = useState(false);
  const { status: idVerificationStatus, refetch: refetchIdVerification } = useIdentityVerification(profile?.id ?? null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const ph = html.style.overflow;
    const pb = body.style.overflow;
    const bg = body.style.background;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.background = "#0A0A0D";
    return () => {
      html.style.overflow = ph;
      body.style.overflow = pb;
      body.style.background = bg;
    };
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth?redirect=/onboarding"); return; }

    let p: any = null;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) { p = data; break; }
      await new Promise((r) => setTimeout(r, 400));
    }
    setProfile(p);
    const type = (p?.user_type as UserType) ?? "founder";
    setUserType(type);

    if (type === "founder") {
      const { data: fp } = await supabase
        .from("founder_profiles").select("*").eq("profile_id", user.id).maybeSingle();
      setRoleProfile(fp);
    } else {
      const { data: ip } = await supabase
        .from("investor_profiles").select("*").eq("profile_id", user.id).maybeSingle();
      setRoleProfile(ip);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const items: ChecklistItem[] = signupChecklist(review.data?.profile ?? profile, review.data?.role ?? roleProfile, review.data?.verification ?? idVerificationStatus).map(item => ({
    ...item, desc: item.note ?? "Saved from your profile settings", icon: <UserCheck size={15} className="text-[#0B0B0B]" />,
    onClick: item.done ? undefined : () => navigate(item.to),
  }));

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0D" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0B0B0B" }} />
      </div>
    );
  }

  if (showPreBetaNotice) {
    return (
      <div
        className="h-[100dvh] overflow-hidden flex justify-center"
        style={{ background: "#0A0A0D", overscrollBehavior: "none" }}
      >
        <div className="w-full max-w-[390px] h-full relative flex flex-col overflow-hidden">
          {/* Glowing orbs */}
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              left: 130,
              top: 90,
              opacity: 0.24,
              background: "#0B0B0B",
              borderRadius: "50%",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              left: -70,
              top: 470,
              opacity: 0.28,
              background: "#0B0B0B",
              borderRadius: "50%",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(11,11,11,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
              }}
            >
              <Clock size={28} style={{ color: "#0B0B0B" }} />
            </div>

            <p
              style={{
                color: "#0B0B0B",
                fontSize: 11.5,
                fontFamily: "Inter",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "1.84px",
                marginBottom: 10,
              }}
            >
              Pre-beta
            </p>

            <h1
              style={{
                color: "#0B0B0B",
                fontSize: 26,
                fontFamily: "'Schibsted Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                lineHeight: 1.25,
                marginBottom: 12,
                maxWidth: 300,
              }}
            >
              Catalyst is currently in pre-beta
            </h1>

            <p
              style={{
                color: "#74746D",
                fontSize: 14,
                fontFamily: "Inter",
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 300,
                marginBottom: 28,
              }}
            >
              Your account is pending approval — you can finish setting up your profile in the meantime.
            </p>

            <button
              onClick={() => setShowPreBetaNotice(false)}
              style={{
                width: "100%",
                maxWidth: 330,
                height: 54,
                background: "#0B0B0B",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                color: "#0A0A0C",
                fontSize: 15,
                fontFamily: "Inter",
                fontWeight: 500,
              }}
              className="hover:opacity-90 active:opacity-85 transition-opacity"
            >
              Continue to profile setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const eyebrow = userType === "founder" ? "Founder · Setup" : "Investor · Setup";

  return (
    <div
      className="h-[100dvh] overflow-hidden flex justify-center"
      style={{ background: "#0A0A0D", overscrollBehavior: "none" }}
    >
      <div className="w-full max-w-[390px] h-full relative flex flex-col overflow-hidden">
        {/* Glowing orbs */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            left: 130,
            top: 90,
            opacity: 0.24,
            background: "#0B0B0B",
            borderRadius: "50%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            left: -70,
            top: 470,
            opacity: 0.28,
            background: "#0B0B0B",
            borderRadius: "50%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden">
          {/* Header */}
          <div className="pt-12 pb-4">
            <p
              style={{
                color: "#0B0B0B",
                fontSize: 11.5,
                fontFamily: "Inter",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "1.84px",
                marginBottom: 6,
              }}
            >
              {eyebrow}
            </p>
            <h1
              style={{
                color: "#0B0B0B",
                fontSize: 26,
                fontFamily: "'Schibsted Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                lineHeight: 1.15,
                marginBottom: 6,
              }}
            >
              Finish your profile
            </h1>
            <p style={{ color: "#74746D", fontSize: 13, fontFamily: "Inter", fontWeight: 400, lineHeight: 1.5 }}>
              {review.approved ? "Your profile is approved. You can keep your details up to date here." : "Your profile is under review. Please check back later. Complete any missing items below."}
            </p>
          </div>

          {/* Progress card */}
          <div style={glassCard({ borderRadius: 18, padding: "15px 18px", marginBottom: 12 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ color: "#3A3A36", fontSize: 13, fontFamily: "Inter" }}>Profile strength</span>
              <span style={{ color: "#fff", fontSize: 26, fontFamily: "Inter", fontWeight: 700, letterSpacing: "0.03em" }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "rgba(11,11,11,0.072)",
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0B0B0B 0%, #0B0B0B 100%)",
                  borderRadius: 99,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <p style={{ color: "#74746D", fontSize: 11.5, fontFamily: "Inter" }}>
              {doneCount} of {total} complete
            </p>
          </div>

          {/* Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
            {items.map((item) => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </div>

          {/* Incentive footer */}
          <div style={glassCard({ borderRadius: 14, padding: "12px 16px" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Trophy size={18} style={{ color: "#0B0B0B", flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, fontFamily: "Inter", lineHeight: "17.5px" }}>
                <span style={{ color: "#3A3A36" }}>Reach </span>
                <span style={{ color: "#0B0B0B", fontWeight: 600 }}>100%</span>
                <span style={{ color: "#3A3A36" }}>. Admin approval is required for platform access.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <IdentityVerificationCapture
        open={verificationCaptureOpen}
        onClose={() => setVerificationCaptureOpen(false)}
        userId={profile?.id ?? null}
        onSubmitted={refetchIdVerification}
      />
    </div>
  );
}

function glassCard(style: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(11,11,11,0.054)",
    boxShadow: "inset 0px 1px 0px 1px rgba(11,11,11,0.12)",
    borderRadius: 14,
    outline: "1px solid rgba(11,11,11,0.12)",
    backdropFilter: "blur(9px)",
    WebkitBackdropFilter: "blur(9px)",
    ...style,
  };
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Wrapper = item.onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={item.onClick}
      style={{ ...glassCard({ borderRadius: 14, padding: "10px 14px" }), width: "100%", textAlign: "left", cursor: item.onClick ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon box */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: item.done
              ? "rgba(11,11,11,0.1)"
              : "rgba(11,11,11,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {item.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: item.done ? "#74746D" : "#0B0B0B",
              fontSize: 13.5,
              fontFamily: "Inter",
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {item.title}
          </p>
          <p style={{ color: "#74746D", fontSize: 11.5, fontFamily: "Inter" }}>
            {item.desc}
          </p>
        </div>

        {/* Status indicator */}
        {item.done ? (
          <div
            style={{
              width: 25,
              height: 25,
              borderRadius: "50%",
              background: "#0B0B0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={13} style={{ color: "#FFFFFF", strokeWidth: 2.5 }} />
          </div>
        ) : (
          <ChevronRight size={18} style={{ color: "#74746D", flexShrink: 0 }} />
        )}
      </div>
    </Wrapper>
  );
}
