import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface MatchLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const MatchLayout = ({ children, showNav = true }: MatchLayoutProps) => {
  const location = useLocation();
  const isActive = (p: string) => location.pathname === p;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/match" className="font-serif text-xl tracking-wide">
          Catalyst <span className="text-white/60">/ Match</span>
        </Link>
        {showNav && (
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/match/discover" className={`px-3 py-1.5 rounded ${isActive("/match/discover") ? "bg-white/10" : "hover:bg-white/5"}`}>Discover</Link>
            <Link to="/match/inbox" className={`px-3 py-1.5 rounded ${isActive("/match/inbox") ? "bg-white/10" : "hover:bg-white/5"}`}>Inbox</Link>
            <Link to="/match/event" className={`px-3 py-1.5 rounded ${isActive("/match/event") ? "bg-white/10" : "hover:bg-white/5"}`}>Event</Link>
            <Link to="/match/profile" className={`px-3 py-1.5 rounded ${isActive("/match/profile") ? "bg-white/10" : "hover:bg-white/5"}`}>Profile</Link>
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/match"; }}>Sign out</Button>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};
