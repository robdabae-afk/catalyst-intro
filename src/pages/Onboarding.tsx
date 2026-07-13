import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  UserCircle2,
  LinkIcon,
  DollarSign,
  FileText,
  Briefcase,
  ChevronLeft,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";

type UserType = "founder" | "investor";

type ChecklistItem = {
  id: string;
  title: string;
  desc: string;
  xp: number;
  icon: React.ReactNode;
  done: boolean;
};

const sheetCls =
  "fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center";
const sheetInnerCls =
  "bg-[#0F0F0F] w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-[#1f1f1f] p-5 max-h-[85dvh] overflow-y-auto";
const inputCls =
  "w-full px-4 py-[12px] rounded-[14px] bg-[#1a1a1a] border border-[#2a2a2a] text-[15px] text-white outline-none focus:border-[#444] placeholder:text-[#444]";
const labelCls = "text-[11px] font-semibold text-[#666] tracking-[0.05em] uppercase mb-[6px]";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>("founder");
  const [profile, setProfile] = useState<any>(null);
  const [roleProfile, setRoleProfile] = useState<any>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  // Mobile no-scroll lock on root
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevBg = body.style.background;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.background = "#0A0A0A";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.background = prevBg;
    };
  }, []);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth?redirect=/onboarding");
      return;
    }
    setUserId(user.id);

    // Poll for profile row (race with handle_new_user trigger on fresh signups)
    let p: any = null;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) { p = data; break; }
      await new Promise((r) => setTimeout(r, 400));
    }
    setProfile(p);
    const type = ((p?.user_type as UserType) || "founder");
    setUserType(type);

    if (type === "founder") {
      const { data: fp } = await supabase
        .from("founder_profiles")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();
      setRoleProfile(fp);
    } else {
      const { data: ip } = await supabase
        .from("investor_profiles")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();
      setRoleProfile(ip);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo<ChecklistItem[]>(() => {
    if (!profile) return [];
    if (userType === "founder") {
      return [
        {
          id: "avatar",
          title: "Profile photo",
          desc: "Show your face — investors are 3× more likely to swipe right.",
          xp: 10,
          icon: <UserCircle2 className="w-5 h-5" />,
          done: !!profile.avatar_url,
        },
        {
          id: "banner",
          title: "Banner image",
          desc: "A hero image for your profile card.",
          xp: 10,
          icon: <ImageIcon className="w-5 h-5" />,
          done: !!roleProfile?.banner_url,
        },
        {
          id: "funding",
          title: "Funding & traction",
          desc: "MRR, funding sought, traction, who's backed you.",
          xp: 25,
          icon: <DollarSign className="w-5 h-5" />,
          done:
            !!roleProfile?.mrr &&
            !!roleProfile?.funding_amount &&
            !!roleProfile?.traction,
        },
        {
          id: "links",
          title: "LinkedIn + website",
          desc: "Build credibility with verifiable links.",
          xp: 10,
          icon: <LinkIcon className="w-5 h-5" />,
          done: !!profile.linkedin_url && !!profile.website_url,
        },
        {
          id: "deck",
          title: "Pitch deck",
          desc: "Upload your deck — set public or private.",
          xp: 30,
          icon: <FileText className="w-5 h-5" />,
          done: !!roleProfile?.pitch_deck_url,
        },
      ];
    }
    return [
      {
        id: "avatar",
        title: "Profile photo",
        desc: "Show your face — founders trust faces.",
        xp: 10,
        icon: <UserCircle2 className="w-5 h-5" />,
        done: !!profile.avatar_url,
      },
      {
        id: "banner",
        title: "Banner image",
        desc: "A hero image for your investor card.",
        xp: 10,
        icon: <ImageIcon className="w-5 h-5" />,
        done: !!roleProfile?.banner_url,
      },
      {
        id: "thesis",
        title: "Investment thesis + check size",
        desc: "What you back and how much you write.",
        xp: 25,
        icon: <Briefcase className="w-5 h-5" />,
        done: !!roleProfile?.investment_thesis && !!roleProfile?.typical_check_size,
      },
      {
        id: "links",
        title: "LinkedIn + portfolio link",
        desc: "Build credibility.",
        xp: 10,
        icon: <LinkIcon className="w-5 h-5" />,
        done: !!profile.linkedin_url && !!roleProfile?.portfolio_link,
      },
      {
        id: "notable",
        title: "Notable portfolio",
        desc: "Companies you're proud to have backed.",
        xp: 20,
        icon: <FileText className="w-5 h-5" />,
        done:
          !!roleProfile?.notable_portfolio &&
          roleProfile?.investment_count != null,
      },
    ];
  }, [profile, roleProfile, userType]);

  const totalXp = items.reduce((s, i) => s + i.xp, 0);
  const earnedXp = items.reduce((s, i) => s + (i.done ? i.xp : 0), 0);
  const doneCount = items.filter((i) => i.done).length;
  const pct = totalXp > 0 ? Math.round((earnedXp / totalXp) * 100) : 0;
  const allDone = items.length > 0 && doneCount === items.length;

  const handleSaved = async (itemId: string) => {
    setJustCompleted(itemId);
    await load();
    setOpenItem(null);
    setTimeout(() => setJustCompleted(null), 1400);
  };

  const dismiss = async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ onboarding_dismissed_at: new Date().toISOString() })
      .eq("id", userId);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#0A0A0A] text-white flex justify-center"
         style={{ overscrollBehavior: "none" }}>
      <div className="w-full max-w-[440px] h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center"
              aria-label="back"
            >
              <ChevronLeft className="w-[18px] h-[18px] text-[#888]" />
            </button>
            <button
              onClick={dismiss}
              className="text-[12px] text-[#666] active:text-white"
            >
              Skip for now
            </button>
          </div>
          <div className="text-[11px] text-[#555] tracking-[0.08em] uppercase mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Profile quest
          </div>
          <div className="text-[26px] font-bold leading-[1.1] tracking-tight mb-2">
            Complete your profile
          </div>
          <div className="text-[13px] text-[#666] leading-relaxed mb-4">
            Each task unlocks more visibility. Finish them to power up your matches.
          </div>

          {/* XP progress */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[12px] text-[#888]">
              <span className="text-white font-semibold">{earnedXp}</span> / {totalXp} XP
            </div>
            <div className="text-[12px] text-[#888]">
              {doneCount} / {items.length} done
            </div>
          </div>
          <div className="h-[10px] rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-2 [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpenItem(item.id)}
                className={[
                  "w-full text-left rounded-2xl p-4 border transition-all flex items-center gap-3",
                  item.done
                    ? "bg-[#0d1a13] border-emerald-900/60"
                    : "bg-[#111] border-[#1f1f1f] active:border-[#333]",
                  justCompleted === item.id ? "scale-[1.02]" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    item.done
                      ? "bg-emerald-500 text-black"
                      : "bg-[#1a1a1a] text-[#888]",
                  ].join(" ")}
                >
                  {item.done ? <Check className="w-5 h-5" strokeWidth={3} /> : item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={[
                      "text-[14px] font-semibold",
                      item.done ? "text-emerald-300 line-through" : "text-white",
                    ].join(" ")}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#666] truncate">{item.desc}</div>
                </div>
                <div className="text-[11px] font-semibold text-[#888] shrink-0">
                  +{item.xp} XP
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 px-5 pt-3 pb-5">
          <button
            onClick={dismiss}
            className={[
              "w-full py-[14px] rounded-2xl font-semibold text-[15px] active:opacity-85 transition-all",
              allDone
                ? "bg-emerald-400 text-black"
                : "bg-white text-black",
            ].join(" ")}
          >
            {allDone ? "All done — continue" : "Continue to dashboard"}
            <ArrowRight className="w-4 h-4 inline ml-1.5 -mt-0.5" />
          </button>
        </div>
      </div>

      {openItem && userId && (
        <ItemSheet
          itemId={openItem}
          userId={userId}
          userType={userType}
          profile={profile}
          roleProfile={roleProfile}
          onClose={() => setOpenItem(null)}
          onSaved={() => handleSaved(openItem)}
          toast={toast}
        />
      )}
    </div>
  );
}

function ItemSheet({
  itemId,
  userId,
  userType,
  profile,
  roleProfile,
  onClose,
  onSaved,
  toast,
}: {
  itemId: string;
  userId: string;
  userType: UserType;
  profile: any;
  roleProfile: any;
  onClose: () => void;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  return (
    <div className={sheetCls} onClick={onClose}>
      <div className={sheetInnerCls} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-semibold">Complete task</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <X className="w-4 h-4 text-[#888]" />
          </button>
        </div>
        {itemId === "avatar" && (
          <ImageUploadForm
            kind="avatar"
            userId={userId}
            label="Upload your profile photo"
            currentUrl={profile?.avatar_url}
            onDone={async (url) => {
              await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
              toast({ title: "Profile photo saved" });
              onSaved();
            }}
            toast={toast}
          />
        )}
        {itemId === "banner" && (
          <ImageUploadForm
            kind="banner"
            userId={userId}
            label="Upload a banner image"
            currentUrl={roleProfile?.banner_url}
            onDone={async (url) => {
              const table = userType === "founder" ? "founder_profiles" : "investor_profiles";
              await supabase.from(table).update({ banner_url: url }).eq("profile_id", userId);
              toast({ title: "Banner saved" });
              onSaved();
            }}
            toast={toast}
          />
        )}
        {itemId === "funding" && (
          <FundingForm userId={userId} current={roleProfile} onSaved={onSaved} toast={toast} />
        )}
        {itemId === "links" && (
          <LinksForm
            userId={userId}
            userType={userType}
            profile={profile}
            roleProfile={roleProfile}
            onSaved={onSaved}
            toast={toast}
          />
        )}
        {itemId === "deck" && (
          <PitchDeckForm userId={userId} current={roleProfile} onSaved={onSaved} toast={toast} />
        )}
        {itemId === "thesis" && (
          <ThesisForm userId={userId} current={roleProfile} onSaved={onSaved} toast={toast} />
        )}
        {itemId === "notable" && (
          <NotableForm userId={userId} current={roleProfile} onSaved={onSaved} toast={toast} />
        )}
      </div>
    </div>
  );
}

function ImageUploadForm({
  kind,
  userId,
  label,
  currentUrl,
  onDone,
  toast,
}: {
  kind: "avatar" | "banner";
  userId: string;
  label: string;
  currentUrl?: string | null;
  onDone: (url: string) => Promise<void>;
  toast: (opts: any) => void;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${kind}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      await onDone(url);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className={labelCls}>{label}</div>
      <div
        onClick={() => ref.current?.click()}
        className="border border-dashed border-[#2a2a2a] rounded-[14px] p-5 mb-4 text-center cursor-pointer overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full max-h-[180px] object-cover rounded-md" />
        ) : (
          <>
            <ImageIcon className="w-6 h-6 text-[#444] mx-auto mb-2" />
            <div className="text-[12px] text-[#888]">Tap to upload</div>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Too large", description: "Under 5MB please" });
            return;
          }
          setFile(f);
          setPreview(URL.createObjectURL(f));
        }}
      />
      <button
        disabled={!file || saving}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Uploading..." : "Save"}
      </button>
    </div>
  );
}

