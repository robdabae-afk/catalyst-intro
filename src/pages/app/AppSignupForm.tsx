import { isAppShell } from "@/lib/platform";
import { useRef, useState } from "react";
import "./signup.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRIES, CHECK_SIZE_OPTIONS } from "@/lib/constants";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/traction-tiles";
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
  ChevronDown,
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
const glass = "bg-white border-[1.5px] border-[#e6e6e3]";
const inputWrapCls = `h-14 px-4 rounded-[14px] ${glass} flex items-center gap-3 focus-within:border-[#0b0b0b] transition-colors`;
const inputCls =
  "flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#0b0b0b] placeholder:text-[#9a9a93]";

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => {
        const on = i + 1 === current;
        return (
          <span
            key={i}
            className={on ? "w-[22px] h-[6px] rounded-[3px] bg-[#0b0b0b]" : "w-[6px] h-[6px] rounded-[3px] bg-[#d8d8d4]"}
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
      <ArrowLeft className="w-[18px] h-[18px] text-[#0b0b0b]" strokeWidth={1.75} />
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="su-mono text-[#0b0b0b]">{children}</div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 text-[30px] font-bold tracking-[-0.02em] leading-[1.1] text-[#0b0b0b]">
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-[14px] text-[#74746d]">{children}</div>;
}

function LabelRow({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.11em] text-[#74746d]">
      {label}{" "}
      {required ? (
        <span className="text-[#0b0b0b]">*</span>
      ) : (
        <span className="normal-case text-[#9a9a93]">(optional)</span>
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

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <div className={`h-[58px] px-[18px] rounded-[14px] ${glass} flex items-center justify-between gap-2`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "flex-1 min-w-0 appearance-none bg-transparent outline-none text-[15px]",
          value ? "text-[#0b0b0b]" : "text-[#3d3d3d]",
        ].join(" ")}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-white text-[#0b0b0b]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="w-[18px] h-[18px] text-[#74746d] shrink-0 pointer-events-none" strokeWidth={1.5} />
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
        selected ? "bg-[#0b0b0b] text-white font-semibold border-[1.5px] border-[#0b0b0b]" : `${glass} text-[#3d3d3d] font-normal`,
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
        className="w-16 h-16 rounded-full bg-[#f4f4f2] border-[1.5px] border-[#e6e6e3] flex items-center justify-center overflow-hidden shrink-0"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-8 h-8 text-[#74746d]" strokeWidth={1.5} />
        )}
      </button>
      <div className="flex-1">
        <div className="text-[15px] text-[#0b0b0b]">Profile photo</div>
        <div className="text-[13px] text-[#74746d]">Optional — you can add later.</div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="text-[13px] text-[#0b0b0b] underline underline-offset-2"
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

  const initialRole = searchParams.get("role");
  const [role, setRole] = useState<Role>(initialRole === "investor" ? "investor" : "founder");
  const [step, setStep] = useState(initialRole === "founder" || initialRole === "investor" ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  // Set after signUp succeeds. hasSession=false means email confirmation is required.
  const [created, setCreated] = useState<{ hasSession: boolean } | null>(null);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Founder fields
  const [startupName, setStartupName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState("Pre-seed");
  const [operationsStartDate, setOperationsStartDate] = useState("");
  const [teamFullTime, setTeamFullTime] = useState(false);
  const [waitlistSignups, setWaitlistSignups] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [pilotsLois, setPilotsLois] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [userGrowthMom, setUserGrowthMom] = useState("");

  // Investor fields
  const [firmName, setFirmName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [typicalCheckSize, setTypicalCheckSize] = useState("");
  const [investmentThesis, setInvestmentThesis] = useState("");

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
    if (step === 1) return navigate(isAppShell() || new URLSearchParams(location.search).get("from") === "app" ? "/welcome" : "/intro");
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
        return firmName.trim() !== "" && invLocation.trim() !== "";
      case 4:
        if (role === "founder") return !!stage && industries.length > 0;
        return !!investorType && !!accreditation && industries.length > 0 && !!typicalCheckSize;
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
          operations_start_date: operationsStartDate || null,
          team_full_time: teamFullTime,
          waitlist_signups: waitlistSignups || null,
          active_users: activeUsers || null,
          pilots_lois: pilotsLois || null,
          product_status: productStatus || null,
          user_growth_mom: userGrowthMom || null,
        });
      } else {
        Object.assign(metadata, {
          firm_name: firmName || null,
          sectors_of_interest: industries,
          location: invLocation || null,
          linkedin_url: linkedinUrl || null,
          investor_type: investorType || null,
          accreditation_status: accreditation || null,
          typical_check_size: typicalCheckSize || null,
          investment_thesis: investmentThesis.trim() || null,
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

      setCreated({ hasSession: !!authData.session });
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

  if (created) {
    return (
      <div className="su">
        <div className="su-card su-done" role="status">
          <div className="su-check" aria-hidden="true"><Check className="w-7 h-7" strokeWidth={2.2} /></div>
          <h1>Your account has been created</h1>
          {created.hasSession ? (
            <>
              <p>Welcome to Catalyst, {name.trim().split(" ")[0] || "friend"}.</p>
              <button type="button" className="su-btn" onClick={() => navigate("/feed")}>Enter the app</button>
            </>
          ) : (
            <>
              <p>We sent a confirmation link to <b>{email}</b>. Confirm your email, then log in to enter the app.</p>
              <button type="button" className="su-btn" onClick={() => navigate("/auth")}>Go to log in</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="su">
      <div className="su-card relative flex flex-col">

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
            {step === 3 && (role === "founder" ? "Your Startup" : "Your Profile")}
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
                      selected ? "!border-[#0b0b0b] shadow-[0_0_0_1px_#0b0b0b]" : "",
                    ].join(" ")}
                  >
                    {r === "founder" ? (
                      <Rocket className="w-6 h-6 text-[#0b0b0b]" strokeWidth={1.7} />
                    ) : (
                      <Coins className="w-6 h-6 text-[#0b0b0b]" strokeWidth={1.7} />
                    )}
                    <div className="flex-1 flex flex-col justify-end mt-4">
                      <div className="text-[16px] font-semibold text-[#0b0b0b]">{r === "founder" ? "Founder" : "Investor"}</div>
                      <div className="mt-1 text-[12px] text-[#74746d] leading-snug">
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
                  <User className="w-[18px] h-[18px] text-[#0b0b0b] shrink-0" strokeWidth={1.5} />
                  <input className={inputCls} placeholder="Alex Chen" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </Field>
              <Field label="Email" required>
                <div className={inputWrapCls}>
                  <Mail className="w-[18px] h-[18px] text-[#0b0b0b] shrink-0" strokeWidth={1.5} />
                  <input type="email" className={inputCls} placeholder="alex@startup.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </Field>
              <Field label="Password" required>
                <div className={inputWrapCls}>
                  <Lock className="w-[18px] h-[18px] text-[#0b0b0b] shrink-0" strokeWidth={1.5} />
                  <input type="password" className={inputCls} placeholder="Enter a password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </Field>
              <Field label="Referral code">
                <div className={inputWrapCls}>
                  <Tag className="w-[18px] h-[18px] text-[#0b0b0b] shrink-0" strokeWidth={1.5} />
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
                    <MapPin className="w-[18px] h-[18px] text-[#9a9a93] shrink-0" strokeWidth={1.5} />
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
                <Field label="Start up name" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="Aperture AI" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                  </div>
                </Field>
                <Field label="HQ location" required>
                  <div className={inputWrapCls}>
                    <input className={inputCls} placeholder="San Francisco, CA" value={invLocation} onChange={(e) => setInvLocation(e.target.value)} />
                    <MapPin className="w-[18px] h-[18px] text-[#9a9a93] shrink-0" strokeWidth={1.5} />
                  </div>
                </Field>
                <Field label="LinkedIn">
                  <div className={inputWrapCls}>
                    <input type="url" className={inputCls} placeholder="linkedin.com/in/ ..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
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
              <Field label="Company start date">
                <div className={inputWrapCls}>
                  <input
                    type="date"
                    className={inputCls}
                    value={operationsStartDate}
                    onChange={(e) => setOperationsStartDate(e.target.value)}
                  />
                </div>
                <div className="text-[12px] text-[#9a9a93] mt-1.5">
                  We use this to show months in operation on your profile.
                </div>
              </Field>
              <Field label="Team commitment">
                <Chip selected={teamFullTime} onClick={() => setTeamFullTime((v) => !v)}>
                  Our team is full-time
                </Chip>
              </Field>
              <Field label="Traction (optional)">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className={inputWrapCls}>
                    <input
                      className={inputCls}
                      placeholder="Waitlist / signups"
                      inputMode="numeric"
                      value={waitlistSignups}
                      onChange={(e) => setWaitlistSignups(e.target.value)}
                    />
                  </div>
                  <div className={inputWrapCls}>
                    <input
                      className={inputCls}
                      placeholder="Active users"
                      value={activeUsers}
                      onChange={(e) => setActiveUsers(e.target.value)}
                    />
                  </div>
                  <div className={inputWrapCls}>
                    <input
                      className={inputCls}
                      placeholder="Pilots / LOIs"
                      inputMode="numeric"
                      value={pilotsLois}
                      onChange={(e) => setPilotsLois(e.target.value)}
                    />
                  </div>
                  <div className={inputWrapCls}>
                    <input
                      className={inputCls}
                      placeholder="User growth MoM"
                      value={userGrowthMom}
                      onChange={(e) => setUserGrowthMom(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {PRODUCT_STATUS_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      selected={productStatus === s}
                      onClick={() => setProductStatus((v) => (v === s ? "" : s))}
                    >
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
                <Select value={investorType} onChange={setInvestorType} options={INVESTOR_TYPES} placeholder="Select type" />
              </Field>
              <Field label="Accreditation status" required>
                <Select value={accreditation} onChange={setAccreditation} options={ACCREDITATION} placeholder="Select status" />
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
              <Field label="Typical check size" required>
                <Select value={typicalCheckSize} onChange={setTypicalCheckSize} options={CHECK_SIZE_OPTIONS} placeholder="Select range" />
              </Field>
              <Field label="Investment thesis">
                <div className={`${glass} rounded-[14px] p-4`}>
                  <textarea
                    className="w-full min-h-[88px] bg-transparent outline-none resize-none text-[15px] text-[#0b0b0b] placeholder:text-[#9a9a93]"
                    placeholder="What you back, and why."
                    value={investmentThesis}
                    onChange={(e) => setInvestmentThesis(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-5">
              <div className={`p-[22px] rounded-[20px] ${glass} flex flex-col gap-3`}>
                <div className="text-[16px] font-semibold text-[#0b0b0b]">Legal disclaimer</div>
                <div className="text-[13.5px] text-[#5f5f5f] leading-[22.95px]">
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
                    agreed ? "bg-[#0b0b0b]" : `${glass}`,
                  ].join(" ")}
                >
                  {agreed && <Check className="w-4 h-4 text-white" strokeWidth={2} />}
                </div>
                <span className="text-[14px] text-[#3d3d3d] leading-[21px]">
                  I am over 18 and agree to the <span className="text-[#0b0b0b] font-medium">Legal Disclaimer</span> and{" "}
                  <span className="text-[#0b0b0b] font-medium">Terms of Use</span>.
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
              "w-full h-14 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-colors",
              canContinue() && !submitting
                ? "bg-[#0b0b0b] text-white"
                : "bg-[#f4f4f2] text-[#9a9a93] cursor-not-allowed",
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
