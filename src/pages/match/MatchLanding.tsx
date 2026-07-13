import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MatchLayout } from "@/match/MatchLayout";
import { Button } from "@/components/ui/button";
import { useMatchSession } from "@/match/useMatchSession";

export default function MatchLanding() {
  const navigate = useNavigate();
  const { userId, profile, loading } = useMatchSession();

  useEffect(() => {
    if (loading) return;
    if (userId && profile) navigate("/match/event", { replace: true });
  }, [userId, profile, loading, navigate]);

  return (
    <MatchLayout showNav={false}>
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-8">
        <h1 className="font-serif text-5xl">Live Event Matching</h1>
        <p className="text-white/70 text-lg">
          Connect founders and investors in real time at networking events and pitch nights.
          Investors discover startups in the room; founders get notified instantly when interest is expressed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
            <Link to="/match/auth?role=founder">I'm a Founder</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/match/auth?role=investor">I'm an Investor</Link>
          </Button>
        </div>
        <p className="text-sm text-white/50">
          Already have an account? <Link to="/match/auth" className="underline">Sign in</Link>
        </p>
      </div>
    </MatchLayout>
  );
}