function FundingForm({
  userId,
  current,
  onSaved,
  toast,
}: {
  userId: string;
  current: any;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  const [mrr, setMrr] = useState(current?.mrr || "");
  const [funding, setFunding] = useState(current?.funding_amount || "");
  const [traction, setTraction] = useState(current?.traction || "");
  const [backed, setBacked] = useState(current?.backed_by || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("founder_profiles")
      .update({
        mrr: mrr || null,
        funding_amount: funding || null,
        traction: traction || null,
        backed_by: backed || null,
      })
      .eq("profile_id", userId);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
      return;
    }
    toast({ title: "Funding details saved" });
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <div className={labelCls}>MRR / Revenue</div>
        <input className={inputCls} placeholder="e.g. $12k" value={mrr} onChange={(e) => setMrr(e.target.value)} />
      </div>
      <div>
        <div className={labelCls}>Funding sought</div>
        <input className={inputCls} placeholder="e.g. $1.5M" value={funding} onChange={(e) => setFunding(e.target.value)} />
      </div>
      <div>
        <div className={labelCls}>Traction (max 250)</div>
        <textarea
          className={inputCls + " resize-none"}
          rows={3}
          maxLength={250}
          placeholder="340 beta users, $12k MRR, 3 enterprise pilots."
          value={traction}
          onChange={(e) => setTraction(e.target.value)}
        />
      </div>
      <div>
        <div className={labelCls}>Backed by</div>
        <input className={inputCls} placeholder="e.g. Y Combinator" value={backed} onChange={(e) => setBacked(e.target.value)} />
      </div>
      <button
        disabled={saving || !mrr || !funding || !traction}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function LinksForm({
  userId,
  userType,
  profile,
  roleProfile,
  onSaved,
  toast,
}: {
  userId: string;
  userType: UserType;
  profile: any;
  roleProfile: any;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || "");
  const [website, setWebsite] = useState(
    userType === "founder" ? profile?.website_url || "" : roleProfile?.portfolio_link || ""
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    if (userType === "founder") {
      await supabase
        .from("profiles")
        .update({ linkedin_url: linkedin || null, website_url: website || null })
        .eq("id", userId);
    } else {
      await supabase.from("profiles").update({ linkedin_url: linkedin || null }).eq("id", userId);
      await supabase
        .from("investor_profiles")
        .update({ portfolio_link: website || null })
        .eq("profile_id", userId);
    }
    setSaving(false);
    toast({ title: "Links saved" });
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <div className={labelCls}>LinkedIn</div>
        <input
          className={inputCls}
          placeholder="linkedin.com/in/..."
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
      </div>
      <div>
        <div className={labelCls}>{userType === "founder" ? "Company website" : "Portfolio link"}</div>
        <input
          className={inputCls}
          placeholder={userType === "founder" ? "yourstartup.com" : "yourfirm.com/portfolio"}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <button
        disabled={saving || !linkedin || !website}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function PitchDeckForm({
  userId,
  current,
  onSaved,
  toast,
}: {
  userId: string;
  current: any;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<string>(current?.pitch_deck_visibility || "public");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/pitch-deck.${ext}`;
      const { error } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url =
        visibility === "public"
          ? supabase.storage.from("documents").getPublicUrl(path).data.publicUrl
          : signed?.signedUrl || path;
      await supabase
        .from("founder_profiles")
        .update({ pitch_deck_url: url, pitch_deck_visibility: visibility })
        .eq("profile_id", userId);
      toast({ title: "Pitch deck saved" });
      onSaved();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className={labelCls}>Pitch deck (PDF)</div>
      <div
        onClick={() => ref.current?.click()}
        className="border border-dashed border-[#2a2a2a] rounded-[14px] p-5 mb-4 text-center cursor-pointer"
      >
        <FileText className="w-6 h-6 text-[#444] mx-auto mb-2" />
        <div className="text-[12px] text-[#888]">{file ? file.name : "Tap to upload PDF"}</div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 20 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Too large", description: "Under 20MB please" });
            return;
          }
          setFile(f);
        }}
      />
      <div className={labelCls}>Visibility</div>
      <div className="flex gap-2 mb-4">
        {["public", "private"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisibility(v)}
            className={[
              "flex-1 py-2 rounded-[12px] text-[13px] font-medium border capitalize",
              visibility === v
                ? "bg-white text-black border-white"
                : "bg-[#111] text-[#888] border-[#2a2a2a]",
            ].join(" ")}
          >
            {v}
          </button>
        ))}
      </div>
      <button
        disabled={!file || saving}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Uploading..." : "Save"}
      </button>
    </div>
  );
}

function ThesisForm({
  userId,
  current,
  onSaved,
  toast,
}: {
  userId: string;
  current: any;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  const [thesis, setThesis] = useState(current?.investment_thesis || "");
  const [check, setCheck] = useState(current?.typical_check_size || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await supabase
      .from("investor_profiles")
      .update({ investment_thesis: thesis || null, typical_check_size: check || null })
      .eq("profile_id", userId);
    setSaving(false);
    toast({ title: "Thesis saved" });
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <div className={labelCls}>Investment thesis</div>
        <textarea
          className={inputCls + " resize-none"}
          rows={3}
          placeholder="$50k–$250k into technical pre-seed founders."
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
        />
      </div>
      <div>
        <div className={labelCls}>Typical check size</div>
        <input
          className={inputCls}
          placeholder="$50k – $250k"
          value={check}
          onChange={(e) => setCheck(e.target.value)}
        />
      </div>
      <button
        disabled={saving || !thesis || !check}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function NotableForm({
  userId,
  current,
  onSaved,
  toast,
}: {
  userId: string;
  current: any;
  onSaved: () => void;
  toast: (opts: any) => void;
}) {
  const [notable, setNotable] = useState(current?.notable_portfolio || "");
  const [count, setCount] = useState<string>(
    current?.investment_count != null ? String(current.investment_count) : ""
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await supabase
      .from("investor_profiles")
      .update({
        notable_portfolio: notable || null,
        investment_count: count ? parseInt(count, 10) : null,
      })
      .eq("profile_id", userId);
    setSaving(false);
    toast({ title: "Portfolio saved" });
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <div className={labelCls}>Notable portfolio</div>
        <input
          className={inputCls}
          placeholder="Stripe, Figma, Notion"
          value={notable}
          onChange={(e) => setNotable(e.target.value)}
        />
      </div>
      <div>
        <div className={labelCls}>Total investments</div>
        <input
          className={inputCls}
          type="number"
          placeholder="e.g. 32"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>
      <button
        disabled={saving || !notable || !count}
        onClick={submit}
        className="w-full py-[13px] rounded-2xl bg-white text-black font-semibold text-[14px] disabled:bg-[#2a2a2a] disabled:text-[#555]"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
