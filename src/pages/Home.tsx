import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNavigation } from "@/components/AppNavigation";
import { HotThisWeek } from "@/components/home/HotThisWeek";
import { EventsThisWeek } from "@/components/home/EventsThisWeek";
import { TodaysNews } from "@/components/home/TodaysNews";
import { NewsletterSubmitButton } from "@/components/home/NewsletterSubmitButton";
import { useHomeFeed } from "@/hooks/useHomeFeed";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"founder" | "investor" | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("name, avatar_url, user_type")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        setUserName(p.name ?? "");
        setAvatarUrl(p.avatar_url ?? "");
        setUserType((p.user_type as any) ?? null);
      }
    })();
  }, []);

  const { hotProfiles, events, news, loading } = useHomeFeed(userId, userType);
  const oppositeLabel = userType === "founder" ? "investors" : userType === "investor" ? "founders" : "members";

  return (
    <div className="min-h-screen ">
      <AppNavigation
        userId={userId ?? undefined}
        userType={userType}
        userName={userName}
        avatarUrl={avatarUrl}
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <header>
          <h1 className="text-2xl font-bold text-foreground">Home</h1>
          <p className="text-sm text-muted-foreground">What's happening in the community.</p>
        </header>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <>
            <HotThisWeek profiles={hotProfiles} oppositeLabel={oppositeLabel} />
            <EventsThisWeek events={events} />
            <TodaysNews news={news} />
            <NewsletterSubmitButton userId={userId} />
          </>
        )}
      </main>
    </div>
  );
}
