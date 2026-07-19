import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRIES } from "@/lib/constants";
import {
  ArrowLeft,
  Rocket,
  Coins,
  UserCircle2,
  Check,
  Loader2,
} from "lucide-react";

type Role = "founder" | "investor";
const TOTAL_STEPS = 5;

const STAGE_OPTIONS = ["Pre-seed", "Seed", "Series A", "Series B"];
const INVESTOR_TYPES = [
  "Retail Investor",
  "Angel Investor",
  "Accredited Individual",
  "Venture Capital (VC)",
  "Private Equity (PE)",
  "Family Office",
];
const ACCREDITATION = ["Accredited", "Non-Accredited", "Qualified Purchaser"];

const stageToValue: Record<string, "pre-seed" | "seed" | "series-a" | "series-b"> = {
  "Pre-seed": "pre-seed",
  Seed: "seed",
  "Series A": "series-a",
  "Series B": "series-b",
};

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-[5px]">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const on = idx === current;
        const done = idx < current;
        return (
          <span
            key={i}
            className={[
              "h-[5px] rounded-full transition-all",
              on ? "w-[18px] bg-white" : "w-[5px]",
              !on && done ? "bg-[#555]" : "",
              !on && !done ? "bg-[#333]" : "",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-[#555] tracking-[0.08em] uppercase mb-2">{children}</div>;
}
function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[22px] font-semibold text-white leading-[1.15] tracking-tight mb-1.5">
      {children}
    </div>
  );
}
function BigTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[26px] font-bold text-white leading-[1.1] tracking-tight mb-2">
      {children}
    </div>
  );
}
function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] text-[#666] leading-relaxed mb-5">{children}</div>;
}
function LabelRow({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-[11px] font-semibold text-[#666] tracking-[0.05em] uppercase mb-[6px]">
      {children}{" "}
      {required ? (
        <span className="text-white">*</span>
      ) : (
        <span className="text-[#444] font-normal normal-case text-[11px]">(optional)</span>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-[12px] rounded-[14px] bg-[#1a1a1a] border border-[#2a2a2a] text-[15px] text-white outline-none focus:border-[#444] transition-colors placeholder:text-[#444]";
const selectCls = inputCls + " appearance-none cursor-pointer pr-9";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <LabelRow required={required}>{label}</LabelRow>
      {children}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
  size = "md",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const base =
    size === "sm"
      ? "px-[13px] py-[7px] rounded-full text-xs"
      : "px-[16px] py-[9px] rounded-[14px] text-[13px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        base,
        "font-medium border transition-all select-none",
        selected
          ? "bg-white text-[#0A0A0A] border-white"
          : "bg-[#111] text-[#888] border-[#2a2a2a] active:border-[#555]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AvatarPicker({
  preview,
  onFile,
}: {
  preview: string | null;
  onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-[68px] h-[68px] rounded-full border border-dashed border-[#2a2a2a] bg-[#111] flex items-center justify-center overflow-hidden shrink-0"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <UserCircle2 className="w-7 h-7 text-[#444]" />
        )}
      </button>
      <div className="flex-1">
        <div className="text-[13px] text-[#bbb] font-semibold">Profile photo</div>
        <div className="text-[11px] text-[#555] mb-2">Optional — you can add later.</div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="text-[12px] text-[#888] underline underline-offset-2 active:text-white"
        >
          {preview ? "Change photo" : "Upload"}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white flex justify-center"
       style={{ overscrollBehavior: "none", touchAction: "pan-x" }}>
    <div className="w-full max-w-[420px] h-full flex flex-col">{children}</div>
  </div>
);

export default function AppSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initialRole: Role | null = useMemo(() => {
    if (location.pathname.includes("/founder")) return "founder";
    if (location.pathname.includes("/investor")) return "investor";
    return null;
  }, [location.pathname]);

  const [role, setRole] = useState<Role>(initialRole || "founder");
  const [step, setStep] = useState<number>(initialRole ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Founder minimal
  const [startupName, setStartupName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState<string>("Pre-seed");

  // Investor minimal
  const [firmName, setFirmName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditation, setAccreditation] = useState("");

  const [industries, setIndustries] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  // Mobile no-scroll lock
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevOver = body.style.overscrollBehavior;
    const prevBg = body.style.background;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.background = "#0A0A0A";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.overscrollBehavior = prevOver;
      body.style.background = prevBg;
    };
  }, []);

  const goBack = () => {
    if (step === 1) return navigate("/app");
    if (step === 2 && initialRole) return navigate("/app");
    setStep((s) => Math.max(1, s - 1));
  };

  const toggleIndustry = (i: string) =>
    setIndustries((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleAvatar = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Image must be under 5MB" });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return !!role;
      case 2:
        return name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length > 0;
      case 3:
        if (role === "founder")
          return startupName.trim() !== "" && hqLocation.trim() !== "" && oneLiner.trim() !== "";
        return invLocation.trim() !== "";
      case 4:
        if (role === "founder") return !!stage && industries.length > 0;
        return !!investorType && !!accreditation && industries.length > 0;
      case 5:
        return agreed;
      default:
        return true;
    }
  };

  const advance = () => {
    if (!canContinue()) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please complete the highlighted fields.",
      });
      return;
    }
    if (step === TOTAL_STEPS) return submit();
    setStep((s) => s + 1);
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;
    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (error) return null;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };

  const submit = async () => {
    setSubmitting(true);

    let referralValid = false;
    if (referralCode && referralCode.length >= 4) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .maybeSingle();
      referralValid = !!data;
    }

    let userIp = "unknown";
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      userIp = (await r.json()).ip;
    } catch {}

    try {
      const metadata: Record<string, unknown> = {
        name,
        user_type: role,
        legal_accepted_at: new Date().toISOString(),
        legal_accepted_ip: userIp,
        referral_code: referralValid ? referralCode.toUpperCase() : null,
      };

      if (role === "founder") {
        Object.assign(metadata, {
          startup_name: startupName,
          one_liner: oneLiner,
          industry: industries,
          stage: stageToValue[stage] || null,
          preferred_city: hqLocation || null,
        });
      } else {
        Object.assign(metadata, {
          firm_name: firmName || null,
          sectors_of_interest: industries,
          location: invLocation || null,
          linkedin_url: linkedinUrl || null,
          investor_type: investorType || null,
          accreditation_status: accreditation || null,
        });
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: metadata,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      try {
        const avatarUrl = await uploadAvatar(authData.user.id);
        if (avatarUrl) {
          await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", authData.user.id);
        }
      } catch (err) {
        console.warn("Avatar upload skipped:", err);
      }

      navigate("/onboarding");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't create account",
        description: err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initialRole: Role | null = useMemo(() => {
    if (location.pathname.includes("/founder")) return "founder";
    if (location.pathname.includes("/investor")) return "investor";
    return null;
  }, [location.pathname]);

  const [role, setRole] = useState<Role>(initialRole || "founder");
  const [step, setStep] = useState<number>(initialRole ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Founder minimal
  const [startupName, setStartupName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState<string>("Pre-seed");

  // Investor minimal
  const [firmName, setFirmName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditation, setAccreditation] = useState("");

  const [industries, setIndustries] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  // Mobile no-scroll lock
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevOver = body.style.overscrollBehavior;
    const prevBg = body.style.background;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.background = "#0A0A0A";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.overscrollBehavior = prevOver;
      body.style.background = prevBg;
    };
  }, []);

  const goBack = () => {
    if (step === 1) return navigate("/app");
    if (step === 2 && initialRole) return navigate("/app");
    setStep((s) => Math.max(1, s - 1));
  };

  const toggleIndustry = (i: string) =>
    setIndustries((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleAvatar = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Image must be under 5MB" });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return !!role;
      case 2:
        return name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length > 0;
      case 3:
        if (role === "founder")
          return startupName.trim() !== "" && hqLocation.trim() !== "" && oneLiner.trim() !== "";
        return invLocation.trim() !== "";
      case 4:
        if (role === "founder") return !!stage && industries.length > 0;
        return !!investorType && !!accreditation && industries.length > 0;
      case 5:
        return agreed;
      default:
        return true;
    }
  };

  const advance = () => {
    if (!canContinue()) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please complete the highlighted fields.",
      });
      return;
    }
    if (step === TOTAL_STEPS) return submit();
    setStep((s) => s + 1);
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;
    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (error) return null;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };

  const submit = async () => {
    setSubmitting(true);

    let referralValid = false;
    if (referralCode && referralCode.length >= 4) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .maybeSingle();
      referralValid = !!data;
    }

    let userIp = "unknown";
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      userIp = (await r.json()).ip;
    } catch {}

    try {
      const metadata: Record<string, unknown> = {
        name,
        user_type: role,
        legal_accepted_at: new Date().toISOString(),
        legal_accepted_ip: userIp,
        referral_code: referralValid ? referralCode.toUpperCase() : null,
      };

      if (role === "founder") {
        Object.assign(metadata, {
          startup_name: startupName,
          one_liner: oneLiner,
          industry: industries,
          stage: stageToValue[stage] || null,
          preferred_city: hqLocation || null,
        });
      } else {
        Object.assign(metadata, {
          firm_name: firmName || null,
          sectors_of_interest: industries,
          location: invLocation || null,
          linkedin_url: linkedinUrl || null,
          investor_type: investorType || null,
          accreditation_status: accreditation || null,
        });
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: metadata,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      try {
        const avatarUrl = await uploadAvatar(authData.user.id);
        if (avatarUrl) {
          await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", authData.user.id);
        }
      } catch (err) {
        console.warn("Avatar upload skipped:", err);
      }

      navigate("/onboarding");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't create account",
        description: err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const eyebrow = `${role === "founder" ? "Founder" : "Investor"} · ${step} of ${TOTAL_STEPS}`;

  return (
 <div style={{ width: "100%", minHeight: "100vh", padding: "24px", background: "linear-gradient(0deg, var(--color-grey-7, #111111) 0%, var(--color-grey-7, #111111) 100%), var(--color-white-solid, white)", display: "inline-flex", justifyContent: "center", alignItems: "flex-start" }}>
  <div style={{ width: "390px", height: "844px", position: "relative", background: "var(--color-blue-5, #0A0A0D)", overflow: "hidden", borderRadius: "40px" }}>
    <div style={{ width: "330px", height: "52px", paddingTop: "8px", left: "30px", top: "744px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
      <div style={{ alignSelf: "stretch", height: "44px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", color: "var(--color-grey-96, #F6F5F2)", fontSize: "15px", fontFamily: "Inter", fontWeight: 400 }}>
          I already have an account
        </div>
      </div>
    </div>
    <div style={{ width: "320px", height: "320px", left: "-30px", top: "120px", position: "absolute", opacity: 0.28, background: "var(--color-yellow-47, #C6A02C)", boxShadow: "10px 10px 10px", borderRadius: "160px", filter: "blur(5px)" }}></div>
    <div style={{ width: "300px", height: "300px", left: "160px", top: "220px", position: "absolute", opacity: 0.36, background: "var(--color-yellow-47, #C6A02C)", boxShadow: "10px 10px 10px", borderRadius: "150px", filter: "blur(5px)" }}></div>
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
    <div style={{ width: "330px", paddingBottom: "14px", left: "30px", top: "491.94px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", color: "var(--color-grey-96, #F6F5F2)", fontSize: "38px", fontFamily: "Fraunces", fontWeight: 600, lineHeight: "41px" }}>
          Where founders<br/>meet capital.
        </div>
      </div>
    </div>
    <div style={{ width: "300px", maxWidth: "300px", paddingBottom: "30px", left: "30px", top: "588px", position: "absolute", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: "300px", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center", color: "var(--color-grey-56, #94908A)", fontSize: "15px", fontFamily: "Inter", fontWeight: 400, lineHeight: "24px" }}>
          Curated intros between founders and<br/>investors who actually fit. No noise, no<br/>cold outreach.
        </div>
      </div>
    </div>
    <form onSubmit={(e)=>{e.preventDefault(); submit();}} style={{ width: "330px", height: "54px", left: "30px", top: "690px", position: "absolute", background: "var(--color-grey-96, #F6F5F2)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8.01px" }}>
      <button type="submit" style={{ textAlign: "center", color: "var(--color-grey-4, #0A0A0C)", fontSize: "15px", fontFamily: "Inter", fontWeight: 500 }}>Create account</button>
      <div style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}>
        <div style={{ width: "10.5px", height: "9px", left: "3.75px", top: "4.5px", position: "absolute", outline: "1.5px solid var(--color-grey-4, #0A0A0C)", outlineOffset: "-0.75px" }}></div>
      </div>
    </form>
  </div>
</div> </Shell>
  );
}
