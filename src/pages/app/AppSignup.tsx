import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRIES } from "@/lib/constants";
import {
  ArrowLeft,
  Rocket,
  Coins,
  Image as ImageIcon,
  UserCircle2,
  Check,
  Loader2,
} from "lucide-react";

type Role = "founder" | "investor";
const TOTAL_STEPS = 7;

const MRR_OPTIONS = ["Pre-revenue", "$0–$1k", "$1k–$10k", "$10k–$50k", "$50k+"];
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
    <div className="text-[24px] font-semibold text-white leading-[1.15] tracking-tight mb-1.5">
      {children}
    </div>
  );
}
function BigTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[28px] font-bold text-white leading-[1.1] tracking-tight mb-2">
      {children}
    </div>
  );
}
function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[#666] leading-relaxed mb-7">{children}</div>;
}
function LabelRow({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-[11px] font-semibold text-[#666] tracking-[0.05em] uppercase mb-[7px]">
      {children}{" "}
      {required ? (
        <span className="text-white">*</span>
      ) : (
        <span className="text-[#444] font-normal normal-case text-[11px]">(optional)</span>
      )}
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-[#444] mb-[7px] leading-relaxed">{children}</div>;
}

const inputCls =
  "w-full px-4 py-[13px] rounded-[14px] bg-[#1a1a1a] border border-[#2a2a2a] text-[15px] text-white outline-none focus:border-[#444] transition-colors placeholder:text-[#444]";
const selectCls = inputCls + " appearance-none cursor-pointer pr-9";
const textareaCls =
  "w-full px-4 py-[13px] rounded-[14px] bg-[#1a1a1a] border border-[#2a2a2a] text-[14px] text-white outline-none focus:border-[#444] transition-colors placeholder:text-[#444] resize-none leading-relaxed";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <LabelRow required={required}>{label}</LabelRow>
      {hint && <Hint>{hint}</Hint>}
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
      ? "px-[14px] py-2 rounded-full text-xs"
      : "px-[18px] py-[10px] rounded-[14px] text-[13px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        base,
        "font-medium border transition-all select-none",
        selected
          ? "bg-white text-[#0A0A0A] border-white"
          : "bg-[#111] text-[#666] border-[#2a2a2a] hover:border-[#555] hover:text-[#aaa]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function UploadZone({
  label,
  sub,
  icon,
  preview,
  onFile,
  accept = "image/*",
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  preview: string | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-[#2a2a2a] hover:border-[#444] rounded-[14px] p-[22px] text-center cursor-pointer transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full max-h-[140px] object-cover rounded-md" />
        ) : (
          <>
            <div className="text-[22px] text-[#444] mb-2 flex justify-center">{icon}</div>
            <div className="text-[13px] font-medium text-[#888] mb-1">{label}</div>
            <div className="text-[11px] text-[#444]">{sub}</div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </>
  );
}

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
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [startupName, setStartupName] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState<string>("Pre-seed");
  const [mrr, setMrr] = useState<string>("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [traction, setTraction] = useState("");
  const [backedBy, setBackedBy] = useState("");

  const [firmName, setFirmName] = useState("");
  const [invLocation, setInvLocation] = useState("");
  const [thesis, setThesis] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [checkSize, setCheckSize] = useState("");
  const [investmentCount, setInvestmentCount] = useState("");
  const [notablePortfolio, setNotablePortfolio] = useState("");

  const [industries, setIndustries] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    document.body.style.background = "#0A0A0A";
    return () => {
      document.body.style.background = "";
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
  const handleBanner = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Image must be under 5MB" });
      return;
    }
    setBannerFile(f);
    setBannerPreview(URL.createObjectURL(f));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return !!role;
      case 2:
        return name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length >= 8;
      case 3:
        if (!avatarFile) return false;
        if (role === "founder")
          return startupName.trim() !== "" && hqLocation.trim() !== "" && oneLiner.trim() !== "";
        return true;
      case 4:
        if (role === "founder")
          return !!stage && !!mrr && fundingAmount.trim() !== "" && traction.trim() !== "";
        return !!investorType && !!accreditation;
      case 5:
        return industries.length > 0;
      case 6:
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
    if (step === 6) return submit();
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
  const uploadBanner = async (userId: string) => {
    if (!bannerFile) return null;
    const ext = bannerFile.name.split(".").pop();
    const path = `${userId}/banner.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, bannerFile, { upsert: true });
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
        linkedin_url: linkedinUrl || null,
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
          traction: traction || null,
          funding_amount: fundingAmount || null,
          mrr: mrr || null,
          backed_by: backedBy || null,
          preferred_city: hqLocation || null,
        });
      } else {
        Object.assign(metadata, {
          firm_name: firmName || null,
          investment_thesis: thesis || null,
          typical_check_size: checkSize || null,
          sectors_of_interest: industries,
          location: invLocation || null,
          portfolio_link: portfolioLink || null,
          investor_type: investorType || null,
          investment_count: investmentCount || null,
          notable_portfolio: notablePortfolio || null,
          accreditation_status: accreditation || null,
        });
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: metadata,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      try {
        const avatarUrl = await uploadAvatar(authData.user.id);
        const bannerUrl = await uploadBanner(authData.user.id);
        if (avatarUrl) {
          await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", authData.user.id);
        }
        if (bannerUrl) {
          const table = role === "founder" ? "founder_profiles" : "investor_profiles";
          await supabase.from(table).update({ banner_url: bannerUrl }).eq("profile_id", authData.user.id);
        }
      } catch (err) {
        console.warn("Post-signup uploads skipped:", err);
      }

      setDone(true);
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

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex justify-center">
      <div className="w-full max-w-[400px] min-h-screen flex flex-col">{children}</div>
    </div>
  );



  if (done) {
    return (
      <Shell>
        <div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-white" />
          </div>
          <div className="text-[28px] font-bold text-white text-center mb-2 tracking-tight">
            You're in.
          </div>
          <div className="text-sm text-[#666] text-center leading-relaxed mb-8">
            Profile submitted. We're verifying your identity — usually same day.
          </div>
          <div className="border border-[#1a1a1a] rounded-2xl overflow-hidden">
            {[
              { n: 1, t: "Identity check", d: "Usually completed same day" },
              {
                n: 2,
                t: "Card goes live",
                d: `Shown to ${
                  role === "founder" ? "matched investors in your sectors" : "founders matching your thesis"
                }`,
              },
              {
                n: 3,
                t: "Mutual match → chat opens",
                d: "Both swipe right to unlock the conversation",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="flex gap-3 items-start p-4 border-b border-[#1a1a1a] last:border-b-0"
              >
                <div className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center text-[11px] font-semibold text-[#666] shrink-0">
                  {s.n}
                </div>
                <div className="text-xs text-[#666] leading-relaxed">
                  <strong className="block text-[13px] text-[#bbb] mb-0.5">{s.t}</strong>
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 pb-6 shrink-0 space-y-3">
          <button
            onClick={() => navigate("/early-access")}
            className="w-full py-[15px] rounded-2xl bg-white text-[#0A0A0A] font-semibold text-[15px] active:opacity-85"
          >
            Get early access — $29
          </button>
          <button
            onClick={() => navigate("/pending-approval")}
            className="w-full py-[13px] rounded-2xl border border-[#222] bg-[#111] text-white font-medium text-[14px] active:opacity-85"
          >
            Join the waitlist (free)
          </button>
        </div>
      </Shell>
    );
  }

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

      <div className="flex-1 overflow-y-auto px-5 [&::-webkit-scrollbar]:hidden">
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
                        : "border border-[#222] hover:border-[#444]",
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
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Referral code" hint="Earn bonus swipes when your referrer is approved.">
              <input
                className={inputCls}
                placeholder="e.g. ALEX2024"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>{role === "founder" ? "Your startup" : "Your profile"}</Title>
            <Sub>
              {role === "founder"
                ? "This is your first impression on the swipe card."
                : "This is what founders see before deciding to swipe."}
            </Sub>

            <Field label="Banner photo">
              <UploadZone
                label="Upload banner"
                sub="1200×400 · JPG, PNG"
                icon={<ImageIcon className="w-5 h-5" />}
                preview={bannerPreview}
                onFile={handleBanner}
              />
            </Field>
            <Field label="Profile photo" required>
              <UploadZone
                label="Upload photo"
                sub="Square · min 400×400"
                icon={<UserCircle2 className="w-5 h-5" />}
                preview={avatarPreview}
                onFile={handleAvatar}
              />
            </Field>

            {role === "founder" ? (
              <>
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
                <Field label="LinkedIn">
                  <input
                    type="url"
                    className={inputCls}
                    placeholder="linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </Field>
                <Field label="One-liner" required hint="One sentence — what you do and for whom.">
                  <input
                    className={inputCls}
                    placeholder="AI that writes QA tests while your engineers ship."
                    value={oneLiner}
                    onChange={(e) => setOneLiner(e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Firm name">
                  <input
                    className={inputCls}
                    placeholder="Northwind Ventures"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                  />
                </Field>
                <Field label="Location">
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
                <Field label="Investment thesis" hint="Briefly describe what you look for.">
                  <input
                    className={inputCls}
                    placeholder="$50k–$250k into technical pre-seed founders."
                    value={thesis}
                    onChange={(e) => setThesis(e.target.value)}
                  />
                </Field>
                <Field label="Portfolio link">
                  <input
                    type="url"
                    className={inputCls}
                    placeholder="northwindvc.com/portfolio"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>{role === "founder" ? "Stage & traction" : "Investor type"}</Title>
            <Sub>
              {role === "founder"
                ? "Investors filter by these — be accurate."
                : "Required by law. Determines which deals you can access."}
            </Sub>

            {role === "founder" ? (
              <>
                <Field label="Stage" required>
                  <div className="flex flex-wrap gap-2">
                    {STAGE_OPTIONS.map((s) => (
                      <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="MRR / Revenue" required>
                  <select className={selectCls} value={mrr} onChange={(e) => setMrr(e.target.value)}>
                    <option value="">Select MRR</option>
                    {MRR_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Funding sought" required hint="Shown on your card.">
                  <input
                    className={inputCls}
                    placeholder="e.g. $1.5M"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                  />
                </Field>
                <Field label="Traction" required hint={`${traction.length} / 250 · Users, revenue, pilots.`}>
                  <textarea
                    className={textareaCls}
                    maxLength={250}
                    rows={3}
                    placeholder="340 beta users, $12k MRR, 3 enterprise pilots."
                    value={traction}
                    onChange={(e) => setTraction(e.target.value)}
                  />
                </Field>
                <Field label="Backed by">
                  <input
                    className={inputCls}
                    placeholder="e.g. Y Combinator"
                    value={backedBy}
                    onChange={(e) => setBackedBy(e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
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
                <Field label="Typical check size">
                  <input
                    className={inputCls}
                    placeholder="e.g. $50k – $250k"
                    value={checkSize}
                    onChange={(e) => setCheckSize(e.target.value)}
                  />
                </Field>
                <Field label="Total investments">
                  <input
                    className={inputCls}
                    placeholder="e.g. 32 deals"
                    value={investmentCount}
                    onChange={(e) => setInvestmentCount(e.target.value)}
                  />
                </Field>
                <Field label="Notable portfolio">
                  <input
                    className={inputCls}
                    placeholder="e.g. Stripe, Figma, Notion"
                    value={notablePortfolio}
                    onChange={(e) => setNotablePortfolio(e.target.value)}
                  />
                </Field>
              </>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Title>Industries</Title>
            <Sub>Pick at least one. This drives your match feed.</Sub>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((i) => (
                <Chip key={i} size="sm" selected={industries.includes(i)} onClick={() => toggleIndustry(i)}>
                  {i}
                </Chip>
              ))}
            </div>
          </>
        )}

        {step === 6 && (
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
                agreed ? "border-white bg-[#141414]" : "border-[#222] hover:border-[#444]",
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

      <div className="px-5 pt-4 pb-5 shrink-0">
        <button
          onClick={advance}
          disabled={!canContinue() || submitting}
          className="w-full py-[15px] rounded-2xl bg-white text-[#0A0A0A] font-semibold text-[15px] tracking-tight active:opacity-85 transition-opacity disabled:bg-[#2a2a2a] disabled:text-[#555] disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating profile...
            </>
          ) : step === 6 ? (
            "Create my profile"
          ) : (
            "Continue"
          )}
        </button>
        {step === 6 && (
          <button
            onClick={() => navigate("/app")}
            className="w-full py-3 mt-2 text-[13px] text-[#666] active:text-[#999]"
          >
            Cancel
          </button>
        )}
      </div>
    </Shell>
  );
}
