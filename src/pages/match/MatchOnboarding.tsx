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

export default function MatchOnboarding() {
  const navigate = useNavigate();
  const { userId, profile, loading } = useMatchSession();
  const [saving, setSaving] = useState(false);

  // shared
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
    if (profile) setName(profile.name);
  }, [userId, profile, loading, navigate]);

  if (loading || !userId) return <MatchLayout showNav={false}><div className="p-10 text-center text-white/60">Loading…</div></MatchLayout>;

  // Ensure base profile exists; if none, we need role from somewhere. Default founder unless flagged.
  const role = profile?.role || "founder";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        const path = `${userId}/avatar-${Date.now()}-${avatarFile.name}`;
        const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (!error) avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      await (supabase as any).from("match_profiles").upsert({
        id: userId, role, name, email: (await supabase.auth.getUser()).data.user?.email, avatar_url: avatarUrl,
      });

      if (role === "founder") {
        let deckUrl: string | null = null;
        if (deckFile) {
          const path = `${userId}/deck-${Date.now()}-${deckFile.name}`;
          const { error } = await supabase.storage.from("documents").upload(path, deckFile, { upsert: true });
          if (!error) deckUrl = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
        }
        await (supabase as any).from("match_founder_profiles").upsert({
          profile_id: userId,
          startup_name: startupName,
          one_liner: oneLiner,
          industry: industry ? industry.split(",").map(s => s.trim()) : null,
          stage, traction, funding_amount: fundingAmount, location, website_url: website,
          pitch_deck_url: deckUrl,
        }, { onConflict: "profile_id" });
      } else {
        await (supabase as any).from("match_investor_profiles").upsert({
          profile_id: userId, firm_name: firmName, accreditation, avg_check_size: avgCheck, philosophy,
        }, { onConflict: "profile_id" });
      }

      toast.success("Profile saved");
      navigate("/match/event");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MatchLayout showNav={false}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl mb-2">Complete your {role} profile</h1>
        <p className="text-white/60 mb-6">This is what others will see during live events.</p>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Profile Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
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
                  {(["none","accredited","institutional"] as const).map(v => (
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
