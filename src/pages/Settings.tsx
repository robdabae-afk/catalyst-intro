import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  User,
  Camera,
  Loader2,
  MessageCircle,
  SlidersHorizontal,
  Gift,
  AlertTriangle,
  Video,
  Coins,
  RotateCcw,
  Share2,
  LogOut,
  ShieldCheck,
  Clock,
  ShieldX,
  ShieldQuestion,
  X,
  FileText,
  Users,
  Briefcase,
  Crown,
  Check,
} from "lucide-react";
import { INDUSTRIES, FUNDING_STAGES, CHECK_SIZE_OPTIONS } from "@/lib/constants";
import { SupportChat } from "@/components/SupportChat";
import { IdentityVerificationCapture } from "@/components/verification/IdentityVerificationCapture";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { useSubscription } from "@/hooks/useSubscription";
import { getProPrice } from "@/lib/stripe-constants";
import { SpotlightManager } from "@/components/SpotlightManager";
import { AdminRevenueAdjustment } from "@/components/AdminRevenueAdjustment";
import { TokenBalance } from "@/components/TokenBalance";
import { TokenPurchaseDialog } from "@/components/TokenPurchaseDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GOLD = "#C6A02C";
const GOLD_LIGHT = "#E7CB7E";
const TEXT = "#F6F5F2";
const TEXT_DIM = "#94908A";
const TEXT_LABEL = "#CFCCC5";
const TEXT_VALUE = "#F2F0EA";
const TEXT_DISABLED = "#5F5C57";
const DARK_ON_GOLD = "#2A2005";

