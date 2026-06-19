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
  };

  const eyebrow = `${role === "founder" ? "Founder" : "Investor"} · ${step} of ${TOTAL_STEPS}`;

  return (
    <Shell>
      <div className="pt-4 shrink-0">
        <div className="flex items-center justify-between px-5 pb-3">
          <button
            onClick={goBack}
            aria-label="back"
            className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center"
          >
            <ArrowLeft className="w-[17px] h-[17px] text-[#888]" />
          </button>
          <Dots current={step} total={TOTAL_STEPS} />
          <span className="w-9" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 [&::-webkit-scrollbar]:hidden">
        {step === 1 && (
          <>
            <Eyebrow>Step 1 of {TOTAL_STEPS}</Eyebrow>
            <BigTitle>I am a...</BigTitle>
            <Sub>This shapes your entire experience.</Sub>
            <div className="grid grid-cols-2 gap-[10px] mb-6">
              {(["founder", "investor"] as Role[]).map((r) => {
                const sel = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      "rounded-[18px] p-5 text-left transition-all bg-[#111]",
                      sel
                        ? "border-2 border-white bg-[#1a1a1a]"
                        : "border border-[#222] active:border-[#444]",
                    ].join(" ")}
                  >
                    <div className={["mb-3", sel ? "text-white" : "text-[#888]"].join(" ")}>
                      {r === "founder" ? <Rocket className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                    </div>
                    <div
                      className={[
                        "text-sm font-semibold mb-1",
                        sel ? "text-white" : "text-[#888]",
                      ].join(" ")}
                    >
                      {r === "founder" ? "Founder" : "Investor"}
                    </div>
                    <div className="text-[11px] text-[#444] leading-snug">
                      {r === "founder" ? "Raising pre-seed to Series B" : "Actively deploying capital"}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Your account</Title>
            <Sub>Takes 30 seconds.</Sub>
            <Field label="Full name" required>
              <input
                className={inputCls}
                placeholder="Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                className={inputCls}
                placeholder="alex@startup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password"
                className={inputCls}
                placeholder="Enter a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Referral code">
              <input
                className={inputCls}
                placeholder="e.g. ALEX2024"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 3 && role === "founder" && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Your startup</Title>
            <Sub>The basics — you can polish your profile right after.</Sub>
            <AvatarPicker preview={avatarPreview} onFile={handleAvatar} />
            <Field label="Startup name" required>
              <input
                className={inputCls}
                placeholder="Aperture AI"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
              />
            </Field>
            <Field label="HQ location" required>
              <input
                className={inputCls}
                placeholder="San Francisco, CA"
                value={hqLocation}
                onChange={(e) => setHqLocation(e.target.value)}
              />
            </Field>
            <Field label="One-liner" required>
              <input
                className={inputCls}
                placeholder="AI that writes QA tests while your engineers ship."
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 3 && role === "investor" && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Your profile</Title>
            <Sub>The basics — you can finish your profile right after.</Sub>
            <AvatarPicker preview={avatarPreview} onFile={handleAvatar} />
            <Field label="Firm name">
              <input
                className={inputCls}
                placeholder="Northwind Ventures"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
              />
            </Field>
            <Field label="Location" required>
              <input
                className={inputCls}
                placeholder="New York, NY"
                value={invLocation}
                onChange={(e) => setInvLocation(e.target.value)}
              />
            </Field>
            <Field label="LinkedIn">
              <input
                type="url"
                className={inputCls}
                placeholder="linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 4 && role === "founder" && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Stage & industries</Title>
            <Sub>Investors filter by these.</Sub>
            <Field label="Company stage" required>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((s) => (
                  <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Industries" required>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <Chip
                    key={i}
                    size="sm"
                    selected={industries.includes(i)}
                    onClick={() => toggleIndustry(i)}
                  >
                    {i}
                  </Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 4 && role === "investor" && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Investor type & sectors</Title>
            <Sub>Required by law. Determines which deals you can access.</Sub>
            <Field label="Investor type" required>
              <select
                className={selectCls}
                value={investorType}
                onChange={(e) => setInvestorType(e.target.value)}
              >
                <option value="">Select type</option>
                {INVESTOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Accreditation status" required>
              <select
                className={selectCls}
                value={accreditation}
                onChange={(e) => setAccreditation(e.target.value)}
              >
                <option value="">Select status</option>
                {ACCREDITATION.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sectors of interest" required>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <Chip
                    key={i}
                    size="sm"
                    selected={industries.includes(i)}
                    onClick={() => toggleIndustry(i)}
                  >
                    {i}
                  </Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 5 && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Almost done</Title>
            <Sub>Read and agree to continue.</Sub>
            <div className="bg-[#111] rounded-[14px] p-4 text-[11px] text-[#666] leading-relaxed mb-4">
              <strong className="block text-[12px] text-[#888] mb-1.5">Legal disclaimer</strong>
              Catalyst Intro is not responsible for the outcome of any relationships made on the platform.
              Background checks are run on all users, but due diligence remains your responsibility. You must
              be over 18 to use this platform. Catalyst does not process or facilitate any financial
              transactions — all funding coordination happens externally.
            </div>
            <button
              type="button"
              onClick={() => setAgreed((a) => !a)}
              className={[
                "w-full flex items-start gap-3 p-4 rounded-[14px] border transition-colors text-left",
                agreed ? "border-white bg-[#141414]" : "border-[#222] active:border-[#444]",
              ].join(" ")}
            >
              <div
                className={[
                  "w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 mt-0.5",
                  agreed ? "bg-white border-white" : "border-[#444]",
                ].join(" ")}
              >
                {agreed && <Check className="w-3 h-3 text-black" />}
              </div>
              <span className="text-xs text-[#888] leading-relaxed">
                I am over 18 and agree to the Legal Disclaimer and Terms of Use.
              </span>
            </button>
          </>
        )}
      </div>

      <div className="px-5 pt-3 pb-5 shrink-0">
        <button
          onClick={advance}
          disabled={!canContinue() || submitting}
          className="w-full py-[14px] rounded-2xl bg-white text-[#0A0A0A] font-semibold text-[15px] tracking-tight active:opacity-85 transition-opacity disabled:bg-[#2a2a2a] disabled:text-[#555] disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : step === TOTAL_STEPS ? (
            "Create my account"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </Shell>
  );
}
