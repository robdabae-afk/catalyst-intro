import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRIES } from "@/lib/constants";
import {
  ArrowLeft,
  Rocket,
  Coins,
  User,
  Mail,
  Lock,
  Tag,
  MapPin,
  ImagePlus,
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

// Shared visual tokens matching the design mockups
const glass =
  "bg-white/[0.06] shadow-[inset_0_1px_0_1px_rgba(255,255,255,0.25)] outline outline-1 outline-white/[0.14] backdrop-blur-[9px]";
const inputWrapCls = `h-14 px-4 rounded-[14px] ${glass} flex items-center gap-3`;
const inputCls =
  "flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#F6F5F2] placeholder:text-[#6F6B63]";

function Blobs({ variant }: { variant: "role" | "form" }) {
  if (variant === "role") {
    return (
      <>
        <div
          className="absolute rounded-[160px] pointer-events-none"
          style={{ width: 320, height: 320, left: -30, top: 120, opacity: 0.28, background: "#C6A02C", filter: "blur(60px)" }}
        />
        <div
          className="absolute rounded-[150px] pointer-events-none"
          style={{ width: 300, height: 300, left: 160, top: 220, opacity: 0.36, background: "#C6A02C", filter: "blur(60px)" }}
        />
      </>
    );
  }
  return (
    <>
      <div
        className="absolute rounded-[150px] pointer-events-none"
        style={{ width: 300, height: 300, left: 130, top: 120, opacity: 0.24, background: "#C6A02C", filter: "blur(60px)" }}
      />
      <div
        className="absolute rounded-[150px] pointer-events-none"
        style={{ width: 300, height: 300, left: -70, top: 430, opacity: 0.3, background: "#C6A02C", filter: "blur(60px)" }}
      />
    </>
  );
}

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => {
        const on = i + 1 === current;
        return (
          <span
            key={i}
            className={on ? "w-[22px] h-[6px] rounded-[3px] bg-[#F6F5F2]" : "w-[6px] h-[6px] rounded-[3px] bg-[#3A3A3C]"}
          />
        );
      })}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className={`w-10 h-10 rounded-full ${glass} flex items-center justify-center shrink-0`}
    >
      <ArrowLeft className="w-[18px] h-[18px] text-[#F6F5F2]" strokeWidth={1.75} />
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11.5px] font-normal uppercase tracking-[0.16em] text-[#C6A02C]">{children}</div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 text-[30px] font-semibold text-[#F6F5F2]" style={{ fontFamily: "Fraunces, serif" }}>
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-[14px] text-[#94908A]">{children}</div>;
}

function LabelRow({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.11em] text-[#94908A]">
      {label}{" "}
      {required ? (
        <span className="text-[#C6A02C]">*</span>
      ) : (
        <span className="normal-case text-[#6F6B63]">(optional)</span>
      )}
    </div>
  );
}

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
    <div className="flex flex-col gap-2">
      <LabelRow label={label} required={required} />
      {children}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 px-[15px] rounded-full text-[13px] transition-colors select-none",
        selected ? "bg-[#F6F5F2] text-[#111111] font-semibold" : `${glass} text-[#CFCCC5] font-normal`,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AvatarPicker({ preview, onFile }: { preview: string | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-16 h-16 rounded-full bg-[#1C1B18] outline outline-1 outline-white/[0.10] flex items-center justify-center overflow-hidden shrink-0"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-8 h-8 text-[#8E8980]" strokeWidth={1.5} />
        )}
      </button>
      <div className="flex-1">
        <div className="text-[15px] text-[#F6F5F2]">Profile photo</div>
        <div className="text-[13px] text-[#94908A]">Optional — you can add later.</div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="text-[13px] text-[#F6F5F2] underline underline-offset-2"
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

export default function AppSignupForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<Role>("founder");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Founder fields
  const [startupName, setStartupName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState("Pre-seed");

  // Investor fields — placeholder styling; restyle once the investor mockups arrive
  const [firmName, setFirmName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditation, setAccreditation] = useState("");

  const [industries, setIndustries] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

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

  const goBack = () => {
    if (step === 1) return navigate("/");
    setStep((s) => s - 1);
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return !!role;
      case 2:
        return name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length > 0;
      case 3:
        if (role === "founder") return startupName.trim() !== "" && hqLocation.trim() !== "" && oneLiner.trim() !== "";
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
    } catch {
      // best-effort only
    }

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

  const advance = () => {
    if (!canContinue()) {
      toast({ variant: "destructive", title: "Required fields", description: "Please complete the highlighted fields." });
      return;
    }
    if (step === TOTAL_STEPS) return submit();
    setStep((s) => s + 1);
  };

  const eyebrow = step === 1 ? `Step 1 of ${TOTAL_STEPS}` : `${role === "founder" ? "Founder" : "Investor"} · ${step} of ${TOTAL_STEPS}`;

  return (
    <div
      style={{ width: "100%", minHeight: "100vh", padding: "24px", background: "#111111", display: "flex", justifyContent: "center", alignItems: "flex-start", boxSizing: "border-box" }}
    >
      <div className="relative w-[390px] h-[844px] rounded-[40px] overflow-hidden bg-[#0A0A0D] flex flex-col shrink-0">
        <Blobs variant={step === 1 ? "role" : "form"} />

        {/* Header */}
        <div className="relative pt-[52px] px-[26px] shrink-0">
          <div className="flex items-center gap-4">
            <BackButton onClick={goBack} />
            <Dots current={step} total={TOTAL_STEPS} />
          </div>
        </div>

        <div className="relative px-[26px] pt-7 shrink-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Title>
            {step === 1 && "I am a..."}
            {step === 2 && "Your account"}
            {step === 3 && (role === "founder" ? "Your Startup" : "Your profile")}
            {step === 4 && (role === "founder" ? "Stage & industries" : "Investor type & sectors")}
            {step === 5 && "Almost done"}
          </Title>
          <Sub>
            {step === 1 && "This shapes your entire experience."}
            {step === 2 && "Takes 30 seconds."}
            {step === 3 && "The basics — you can polish your profile right after."}
            {step === 4 && (role === "founder" ? "Investors filter by these." : "Required by law. Determines which deals you can access.")}
            {step === 5 && "Read and agree to continue."}
          </Sub>
        </div>

        {/* Step content */}
        <div className="relative flex-1 min-h-0 overflow-y-auto px-[26px] pt-6 pb-4 [&::-webkit-scrollbar]:hidden">
          {step === 1 && (
            <div className="flex gap-3">
              {(["founder", "investor"] as Role[]).map((r) => {
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      "flex-1 min-h-[132px] px-4 py-[18px] rounded-[18px] text-left flex flex-col transition-colors",
                      glass,
                      selected ? "outline-white/[0.85] shadow-[0_0_26px_-8px_rgba(255,255,255,0.25),inset_0_1px_0_1px_rgba(255,255,255,0.25)]" : "",
                    ].join(" ")}
                  >
                    {r === "founder" ? (
                      <Rocket className="w-6 h-6 text-[#C6A02C]" strokeWidth={1.7} />
                    ) : (
                      <Coins className="w-6 h-6 text-[#C6A02C]" strokeWidth={1.7} />
                    )}
                    <div className="flex-1 flex flex-col justify-end mt-4">
                      <div className="text-[16px] font-semibold text-[#F6F5F2]">{r === "founder" ? "Founder" : "Investor"}</div>
                      <div className="mt-1 text-[12px] text-[#94908A] leading-snug">
                        {r === "founder" ? "Raising pre-seed to Series B" : "Actively deploying capital"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Field label="Full name" required>
                <div className={inputWrapCls}>
                  <User className="w-[18px] h-[18px] text-[#C6A02C] shrink-0" strokeWidth={1.5} />
                  <input className={inputCls} placeholder="Alex Chen" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </Field>
              <Field label="Email" required>
                <div className={inputWrapCls}>
                  <Mail className="w-[18px] h-[18px] text-[#C6A02C] shrink-0" strokeWidth={1.5} />
                  <input type="email" className={inputCls} placeholder="alex@startup.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </Field>
              <Field label="Password" required>
                <div className={inputWrapCls}>
                  <Lock className="w-[18px] h-[18px] text-[#C6A02C] shrink-0" strokeWidth={1.5} />
                  <input type="password" className={inputCls} placeholder="Enter a password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </Field>
              <Field label="Referral code">
                <div className={inputWrapCls}>
                  <Tag className="w-[18px] h-[18px] text-[#C6A02C] shrink-0" strokeWidth={1.5} />
                  <input className={inputCls} placeholder="e.g. ALEX2024" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
                </div>
              </Field>
            </div>
          )}

          {step === 3 && role === "founder" && (
            <div className="flex flex-col gap-6">
              <AvatarPicker preview={avatarPreview} onFile={handleAvatar} />
              <div className="flex flex-col gap-4">
                <Field label="Startup name" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="Aperture AI" value={startupName} onChange={(e) => setStartupName(e.target.value)} />
                  </div>
                </Field>
                <Field label="HQ location" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="San Francisco, CA" value={hqLocation} onChange={(e) => setHqLocation(e.target.value)} />
                    <MapPin className="w-[18px] h-[18px] text-[#6F6B63] shrink-0" strokeWidth={1.5} />
                  </div>
                </Field>
                <Field label="One-liner" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="AI that writes QA tests while your engineers ship." value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {step === 3 && role === "investor" && (
            <div className="flex flex-col gap-6">
              <AvatarPicker preview={avatarPreview} onFile={handleAvatar} />
              <div className="flex flex-col gap-4">
                <Field label="Firm name">
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="Northwind Ventures" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                  </div>
                </Field>
                <Field label="Location" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="New York, NY" value={invLocation} onChange={(e) => setInvLocation(e.target.value)} />
                    <MapPin className="w-[18px] h-[18px] text-[#6F6B63] shrink-0" strokeWidth={1.5} />
                  </div>
                </Field>
                <Field label="LinkedIn">
                  <div className={inputWrapCls}>
                    <input type="url" className={inputCls} placeholder="linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {step === 4 && role === "founder" && (
            <div className="flex flex-col gap-6">
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
                    <Chip key={i} selected={industries.includes(i)} onClick={() => toggleIndustry(i)}>
                      {i}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && role === "investor" && (
            <div className="flex flex-col gap-6">
              <Field label="Investor type" required>
                <div className="flex flex-wrap gap-2">
                  {INVESTOR_TYPES.map((t) => (
                    <Chip key={t} selected={investorType === t} onClick={() => setInvestorType(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Accreditation status" required>
                <div className="flex flex-wrap gap-2">
                  {ACCREDITATION.map((a) => (
                    <Chip key={a} selected={accreditation === a} onClick={() => setAccreditation(a)}>
                      {a}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Sectors of interest" required>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <Chip key={i} selected={industries.includes(i)} onClick={() => toggleIndustry(i)}>
                      {i}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-5">
              <div className={`p-[22px] rounded-[20px] ${glass} flex flex-col gap-3`}>
                <div className="text-[16px] font-semibold text-[#F6F5F2]">Legal disclaimer</div>
                <div className="text-[13.5px] text-[#8F8B82] leading-[22.95px]">
                  Catalyst Intro is not responsible for the outcome of any relationships made on the platform.
                  Background checks are run on all users, but due diligence remains your responsibility. You
                  must be over 18 to use this platform. Catalyst does not process or facilitate any financial
                  transactions — all funding coordination happens externally.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAgreed((a) => !a)}
                className={`p-[18px] rounded-[18px] ${glass} flex items-start gap-3.5 text-left`}
              >
                <div
                  className={[
                    "w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0",
                    agreed ? "bg-[#F6F5F2]" : `${glass}`,
                  ].join(" ")}
                >
                  {agreed && <Check className="w-4 h-4 text-[#0A0A0C]" strokeWidth={1.73} />}
                </div>
                <span className="text-[14px] text-[#CFCCC5] leading-[21px]">
                  I am over 18 and agree to the <span className="text-[#F6F5F2] font-medium">Legal Disclaimer</span> and{" "}
                  <span className="text-[#F6F5F2] font-medium">Terms of Use</span>.
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative px-[26px] pb-8 pt-3 shrink-0">
          <button
            type="button"
            onClick={advance}
            disabled={!canContinue() || submitting}
            className={[
              "w-full h-14 rounded-2xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors",
              canContinue() && !submitting
                ? "bg-[#F6F5F2] text-[#0A0A0C]"
                : "bg-white/[0.05] outline outline-1 outline-white/[0.10] text-[#6F6B63] cursor-not-allowed",
            ].join(" ")}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : step === TOTAL_STEPS ? (
              "Create my account"
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