const glass = "bg-white/[0.06] shadow-[inset_0_1px_0_1px_rgba(255,255,255,0.24)] outline outline-1 outline-white/[0.10] backdrop-blur-[10px]";
const fieldCls = `w-full h-[46px] px-[14px] rounded-[14px] ${glass} flex items-center gap-2 text-[14px]`;
const inputCls = "flex-1 min-w-0 bg-transparent outline-none text-[14px]";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingHistory, setResettingHistory] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"founder" | "investor" | null>(null);
  const [verificationCaptureOpen, setVerificationCaptureOpen] = useState(false);

  const { resetSwipeHistory } = useSwipeHistory(userId || undefined);
  const { status: idVerificationStatus, record: idVerificationRecord, refetch: refetchIdVerification } = useIdentityVerification(userId);
  const { isPro, expiresAt, hasStripeSubscription } = useSubscription(userId);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Please sign in to subscribe" });
        return;
      }
      const targetPlan = userType === "founder" ? "startup_pro" : "investor_pro";
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action: "create_checkout", plan: targetPlan },
      });
      if (error) throw error;
      if (data?.error?.includes("not configured")) {
        toast({ variant: "destructive", title: "Stripe not configured", description: "Payment processing is not yet available." });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Subscription error", description: error.message || "Failed to start checkout" });
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageBilling = async () => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", { body: { action: "create_portal" } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to open billing portal" });
    } finally {
      setSubscribing(false);
    }
  };

  const handleResetSwipeHistory = async () => {
    setResettingHistory(true);
    const success = await resetSwipeHistory();
    setResettingHistory(false);
    if (success) {
      toast({ title: "Swipe history reset", description: "You can now see all profiles again." });
    } else {
      toast({ variant: "destructive", title: "Failed to reset", description: "Please try again." });
    }
  };

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Founder fields
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [traction, setTraction] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [founderBannerUrl, setFounderBannerUrl] = useState("");
  const [pitchDeckUrl, setPitchDeckUrl] = useState("");
  const [pitchDeckVisibility, setPitchDeckVisibility] = useState<"public" | "private">("public");
  const [videoUrl, setVideoUrl] = useState("");
  const [fundingAmount, setFundingAmount] = useState("");
  // Phase D: structured raise ask
  const [raiseAmount, setRaiseAmount] = useState("");
  const [raiseType, setRaiseType] = useState("");
  const [targetCloseDate, setTargetCloseDate] = useState("");
  const [valuationCapTarget, setValuationCapTarget] = useState("");
  const [fundraisingStatus, setFundraisingStatus] = useState("actively_raising");
  const [statusNote, setStatusNote] = useState("");
  const [mrr, setMrr] = useState("");
  const [backedBy, setBackedBy] = useState("");
  const [einNumber, setEinNumber] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState("");
  const [teamMembers, setTeamMembers] = useState<{ name: string; title: string }[]>([]);
  const [headcount, setHeadcount] = useState("");
  const [growthMom, setGrowthMom] = useState("");
  const [payingCustomers, setPayingCustomers] = useState("");
  const [operationsStartDate, setOperationsStartDate] = useState("");
  const [teamFullTime, setTeamFullTime] = useState(false);

  // Phase D: privacy (CCPA opt-out) — applies to both roles
  const [ccpaDoNotSell, setCcpaDoNotSell] = useState(false);

  // Investor fields
  const [firmName, setFirmName] = useState("");
  const [position, setPosition] = useState("");
  const [investorBannerUrl, setInvestorBannerUrl] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [accreditationStatus, setAccreditationStatus] = useState("");
  const [investmentCount, setInvestmentCount] = useState("");
  const [notablePortfolio, setNotablePortfolio] = useState("");
  const [sectorsOfInterest, setSectorsOfInterest] = useState<string[]>([]);
  const [typicalCheckSize, setTypicalCheckSize] = useState("");
  const [investmentThesis, setInvestmentThesis] = useState("");
  const [portfolioCompanies, setPortfolioCompanies] = useState<{ name: string; logo_url: string | null }[]>([]);
  const [responseRate, setResponseRate] = useState("");
  const [avgReplyTime, setAvgReplyTime] = useState("");
  const [responsivenessStatus, setResponsivenessStatus] = useState("");
  const [dealsLast12mo, setDealsLast12mo] = useState("");
  const [totalInvested, setTotalInvested] = useState("");
  const [notableExits, setNotableExits] = useState("");
  const [uploadingLogoIndex, setUploadingLogoIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      if (!profile) {
        navigate("/");
        return;
      }

      setUserType(profile.user_type);
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone((profile as any).phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setCcpaDoNotSell(Boolean((profile as any).ccpa_do_not_sell));

      if (profile.user_type === "founder") {
        const { data: founderProfile } = await supabase
          .from("founder_profiles")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (founderProfile) {
          setStartupName(founderProfile.startup_name || "");
          setOneLiner(founderProfile.one_liner || "");
          setSelectedIndustries(founderProfile.industry || []);
          setTraction(founderProfile.traction || "");
          setPreferredCity(founderProfile.preferred_city || "");
          setCompanyName(founderProfile.company_name || "");
          setCompanyState(founderProfile.company_state || "");
          setCompanyAddress(founderProfile.company_address || "");
          setFounderBannerUrl(founderProfile.banner_url || "");
          setPitchDeckUrl(founderProfile.pitch_deck_url || "");
          setPitchDeckVisibility((founderProfile.pitch_deck_visibility as "public" | "private") || "public");
          setVideoUrl(founderProfile.video_url || "");
          setFundingAmount(founderProfile.funding_amount || "");
          setMrr(founderProfile.mrr || "");
          setBackedBy(founderProfile.backed_by || "");
          setEinNumber(founderProfile.ein_number || "");
          setLocation(founderProfile.location || "");
          setStage(founderProfile.stage || "");
          setTeamMembers((founderProfile as any).team_members || []);
          setHeadcount((founderProfile as any).headcount?.toString() || "");
          setGrowthMom((founderProfile as any).growth_mom || "");
          setPayingCustomers((founderProfile as any).paying_customers?.toString() || "");
          setOperationsStartDate((founderProfile as any).operations_start_date || "");
          setTeamFullTime(Boolean((founderProfile as any).team_full_time));
          // Phase D
          setRaiseAmount((founderProfile as any).raise_amount?.toString() || "");
          setRaiseType((founderProfile as any).raise_type || "");
          setTargetCloseDate((founderProfile as any).target_close_date || "");
          setValuationCapTarget((founderProfile as any).valuation_cap_target?.toString() || "");
          setFundraisingStatus((founderProfile as any).fundraising_status || "actively_raising");
          setStatusNote((founderProfile as any).status_note || "");
        }
      } else {
        const { data: investorProfile } = await supabase
          .from("investor_profiles")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle();

        if (investorProfile) {
          setFirmName(investorProfile.firm_name || "");
          setPosition(investorProfile.position || "");
          setInvestorBannerUrl(investorProfile.banner_url || "");
          setInvestorType(investorProfile.investor_type || "");
          setAccreditationStatus(investorProfile.accreditation_status || "");
          setInvestmentCount(investorProfile.investment_count?.toString() || "");
          setNotablePortfolio(investorProfile.notable_portfolio || "");
          setSectorsOfInterest(investorProfile.sectors_of_interest || []);
          setTypicalCheckSize(investorProfile.typical_check_size || "");
          setInvestmentThesis(investorProfile.investment_thesis || "");
          setPortfolioCompanies((investorProfile as any).portfolio_companies || []);
          setResponseRate((investorProfile as any).response_rate?.toString() || "");
          setAvgReplyTime((investorProfile as any).avg_reply_time || "");
          setResponsivenessStatus((investorProfile as any).responsiveness_status || "");
          setDealsLast12mo((investorProfile as any).deals_last_12mo?.toString() || "");
          setTotalInvested((investorProfile as any).total_invested || "");
          setNotableExits((investorProfile as any).notable_exits?.toString() || "");
        }
      }

      setLoading(false);
    };

    loadUserData();
  }, [navigate]);

  // Deep-link support: scroll to and briefly highlight the section named in the URL hash
  // (used by the onboarding checklist to jump straight to the relevant field group).
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "box-shadow 0.3s ease";
    el.style.boxShadow = `0 0 0 2px ${GOLD}`;
    const timer = setTimeout(() => {
      el.style.boxShadow = "";
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({ title: "Avatar uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePortfolioLogoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingLogoIndex(index);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/portfolio-${index}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setPortfolioCompanies((prev) => prev.map((c, idx) => (idx === index ? { ...c, logo_url: publicUrl } : c)));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logo upload failed", description: error.message });
    } finally {
      setUploadingLogoIndex(null);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/banner.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (userType === "founder") {
        setFounderBannerUrl(publicUrl);
      } else {
        setInvestorBannerUrl(publicUrl);
      }
      toast({ title: "Banner uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please select a video under 100MB" });
      return;
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file type", description: "Please select an MP4, WebM, or MOV video" });
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/pitch-video.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("videos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      toast({ title: "Video uploaded successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl,
          linkedin_url: linkedinUrl,
          phone: phone || null,
          has_pending_update: true,
          last_profile_update_at: new Date().toISOString(),
          ccpa_do_not_sell: ccpaDoNotSell,
          ccpa_updated_at: new Date().toISOString(),
        } as any)
        .eq("id", userId);

      if (profileError) throw profileError;

      if (userType === "founder") {
        const { error: founderError } = await supabase
          .from("founder_profiles")
          .update({
            startup_name: startupName,
            one_liner: oneLiner,
            industry: selectedIndustries,
            traction,
            preferred_city: preferredCity,
            company_name: companyName,
            company_state: companyState,
            company_address: companyAddress,
            banner_url: founderBannerUrl,
            pitch_deck_url: pitchDeckUrl,
            pitch_deck_visibility: pitchDeckVisibility,
            video_url: videoUrl || null,

            funding_amount: fundingAmount || null,
            mrr: mrr || null,
            backed_by: backedBy || null,
            ein_number: einNumber || null,
            location: location || null,
            stage: (stage || null) as any,
            team_members: teamMembers.filter((m) => m.name.trim() || m.title.trim()) as any,
            headcount: headcount ? parseInt(headcount) : null,
            growth_mom: growthMom || null,
            paying_customers: payingCustomers ? parseInt(payingCustomers) : null,
            operations_start_date: operationsStartDate || null,
            team_full_time: teamFullTime,
            // Phase D
            raise_amount: raiseAmount ? parseFloat(raiseAmount) : null,
            raise_type: raiseType || null,
            target_close_date: targetCloseDate || null,
            valuation_cap_target: valuationCapTarget ? parseFloat(valuationCapTarget) : null,
            fundraising_status: fundraisingStatus || "actively_raising",
            status_note: statusNote || null,
          } as any)
          .eq("profile_id", userId);

        if (founderError) throw founderError;

        // Phase D: auto-snapshot vitals monthly
        if (mrr || headcount) {
          const firstOfMonth = new Date();
          firstOfMonth.setDate(1);
          firstOfMonth.setHours(0, 0, 0, 0);
          const snapshotMonth = firstOfMonth.toISOString().slice(0, 10);
          // Fire-and-forget, upsert-style via unique constraint
          (async () => {
            await (supabase as any).from("mrr_snapshots").upsert(
              {
                founder_id: userId,
                mrr_value: mrr || null,
                headcount: headcount ? parseInt(headcount) : null,
                snapshot_month: snapshotMonth,
                source: "profile_save",
              },
              { onConflict: "founder_id,snapshot_month,source" }
            );
          })();
        }
      } else {
        const { error: investorError } = await supabase
          .from("investor_profiles")
          .update({
            firm_name: firmName,
            position: position,
            banner_url: investorBannerUrl,
            investor_type: investorType || null,
            accreditation_status: accreditationStatus || null,
            investment_count: investmentCount ? parseInt(investmentCount) : null,
            notable_portfolio: notablePortfolio || null,
            sectors_of_interest: sectorsOfInterest,
            typical_check_size: typicalCheckSize || null,
            investment_thesis: investmentThesis || null,
            portfolio_companies: portfolioCompanies.filter((c) => c.name.trim()) as any,
            response_rate: responseRate ? parseInt(responseRate) : null,
            avg_reply_time: avgReplyTime || null,
            responsiveness_status: responsivenessStatus || null,
            deals_last_12mo: dealsLast12mo ? parseInt(dealsLast12mo) : null,
            total_invested: totalInvested || null,
            notable_exits: notableExits ? parseInt(notableExits) : null,
          } as any)
          .eq("profile_id", userId);

        if (investorError) throw investorError;
      }

      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleShareProfile = async () => {
    if (!userId) return;
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({ title: "Link copied to clipboard!", description: "Share this link to invite others to view your profile." });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy", description: "Please try again." });
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "#0A0A0C" }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const bannerUrl = userType === "founder" ? founderBannerUrl : investorBannerUrl;
  const planDetails = getProPrice(userType ?? "founder");

  return (
    <div
      className="min-h-[100dvh] flex justify-center"
      style={{
        background:
          "radial-gradient(ellipse 100% 55% at 26% 4%, rgba(198,160,44,0.10) 0%, rgba(198,160,44,0) 44%), radial-gradient(ellipse 90% 45% at 88% 100%, rgba(198,160,44,0.07) 0%, rgba(198,160,44,0) 50%), #0A0A0C",
      }}
    >
      <div className="w-full max-w-[422px] px-4 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 pt-14 pb-4">
          <button onClick={() => navigate(-1)} className="shrink-0" aria-label="Back">
            <ArrowLeft size={22} color={TEXT} strokeWidth={1.7} />
          </button>
          <h1 className="flex-1" style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, color: TEXT }}>
            Profile Settings
          </h1>
          <button
            onClick={handleLogout}
            className={`h-9 px-4 rounded-full flex items-center gap-1.5 ${glass}`}
          >
            <LogOut size={13} color={TEXT_LABEL} strokeWidth={1.8} />
            <span style={{ color: TEXT_LABEL, fontSize: 12.5, fontWeight: 500 }}>Log out</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Share my profile */}
          <Section icon={<Share2 size={16} color={GOLD} strokeWidth={1.8} />} title="Share my profile">
            <p style={descCls}>Copy your unique CATALYST profile link to share with investors, founders, or anyone.</p>
            <PillPrimary onClick={handleShareProfile} icon={<Share2 size={14} strokeWidth={2} />}>
              Copy link
            </PillPrimary>
          </Section>

          {/* Profile photos */}
          <Section id="section-photos" icon={<Camera size={16} color={GOLD} strokeWidth={1.8} />} title="Profile photos">
            <p style={descCls}>Update your avatar and banner image.</p>

            <FieldLabel>Banner image (optional)</FieldLabel>
            <div
              className={`relative h-[114px] rounded-[16px] cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-1.5 ${glass}`}
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={22} color={GOLD} strokeWidth={1.6} />
                  <span style={{ color: TEXT_DIM, fontSize: 12.5 }}>Click to upload a banner</span>
                  <span style={{ color: TEXT_DISABLED, fontSize: 11 }}>JPG or PNG, 1600 × 500 recommended</span>
                </>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingBanner ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />

            <FieldLabel>Profile photo</FieldLabel>
            <div className="flex items-center gap-3.5">
              <div
                className={`relative w-16 h-16 shrink-0 rounded-full cursor-pointer group overflow-hidden flex items-center justify-center ${glass}`}
                style={{ outline: `1px solid ${GOLD}`, outlineOffset: -1 }}
                onClick={() => document.getElementById("avatar-upload")?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={26} color={GOLD} strokeWidth={1.6} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span style={{ color: TEXT_DIM, fontSize: 12.5 }}>Click to upload a new profile photo</span>
            </div>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </Section>

          {/* Identity verification */}
          <Section id="section-verification" icon={<ShieldCheck size={16} color={GOLD} strokeWidth={1.8} />} title="Identity verification">
            <p style={descCls}>Verify your identity with a government-issued ID and a selfie. Reviewed manually by our team.</p>

            {idVerificationStatus === "approved" && (
              <div className={`flex items-center gap-3 p-3.5 rounded-[16px] ${glass}`}>
                <div className="w-8 h-8 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: "rgba(94,201,142,0.12)" }}>
                  <ShieldCheck size={15} color="#5EC98E" strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ color: "#5EC98E", fontSize: 13.5, fontWeight: 600 }}>Verified</p>
                  <p style={{ color: TEXT_DIM, fontSize: 11.5 }}>Your identity has been confirmed.</p>
                </div>
              </div>
            )}
            {idVerificationStatus === "pending" && (
              <div className={`flex items-center gap-3 p-3.5 rounded-[16px] ${glass}`}>
                <div className={`w-8 h-8 rounded-[16px] flex items-center justify-center shrink-0 ${glass}`}>
                  <Clock size={15} color={GOLD} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ color: GOLD_LIGHT, fontSize: 13.5, fontWeight: 600 }}>Pending review</p>
                  <p style={{ color: TEXT_DIM, fontSize: 11.5 }}>
                    Submitted {idVerificationRecord ? new Date(idVerificationRecord.submitted_at).toLocaleDateString() : ""} — we'll notify you once it's reviewed.
                  </p>
                </div>
              </div>
            )}
            {idVerificationStatus === "rejected" && (
              <>
                <div className={`flex items-center gap-3 p-3.5 rounded-[16px] ${glass}`}>
                  <div className={`w-8 h-8 rounded-[16px] flex items-center justify-center shrink-0 ${glass}`}>
                    <ShieldX size={15} color="#E79A6C" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ color: "#E79A6C", fontSize: 13.5, fontWeight: 600 }}>Not approved</p>
                    {idVerificationRecord?.rejection_reason && (
                      <p style={{ color: TEXT_DIM, fontSize: 11.5 }}>{idVerificationRecord.rejection_reason}</p>
                    )}
                  </div>
                </div>
                <PillPrimary onClick={() => setVerificationCaptureOpen(true)} icon={<ShieldCheck size={14} strokeWidth={2} />}>
                  Resubmit
                </PillPrimary>
              </>
            )}
            {idVerificationStatus === "unverified" && (
              <>
                <div className={`flex items-center gap-3 p-3.5 rounded-[16px] ${glass}`}>
                  <div className={`w-8 h-8 rounded-[16px] flex items-center justify-center shrink-0 ${glass}`}>
                    <ShieldQuestion size={15} color={GOLD} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ color: GOLD_LIGHT, fontSize: 13.5, fontWeight: 600 }}>Not verified</p>
                    <p style={{ color: TEXT_DIM, fontSize: 11.5 }}>Required to unlock full platform access.</p>
                  </div>
                </div>
                <PillPrimary onClick={() => setVerificationCaptureOpen(true)} icon={<ShieldCheck size={14} strokeWidth={2} />}>
                  Verify now
                </PillPrimary>
              </>
            )}
          </Section>

          {/* Discovery filters */}
          <Section icon={<SlidersHorizontal size={16} color={GOLD} strokeWidth={1.8} />} title="Discovery filters">
            <p style={descCls}>Set preferences for the profiles you want to see.</p>
            <PillSecondary onClick={() => navigate("/filters")} icon={<SlidersHorizontal size={14} strokeWidth={1.8} />}>
              Manage filters
            </PillSecondary>
          </Section>

          {/* Basic information */}
          <Section title="Basic information">
            <TextField label="Full name" value={name} onChange={setName} />
            <TextField label="LinkedIn profile URL" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="linkedin.com/in/..." />
            <TextField label="Email" value={email} onChange={() => {}} disabled />
            <TextField label="Phone" value={phone} onChange={setPhone} placeholder="Add a phone number" />
          </Section>

          {/* Founder-specific */}
          {userType === "founder" && (
            <Section id="section-startup" title="Startup details">
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Startup name" value={startupName} onChange={setStartupName} />
                <TextField label="Location (HQ)" value={location} onChange={setLocation} placeholder="City, State" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <SelectField
                  label="MRR / revenue"
                  value={mrr}
                  onChange={setMrr}
                  placeholder="Select MRR"
                  options={[
                    { value: "Pre-revenue", label: "Pre-revenue" },
                    { value: "$0 - $1k", label: "$0 - $1k" },
                    { value: "$1k - $10k", label: "$1k - $10k" },
                    { value: "$10k - $50k", label: "$10k - $50k" },
                    { value: "$50k+", label: "$50k+" },
                  ]}
                />
                <TextField label="Backed by" value={backedBy} onChange={setBackedBy} placeholder="e.g. YC S23" />
              </div>
              <SelectField
                label="Company stage"
                value={stage}
                onChange={setStage}
                placeholder="Select stage"
                options={FUNDING_STAGES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <FieldLabel>Industries</FieldLabel>
              <IndustryGrid
                selected={selectedIndustries}
                onToggle={(ind) =>
                  setSelectedIndustries((prev) => (prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]))
                }
              />
              <TextField label="One-liner" value={oneLiner} onChange={setOneLiner} placeholder="A brief description of your startup" />
              <FieldLabel>Traction</FieldLabel>
              <Textarea
                value={traction}
                onChange={(e) => e.target.value.length <= 250 && setTraction(e.target.value)}
                placeholder="Key metrics, users, revenue, etc."
                rows={3}
                className={`${glass} border-0 rounded-[16px] text-[14px] resize-none`}
                style={{ color: TEXT_VALUE }}
              />
              <p style={{ color: TEXT_DISABLED, fontSize: 11 }}>{traction.length} / 250 characters</p>
              <TextField label="Preferred city" value={preferredCity} onChange={setPreferredCity} placeholder="City for meetings" />

              <Divider />
              <SubTitle>Team</SubTitle>
              {teamMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={member.name}
                    onChange={(e) => setTeamMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, name: e.target.value } : m)))}
                    placeholder="Name"
                    className={fieldCls}
                    style={{ color: TEXT_VALUE }}
                  />
                  <input
                    value={member.title}
                    onChange={(e) => setTeamMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, title: e.target.value } : m)))}
                    placeholder="Title, e.g. CEO · ex-Flexport"
                    className={fieldCls}
                    style={{ color: TEXT_VALUE }}
                  />
                  <button onClick={() => setTeamMembers((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0" aria-label="Remove">
                    <X size={16} color="#E79A6C" />
                  </button>
                </div>
              ))}
              <PillSecondary onClick={() => setTeamMembers((prev) => [...prev, { name: "", title: "" }])} icon={<Users size={14} strokeWidth={1.8} />}>
                Add team member
              </PillSecondary>
              <TextField label="Headcount" value={headcount} onChange={setHeadcount} placeholder="e.g. 7" type="number" />

              <Divider />
              <SubTitle>Due diligence</SubTitle>
              <TextField label="EIN number" value={einNumber} onChange={setEinNumber} placeholder="XX-XXXXXXX" />
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Legal company name" value={companyName} onChange={setCompanyName} />
                <TextField label="State of incorporation" value={companyState} onChange={setCompanyState} placeholder="e.g. Delaware" />
              </div>
              <TextField label="Company address" value={companyAddress} onChange={setCompanyAddress} />
            </Section>
          )}

          {userType === "founder" && (
            <Section icon={<FileText size={16} color={GOLD} strokeWidth={1.8} />} title="Pitch deck">
              <TextField label="Pitch deck URL" value={pitchDeckUrl} onChange={setPitchDeckUrl} placeholder="https://..." />
              <FieldLabel>Who can see your pitch deck?</FieldLabel>
              <RadioGroup value={pitchDeckVisibility} onValueChange={(v: "public" | "private") => setPitchDeckVisibility(v)} className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <RadioGroupItem value="public" className="w-[15px] h-[15px]" style={{ borderColor: GOLD, color: GOLD }} />
                  <span style={{ color: TEXT_VALUE, fontSize: 13 }}>Public on Discover — visible to all investors</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <RadioGroupItem value="private" className="w-[15px] h-[15px]" />
                  <span style={{ color: TEXT_LABEL, fontSize: 13 }}>Private — share manually or upon request</span>
                </label>
              </RadioGroup>
            </Section>
          )}

          {userType === "founder" && (
            <Section icon={<Video size={16} color={GOLD} strokeWidth={1.8} />} title="Video profile (optional)">
              <p style={descCls}>Add a video to make your profile stand out. This replaces the banner image on your swipe card.</p>
              <FieldLabel>Upload video</FieldLabel>
              <div
                className={`relative h-[114px] rounded-[16px] cursor-pointer group overflow-hidden flex flex-col items-center justify-center gap-1.5 ${glass}`}
                onClick={() => document.getElementById("video-upload")?.click()}
              >
                {videoUrl ? (
                  <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover" muted />
                ) : (
                  <>
                    <Video size={22} color={GOLD} strokeWidth={1.6} />
                    <span style={{ color: TEXT_DIM, fontSize: 12.5 }}>Click to upload video (max 100MB)</span>
                    <span style={{ color: TEXT_DISABLED, fontSize: 11 }}>MP4, WebM or MOV</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingVideo ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
                </div>
              </div>
              <input id="video-upload" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" className="hidden" onChange={handleVideoUpload} />
              {videoUrl && (
                <button onClick={() => setVideoUrl("")} style={{ color: "#E79A6C", fontSize: 12 }} className="self-start">
                  Remove video
                </button>
              )}
              <TextField label="Video URL" value={videoUrl} onChange={setVideoUrl} placeholder="https://… (mp4, webm or hosted link)" />
              <TextField label="Funding tagline (display)" value={fundingAmount} onChange={setFundingAmount} placeholder="e.g. Raising $2M" />
              <p style={{ color: TEXT_DISABLED, fontSize: 11 }}>Shown on your video card. For structured details use the Fundraising section below.</p>
            </Section>
          )}

          {/* Phase D: Structured fundraising ask + status */}
          {userType === "founder" && (
            <Section id="section-fundraising" title="Fundraising">
              <SelectField
                label="Status"
                value={fundraisingStatus}
                onChange={setFundraisingStatus}
                placeholder="Select status"
                options={[
                  { value: "actively_raising", label: "🟢 Actively raising" },
                  { value: "paused",           label: "⏸ Paused (temporarily off market)" },
                  { value: "closed_round",     label: "✅ Just closed a round" },
                  { value: "stealth",          label: "🕶 In stealth / not fundraising" },
                  { value: "pivoted",          label: "🔄 Pivoting" },
                  { value: "shutdown",         label: "🛑 Shut down" },
                ]}
              />
              <p style={{ color: TEXT_DISABLED, fontSize: 11 }}>
                If not "Actively raising," your profile will be hidden from investor discovery until you set it back.
              </p>
              {fundraisingStatus !== "actively_raising" && (
                <TextField
                  label="Status note (optional, for context)"
                  value={statusNote}
                  onChange={setStatusNote}
                  placeholder={
                    fundraisingStatus === "paused" ? "e.g. Waiting for Q1 close"
                    : fundraisingStatus === "closed_round" ? "e.g. $3M seed led by Foo Ventures"
                    : "Anything worth remembering"
                  }
                />
              )}
              {fundraisingStatus === "actively_raising" && (
                <>
                  <Divider />
                  <SubTitle>Round ask</SubTitle>
                  <div className="grid grid-cols-2 gap-2.5">
                    <TextField
                      label="Amount raising (USD)"
                      value={raiseAmount}
                      onChange={setRaiseAmount}
                      placeholder="2000000"
                      type="number"
                    />
                    <SelectField
                      label="Instrument"
                      value={raiseType}
                      onChange={setRaiseType}
                      placeholder="Select"
                      options={[
                        { value: "SAFE",              label: "SAFE" },
                        { value: "equity",            label: "Priced equity" },
                        { value: "convertible_note",  label: "Convertible note" },
                        { value: "revenue_based",     label: "Revenue-based" },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <TextField
                      label="Valuation cap (USD)"
                      value={valuationCapTarget}
                      onChange={setValuationCapTarget}
                      placeholder="10000000"
                      type="number"
                    />
                    <TextField
                      label="Target close date"
                      value={targetCloseDate}
                      onChange={setTargetCloseDate}
                      placeholder="YYYY-MM-DD"
                      type="date"
                    />
                  </div>
                  <p style={{ color: TEXT_DISABLED, fontSize: 11 }}>
                    Structured fields let investors filter by size, instrument, and timeline.
                  </p>
                </>
              )}
            </Section>
          )}

          {/* Phase D: Privacy — CCPA opt-out */}
          <Section id="section-privacy" title="Privacy">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p style={{ color: TEXT_VALUE, fontSize: 13.5, fontWeight: 500 }}>
                  Do Not Sell or Share My Personal Information
                </p>
                <p style={{ color: TEXT_DIM, fontSize: 12, marginTop: 4 }}>
                  Catalyst may include anonymized, aggregated statistics from platform activity in
                  market intelligence reports. Toggling this on excludes your data from all such
                  reports, feeds, and third-party disclosures. Your platform experience is
                  unchanged.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCcpaDoNotSell((v) => !v)}
                className="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  background: ccpaDoNotSell ? GOLD : "rgba(255,255,255,0.15)",
                }}
                aria-pressed={ccpaDoNotSell}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: ccpaDoNotSell ? "translateX(24px)" : "translateX(4px)" }}
                />
              </button>
            </div>
          </Section>

          {/* Investor-specific */}
          {userType === "investor" && (
            <Section id="section-investor" title="Investor details">
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Firm name (optional)" value={firmName} onChange={setFirmName} placeholder="Leave blank if angel" />
                <TextField label="Position (optional)" value={position} onChange={setPosition} placeholder="Managing Partner" />
              </div>
              <SelectField
                label="Investor type"
                value={investorType}
                onChange={setInvestorType}
                placeholder="Select type"
                options={[
                  { value: "Retail", label: "Retail Investor" },
                  { value: "Angel", label: "Angel Investor" },
                  { value: "Accredited", label: "Accredited Individual" },
                  { value: "VC", label: "Venture Capital (VC)" },
                  { value: "PE", label: "Private Equity (PE)" },
                  { value: "Family Office", label: "Family Office" },
                ]}
              />
              <SelectField
                label="Accreditation status"
                value={accreditationStatus}
                onChange={setAccreditationStatus}
                placeholder="Select status"
                options={[
                  { value: "Accredited", label: "Accredited" },
                  { value: "Non-Accredited", label: "Non-Accredited" },
                  { value: "Qualified Purchaser", label: "Qualified Purchaser" },
                ]}
              />
              <SelectField
                label="Typical check size"
                value={typicalCheckSize}
                onChange={setTypicalCheckSize}
                placeholder="Select range"
                options={CHECK_SIZE_OPTIONS.map((c) => ({ value: c, label: c }))}
              />
              <FieldLabel>Sectors of interest</FieldLabel>
              <IndustryGrid
                selected={sectorsOfInterest}
                onToggle={(ind) =>
                  setSectorsOfInterest((prev) => (prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]))
                }
              />
              <FieldLabel>Investment thesis</FieldLabel>
              <Textarea
                value={investmentThesis}
                onChange={(e) => setInvestmentThesis(e.target.value)}
                placeholder="What you back, and why."
                rows={3}
                className={`${glass} border-0 rounded-[16px] text-[14px] resize-none`}
                style={{ color: TEXT_VALUE }}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Total investments (est.)" value={investmentCount} onChange={setInvestmentCount} placeholder="e.g. 5" type="number" />
                <TextField label="Notable portfolio" value={notablePortfolio} onChange={setNotablePortfolio} placeholder="e.g. Stripe, Airbnb" />
              </div>

              <Divider />
              <SubTitle>Responsiveness</SubTitle>
              <div className="grid grid-cols-2 gap-2.5">
                <TextField label="Response rate (%)" value={responseRate} onChange={setResponseRate} placeholder="98" type="number" />
                <TextField label="Avg. reply time" value={avgReplyTime} onChange={setAvgReplyTime} placeholder="2 hours" />
              </div>
              <TextField label="Active status" value={responsivenessStatus} onChange={setResponsivenessStatus} placeholder="This week" />

              <Divider />
              <SubTitle>Portfolio stats</SubTitle>
              <div className="grid grid-cols-3 gap-2">
                <TextField label="Deals (12mo)" value={dealsLast12mo} onChange={setDealsLast12mo} placeholder="12" type="number" />
                <TextField label="Total invested" value={totalInvested} onChange={setTotalInvested} placeholder="$28M" />
                <TextField label="Notable exits" value={notableExits} onChange={setNotableExits} placeholder="2" type="number" />
              </div>

              <Divider />
              <SubTitle>Portfolio companies</SubTitle>
              <p style={descCls}>Shown on your full profile as recent investments.</p>
              {portfolioCompanies.map((company, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className={`relative w-11 h-11 shrink-0 rounded-full cursor-pointer group overflow-hidden flex items-center justify-center ${glass}`}
                    onClick={() => document.getElementById(`portfolio-logo-upload-${i}`)?.click()}
                  >
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={16} color={TEXT_DIM} strokeWidth={1.6} />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingLogoIndex === i ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <input
                    id={`portfolio-logo-upload-${i}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePortfolioLogoUpload(i, e)}
                  />
                  <input
                    value={company.name}
                    onChange={(e) => setPortfolioCompanies((prev) => prev.map((c, idx) => (idx === i ? { ...c, name: e.target.value } : c)))}
                    placeholder="Company name"
                    className={fieldCls}
                    style={{ color: TEXT_VALUE }}
                  />
                  <button onClick={() => setPortfolioCompanies((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0" aria-label="Remove">
                    <X size={16} color="#E79A6C" />
                  </button>
                </div>
              ))}
              <PillSecondary onClick={() => setPortfolioCompanies((prev) => [...prev, { name: "", logo_url: null }])} icon={<Briefcase size={14} strokeWidth={1.8} />}>
                Add portfolio company
              </PillSecondary>
            </Section>
          )}

          {/* Pro upsell */}
          <Section icon={<Crown size={16} color={GOLD} strokeWidth={1.8} />} title={isPro ? planDetails.name : `${userType === "investor" ? "Investor" : "Startup"} Pro`}>
            {isPro ? (
              <>
                <p style={descCls}>Your subscription is active{expiresAt ? ` until ${expiresAt.toLocaleDateString()}` : ""}.</p>
                {hasStripeSubscription ? (
                  <PillSecondary onClick={handleManageBilling} disabled={subscribing} icon={subscribing ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} strokeWidth={1.8} />}>
                    Manage billing
                  </PillSecondary>
                ) : (
                  <p style={descCls}>Your subscription was assigned by an administrator. Contact support for billing inquiries.</p>
                )}
              </>
            ) : (
              <>
                <p style={descCls}>Upgrade to Pro for an ad-free experience and a weekly spotlight.</p>
                {["No ad profiles in your swipe feed", "No 3-second delay on ads", "One weekly spotlight (8 hours) to promote yourself", "Priority visibility to matches"].map((b) => (
                  <div key={b} className="flex items-center gap-2.5">
                    <Check size={13} color={GOLD} strokeWidth={2} className="shrink-0" />
                    <span style={{ color: TEXT_VALUE, fontSize: 13 }}>{b}</span>
                  </div>
                ))}
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600, color: TEXT }}>{planDetails.displayPrice.split("/")[0]}</span>
                  <span style={{ color: TEXT_DIM, fontSize: 13 }}>/ month</span>
                </div>
                <PillPrimary onClick={handleSubscribe} disabled={subscribing} icon={subscribing ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} strokeWidth={2} />}>
                  Upgrade to Pro
                </PillPrimary>
              </>
            )}
          </Section>

          {userId && userType && <SpotlightManager userId={userId} userType={userType} />}

          {/* Tokens */}
          {userId && (
            <Section icon={<Coins size={16} color={GOLD} strokeWidth={1.8} />} title="Tokens">
              <p style={descCls}>Manage your token balance and purchase history.</p>
              <TokenBalance userId={userId} variant="default" showPurchaseButton={false} />
              <TokenPurchaseDialog userId={userId} />
              <Divider />
              <FieldLabel>Transaction history</FieldLabel>
              <p style={{ color: TEXT_DIM, fontSize: 12, lineHeight: "18px" }}>No transactions yet.</p>
            </Section>
          )}

          {/* Discovery settings */}
          <Section icon={<SlidersHorizontal size={16} color={GOLD} strokeWidth={1.8} />} title="Discovery settings">
            <p style={descCls}>Manage your swipe history and profile visibility.</p>
            <FieldLabel>Reset swipe history</FieldLabel>
            <p style={{ color: TEXT_DIM, fontSize: 12, lineHeight: "18px" }}>
              Profiles you have swiped on reappear after 14 days. Reset to see all profiles immediately, matches excluded.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <PillSecondary disabled={resettingHistory} icon={resettingHistory ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} strokeWidth={1.8} />}>
                    Reset swipe history
                  </PillSecondary>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Swipe History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will let you see all profiles again that you've previously swiped on. Your matches and conversations will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSwipeHistory}>Reset History</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>

          {/* Refer and earn */}
          <Section icon={<Gift size={16} color={GOLD} strokeWidth={1.8} />} title="Refer and earn">
            <p style={descCls}>Invite friends and unlock rewards.</p>
            <PillSecondary onClick={() => navigate("/referrals")} icon={<Gift size={14} strokeWidth={1.8} />}>
              View referral dashboard
            </PillSecondary>
          </Section>

          {/* Important notice */}
          <div
            className="rounded-[22px] p-[17px] flex flex-col gap-2"
            style={{ background: "rgba(198,160,44,0.07)", outline: "1px solid rgba(198,160,44,0.32)", outlineOffset: -1 }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} color={GOLD_LIGHT} strokeWidth={1.8} />
              <span style={{ color: GOLD_LIGHT, fontSize: 18, fontWeight: 700 }}>Important notice</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: "19.2px" }}>
              <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>
                This platform does not handle or facilitate the exchange of funds or securities.
              </span>
              <span style={{ color: TEXT_LABEL }}>
                {" "}
                All financial transactions, SAFE agreements and investment transfers must be conducted off-platform through
                proper legal and financial channels. This platform is for networking, tracking and template generation
                purposes only.
              </span>
            </p>
          </div>

          {/* Help and support */}
          <Section icon={<MessageCircle size={16} color={GOLD} strokeWidth={1.8} />} title="Help and support">
            <p style={descCls}>Get help from our support team.</p>
            <PillSecondary onClick={() => setSupportChatOpen(true)} icon={<MessageCircle size={14} strokeWidth={1.8} />}>
              Contact support
            </PillSecondary>
          </Section>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[52px] rounded-full flex items-center justify-center gap-2"
            style={{ background: GOLD, color: DARK_ON_GOLD, fontSize: 15, fontWeight: 600 }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={15} strokeWidth={2.2} />}
            {saving ? "Saving..." : "Save changes"}
          </button>

          {userId && <SupportChat open={supportChatOpen} onOpenChange={setSupportChatOpen} userId={userId} />}
          {isAdmin && userId && <AdminRevenueAdjustment userId={userId} />}
        </div>
      </div>

      <IdentityVerificationCapture
        open={verificationCaptureOpen}
        onClose={() => setVerificationCaptureOpen(false)}
        userId={userId}
        onSubmitted={refetchIdVerification}
      />
    </div>
  );
};

/* ---------- Shared styled sub-components ---------- */

const descCls: React.CSSProperties = { color: TEXT_DIM, fontSize: 12, lineHeight: "18px" };

function Section({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`rounded-[22px] p-[17px] flex flex-col gap-3 ${glass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span style={{ color: TEXT, fontSize: 18, fontWeight: 700 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ color: TEXT_LABEL, fontSize: 12 }}>{children}</p>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600 }}>{children}</h3>;
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.09)" }} />;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldCls}
        style={{ color: disabled ? TEXT_DIM : value ? TEXT_VALUE : TEXT_DISABLED, cursor: disabled ? "default" : "text" }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`${fieldCls} justify-between [&>svg]:opacity-100 [&>svg]:text-[#94908A]`}>
          <SelectValue placeholder={placeholder} style={{ color: value ? TEXT_VALUE : TEXT_DISABLED }} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function IndustryGrid({ selected, onToggle }: { selected: string[]; onToggle: (ind: string) => void }) {
  return (
    <div className={`rounded-[16px] p-3.5 max-h-56 overflow-y-auto grid grid-cols-2 gap-x-3 gap-y-2.5 ${glass}`}>
      {INDUSTRIES.map((ind) => {
        const checked = selected.includes(ind);
        return (
          <label key={ind} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(ind)}
              className="w-[15px] h-[15px] rounded-full border-white/[0.24] data-[state=checked]:bg-[var(--gold)] data-[state=checked]:border-[var(--gold)] data-[state=checked]:text-[#2A2005]"
              style={{ ["--gold" as any]: GOLD }}
            />
            <span style={{ color: checked ? GOLD_LIGHT : TEXT_LABEL, fontSize: 12.5 }}>{ind}</span>
          </label>
        );
      })}
    </div>
  );
}

function PillPrimary({
  onClick,
  icon,
  children,
  disabled,
}: {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[42px] rounded-full flex items-center justify-center gap-2 self-start"
      style={{ background: GOLD, color: DARK_ON_GOLD, fontSize: 13.5, fontWeight: 600, opacity: disabled ? 0.6 : 1 }}
    >
      {icon}
      {children}
    </button>
  );
}

function PillSecondary({
  onClick,
  icon,
  children,
  disabled,
}: {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[42px] rounded-full flex items-center justify-center gap-2 ${glass}`}
      style={{ color: TEXT_LABEL, fontSize: 13.5, fontWeight: 500, opacity: disabled ? 0.6 : 1 }}
    >
      {icon}
      {children}
    </button>
  );
}

export default Settings;
