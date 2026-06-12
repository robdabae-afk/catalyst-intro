import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export default function MatchOnboarding() {
  const navigate = useNavigate();
  const { userId, profile, loading, reload } = useMatchSession();
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [role, setRole] = useState<"founder" | "investor">("founder");

  // shared
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // founder
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [traction, setTraction] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [deckFile, setDeckFile] = useState<File | null>(null);

  // investor
  const [firmName, setFirmName] = useState("");
  const [accreditation, setAccreditation] = useState<"none" | "accredited" | "institutional">("none");
  const [avgCheck, setAvgCheck] = useState("");
  const [philosophy, setPhilosophy] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate("/match/auth"); return; }
    (async () => {
      // Determine role: existing profile > auth metadata > default founder
      const { data: { user } } = await supabase.auth.getUser();
      const metaRole = (user?.user_metadata?.match_role as "founder" | "investor") || undefined;
      let pendingRole: "founder" | "investor" | undefined;
      try {
        const p = localStorage.getItem("match_pending_role");
        if (p === "founder" || p === "investor") pendingRole = p;
      } catch {}
      const effectiveRole = (profile?.role as any) || metaRole || pendingRole || "founder";
      setRole(effectiveRole);
      try { localStorage.removeItem("match_pending_role"); } catch {}

      if (profile) {
        setName(profile.name || user?.user_metadata?.match_name || "");
        setAvatarPreview(profile.avatar_url ?? null);
      } else {
        setName(user?.user_metadata?.match_name || "");
      }

      // Hydrate role-specific data
      if (effectiveRole === "founder") {
        const { data: f } = await (supabase as any)
          .from("match_founder_profiles").select("*").eq("profile_id", userId).maybeSingle();
        if (f) {
          setStartupName(f.startup_name ?? "");
          setOneLiner(f.one_liner ?? "");
          setIndustry(Array.isArray(f.industry) ? f.industry.join(", ") : "");
          setStage(f.stage ?? "");
          setTraction(f.traction ?? "");
          setFundingAmount(f.funding_amount ?? "");
          setLocation(f.location ?? "");
          setWebsite(f.website_url ?? "");
        }
      } else {
        const { data: i } = await (supabase as any)
          .from("match_investor_profiles").select("*").eq("profile_id", userId).maybeSingle();
        if (i) {
          setFirmName(i.firm_name ?? "");
          setAccreditation((i.accreditation ?? "none") as any);
          setAvgCheck(i.avg_check_size ?? "");
          setPhilosophy(i.philosophy ?? "");
        }
      }
      setHydrating(false);
    })();
  }, [userId, profile, loading, navigate]);

  if (loading || !userId || hydrating)
    return <MatchLayout showNav={false}><div className="p-10 text-center text-white/60">Loading…</div></MatchLayout>;

  const onAvatarChange = (f: File | null) => {
    setAvatarFile(f);
    if (f) setAvatarPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${userId}/match-avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (upErr) throw new Error(`Avatar upload failed: ${upErr.message}`);
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const { error: pErr } = await (supabase as any).from("match_profiles").upsert({
        id: userId, role, name, email: user?.email, avatar_url: avatarUrl,
      });
      if (pErr) throw new Error(`Profile save failed: ${pErr.message}`);

      if (role === "founder") {
        let deckUrl: string | null = null;
        if (deckFile) {
          const path = `${userId}/match-deck-${Date.now()}-${deckFile.name}`;
          const { error: dErr } = await supabase.storage.from("documents").upload(path, deckFile, { upsert: true });
          if (dErr) throw new Error(`Deck upload failed: ${dErr.message}`);
          deckUrl = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
        }
        const { error: fErr } = await (supabase as any).from("match_founder_profiles").upsert({
          profile_id: userId,
          startup_name: startupName,
          one_liner: oneLiner,
          industry: industry ? industry.split(",").map((s) => s.trim()).filter(Boolean) : null,
          stage, traction, funding_amount: fundingAmount, location, website_url: website,
          ...(deckUrl ? { pitch_deck_url: deckUrl } : {}),
        }, { onConflict: "profile_id" });
        if (fErr) throw new Error(`Founder details save failed: ${fErr.message}`);
      } else {
        const { error: iErr } = await (supabase as any).from("match_investor_profiles").upsert({
          profile_id: userId, firm_name: firmName, accreditation, avg_check_size: avgCheck, philosophy,
        }, { onConflict: "profile_id" });
        if (iErr) throw new Error(`Investor details save failed: ${iErr.message}`);
      }

      await reload();
      toast.success("Profile saved");
      navigate("/match/event");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <MatchLayout showNav={false}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl mb-2">
          {profile ? "Edit" : "Complete"} your {role} profile
        </h1>
        <p className="text-white/60 mb-8">This is what others will see during live events.</p>

        <form onSubmit={submit} className="space-y-6">
          {/* Profile photo — top, circular */}
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="avatar-input" className="relative cursor-pointer group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border border-white/15 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-serif text-white/60">{initials}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
            />
            <span className="text-xs text-white/50">Tap photo to change</span>
          </div>

          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {role === "founder" ? (
            <>
              <div><Label>Startup Name</Label><Input value={startupName} onChange={(e) => setStartupName(e.target.value)} required /></div>
              <div><Label>One-Liner</Label><Input value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} required maxLength={150} /></div>
              <div><Label>Industry (comma-separated)</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Fintech, AI" /></div>
              <div><Label>Stage</Label><Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Pre-seed, Seed, Series A…" /></div>
              <div><Label>Traction</Label><Textarea value={traction} onChange={(e) => setTraction(e.target.value)} maxLength={250} /></div>
              <div><Label>Funding Amount Seeking</Label><Input value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} placeholder="$500K" /></div>
              <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              <div><Label>Pitch Deck (PDF, optional)</Label><Input type="file" accept=".pdf" onChange={(e) => setDeckFile(e.target.files?.[0] ?? null)} /></div>
            </>
          ) : (
            <>
              <div><Label>Firm Name</Label><Input value={firmName} onChange={(e) => setFirmName(e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <div className="flex gap-2 mt-1">
                  {(["none", "accredited", "institutional"] as const).map((v) => (
                    <Button type="button" key={v} variant={accreditation === v ? "default" : "outline"} onClick={() => setAccreditation(v)} className="capitalize flex-1">{v}</Button>
                  ))}
                </div>
              </div>
              <div><Label>Average Check Size</Label><Input value={avgCheck} onChange={(e) => setAvgCheck(e.target.value)} placeholder="$50K – $250K" /></div>
              <div><Label>Investment Philosophy</Label><Textarea value={philosophy} onChange={(e) => setPhilosophy(e.target.value)} rows={4} /></div>
            </>
          )}

          <Button type="submit" disabled={saving} className="w-full bg-white text-black hover:bg-white/90">
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </form>
      </div>
    </MatchLayout>
  );
}
