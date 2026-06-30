import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Newspaper, Pin, Inbox } from "lucide-react";

function isoWeekStart(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date.toISOString().slice(0, 10);
}

interface Submission {
  id: string;
  submitter_id: string;
  title: string;
  link: string | null;
  note: string | null;
  status: string;
  created_at: string;
}

interface PickRow {
  id: string;
  profile_id: string;
  role: string;
  position: number;
  profile_name?: string;
}

export function AdminFeedPanel() {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = isoWeekStart();

  // News form
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsLink, setNewsLink] = useState("");
  const [newsImage, setNewsImage] = useState("");
  const [savingNews, setSavingNews] = useState(false);

  // Submissions
  const [subs, setSubs] = useState<Submission[]>([]);

  // Picks
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [pickEmail, setPickEmail] = useState("");
  const [pickRole, setPickRole] = useState<"founder" | "investor">("investor");

  const loadAll = async () => {
    const [{ data: news }, { data: s }, { data: p }] = await Promise.all([
      supabase.from("home_news").select("*").eq("news_date", today).maybeSingle(),
      supabase
        .from("home_newsletter_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("home_hot_picks")
        .select("id, profile_id, role, position")
        .eq("week_start", weekStart)
        .order("position", { ascending: true }),
    ]);
    if (news) {
      setNewsTitle(news.title ?? "");
      setNewsBody(news.body ?? "");
      setNewsLink(news.link ?? "");
      setNewsImage(news.image_url ?? "");
    }
    setSubs((s ?? []) as Submission[]);

    const rows = (p ?? []) as PickRow[];
    if (rows.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", rows.map((r) => r.profile_id));
      const map = new Map((profs ?? []).map((x) => [x.id, x.name]));
      setPicks(rows.map((r) => ({ ...r, profile_name: map.get(r.profile_id) ?? r.profile_id })));
    } else {
      setPicks([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveNews = async () => {
    if (!newsTitle.trim()) {
      toast({ variant: "destructive", title: "Title required" });
      return;
    }
    setSavingNews(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("home_news")
      .upsert(
        {
          news_date: today,
          title: newsTitle.trim(),
          body: newsBody.trim() || null,
          link: newsLink.trim() || null,
          image_url: newsImage.trim() || null,
          created_by: user?.id,
        },
        { onConflict: "news_date" }
      );
    setSavingNews(false);
    if (error) {
      toast({ variant: "destructive", title: "Failed to save", description: error.message });
      return;
    }
    toast({ title: "News saved for today" });
  };

  const setSubStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("home_newsletter_submissions").update({ status }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      return;
    }
    loadAll();
  };

  const useAsNews = (s: Submission) => {
    setNewsTitle(s.title);
    setNewsBody(s.note ?? "");
    setNewsLink(s.link ?? "");
    setNewsImage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addPick = async () => {
    const email = pickEmail.trim().toLowerCase();
    if (!email) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, user_type")
      .eq("email", email)
      .maybeSingle();
    if (!prof) {
      toast({ variant: "destructive", title: "User not found" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("home_hot_picks").insert({
      week_start: weekStart,
      role: pickRole,
      profile_id: prof.id,
      position: picks.filter((p) => p.role === pickRole).length,
      created_by: user?.id,
    });
    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
      return;
    }
    setPickEmail("");
    loadAll();
  };

  const removePick = async (id: string) => {
    await supabase.from("home_hot_picks").delete().eq("id", id);
    loadAll();
  };

  return (
    <div className="space-y-6">
      {/* Today's News */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Today's news ({today})</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Title</Label>
            <Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Link</Label>
            <Input value={newsLink} onChange={(e) => setNewsLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Body</Label>
            <Textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Label>Image URL (optional)</Label>
            <Input value={newsImage} onChange={(e) => setNewsImage(e.target.value)} />
          </div>
        </div>
        <Button onClick={saveNews} disabled={savingNews}>
          {savingNews ? "Saving..." : "Save today's news"}
        </Button>
      </div>

      {/* Hot picks */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Hot picks — week of {weekStart}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={pickRole}
            onChange={(e) => setPickRole(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="investor">Investor</option>
            <option value="founder">Founder</option>
          </select>
          <Input
            placeholder="user@example.com"
            value={pickEmail}
            onChange={(e) => setPickEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={addPick}>Pin</Button>
        </div>
        {picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pins for this week.</p>
        ) : (
          <ul className="space-y-1">
            {picks.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  <Badge variant="outline" className="mr-2">{p.role}</Badge>
                  {p.profile_name}
                </span>
                <Button size="sm" variant="ghost" onClick={() => removePick(p.id)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submissions */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Newsletter submissions</h3>
        </div>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {subs.map((s) => (
              <li key={s.id} className="py-3 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.title}</span>
                      <Badge
                        variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "outline"}
                      >
                        {s.status}
                      </Badge>
                    </div>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                        {s.link}
                      </a>
                    )}
                    {s.note && <p className="text-xs text-muted-foreground mt-1">{s.note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => useAsNews(s)}>
                      Use as news
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSubStatus(s.id, "approved")}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSubStatus(s.id, "rejected")}>
                      <XCircle className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
