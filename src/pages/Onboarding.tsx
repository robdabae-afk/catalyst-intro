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
  ShieldCheck,
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  UserCheck,
  Loader2,
  Trophy,
  FileCheck2,
} from "lucide-react";

type UserType = "founder" | "investor";

type ChecklistItem = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  done: boolean;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>("founder");
  const [profile, setProfile] = useState<any>(null);
  const [roleProfile, setRoleProfile] = useState<any>(null);

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

  const founderItems = (): ChecklistItem[] => [
    {
      id: "account",
      title: "Account created",
      desc: "Name, email, password",
      icon: <UserCheck size={15} className="text-[#C6A02C]" />,
      done: true,
    },
    {
      id: "startup",
      title: "Startup basics",
      desc: "Startup name, HQ location",
      icon: <Building2 size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.startup_name && roleProfile.startup_name !== "Untitled",
    },
    {
      id: "avatar",
      title: "Profile photo",
      desc: "Add one — recommended",
      icon: <Camera size={15} className="text-[#C6A02C]" />,
      done: !!profile?.avatar_url,
    },
    {
      id: "oneliner",
      title: "One-liner",
      desc: "One line on what you do",
      icon: <MessageSquare size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.one_liner,
    },
    {
      id: "stage",
      title: "Company stage",
      desc: "Pre-seed to Series B",
      icon: <TrendingUp size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.stage,
    },
    {
      id: "industries",
      title: "Industries",
      desc: "Pick your sectors",
      icon: <Grid2X2 size={15} className="text-[#C6A02C]" />,
      done: Array.isArray(roleProfile?.industry) && roleProfile.industry.length > 0,
    },
    {
      id: "traction",
      title: "Traction & metrics",
      desc: "MRR, growth, burn",
      icon: <BarChart2 size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.traction || !!roleProfile?.mrr,
    },
    {
      id: "identity",
      title: "Verify identity",
      desc: "Confirm 18+ & agree to terms",
      icon: <ShieldCheck size={15} className="text-[#C6A02C]" />,
      done: !!profile?.legal_accepted_at,
    },
  ];

  const investorItems = (): ChecklistItem[] => [
    {
      id: "account",
      title: "Account created",
      desc: "Name, email, password, location",
      icon: <UserCheck size={15} className="text-[#C6A02C]" />,
      done: true,
    },
    {
      id: "avatar",
      title: "Profile photo",
      desc: "Add one — recommended",
      icon: <Camera size={15} className="text-[#C6A02C]" />,
      done: !!profile?.avatar_url,
    },
    {
      id: "investor_type",
      title: "Investor type",
      desc: "Angel, VC, syndicate…",
      icon: <Briefcase size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.investor_type,
    },
    {
      id: "accreditation",
      title: "Accreditation status",
      desc: "Required by law",
      icon: <FileCheck2 size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.accreditation_status,
    },
    {
      id: "sectors",
      title: "Sectors of interest",
      desc: "Pick your focus",
      icon: <Grid2X2 size={15} className="text-[#C6A02C]" />,
      done: Array.isArray(roleProfile?.sectors_of_interest) && roleProfile.sectors_of_interest.length > 0,
    },
    {
      id: "check_size",
      title: "Check size",
      desc: "Typical ticket range",
      icon: <DollarSign size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.typical_check_size,
    },
    {
      id: "thesis",
      title: "Investment thesis",
      desc: "What you back & why",
      icon: <FileText size={15} className="text-[#C6A02C]" />,
      done: !!roleProfile?.investment_thesis,
    },
    {
      id: "identity",
      title: "Verify identity",
      desc: "Confirm 18+ & agree to terms",
      icon: <ShieldCheck size={15} className="text-[#C6A02C]" />,
      done: !!profile?.legal_accepted_at,
    },
  ];

  const items = profile
    ? userType === "founder" ? founderItems() : investorItems()
    : [];

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0D" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C6A02C" }} />
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
            background: "#C6A02C",
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
            background: "#C6A02C",
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
                color: "#C6A02C",
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
                color: "#F6F5F2",
                fontSize: 26,
                fontFamily: "Fraunces, serif",
                fontWeight: 600,
                lineHeight: 1.15,
                marginBottom: 6,
              }}
            >
              Finish your profile
            </h1>
            <p style={{ color: "#94908A", fontSize: 13, fontFamily: "Inter", fontWeight: 400, lineHeight: 1.5 }}>
              You did the basics at sign-up. Complete the rest to go live.
            </p>
          </div>

          {/* Progress card */}
          <div style={glassCard({ borderRadius: 18, padding: "15px 18px", marginBottom: 12 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ color: "#CFCCC5", fontSize: 13, fontFamily: "Inter" }}>Profile strength</span>
              <span style={{ color: "#fff", fontSize: 26, fontFamily: "Inter", fontWeight: 700, letterSpacing: "0.03em" }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #E7CB7E 0%, #C6A02C 100%)",
                  borderRadius: 99,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <p style={{ color: "#94908A", fontSize: 11.5, fontFamily: "Inter" }}>
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
              <Trophy size={18} style={{ color: "#C6A02C", flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, fontFamily: "Inter", lineHeight: "17.5px" }}>
                <span style={{ color: "#CFCCC5" }}>Reach </span>
                <span style={{ color: "#E7CB7E", fontWeight: 600 }}>100%</span>
                <span style={{ color: "#CFCCC5" }}> to unlock full platform access.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function glassCard(style: React.CSSProperties): React.CSSProperties {
  return {
    background: "rgba(255, 255, 255, 0.06)",
    boxShadow: "inset 0px 1px 0px 1px rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    outline: "1px solid rgba(255, 255, 255, 0.14)",
    backdropFilter: "blur(9px)",
    WebkitBackdropFilter: "blur(9px)",
    ...style,
  };
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div style={glassCard({ borderRadius: 14, padding: "10px 14px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon box */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: item.done
              ? "rgba(198, 160, 44, 0.10)"
              : "rgba(198, 160, 44, 0.12)",
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
              color: item.done ? "#94908A" : "#F6F5F2",
              fontSize: 13.5,
              fontFamily: "Inter",
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {item.title}
          </p>
          <p style={{ color: "#94908A", fontSize: 11.5, fontFamily: "Inter" }}>
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
              background: "#C6A02C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={13} style={{ color: "#2A2005", strokeWidth: 2.5 }} />
          </div>
        ) : (
          <ChevronRight size={18} style={{ color: "#94908A", flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
}
