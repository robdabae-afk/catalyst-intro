import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Inbox, CalendarDays, UserCircle2, LogOut } from "lucide-react";

interface MatchLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const navItems = [
  { to: "/match/discover", icon: Search, label: "Discover" },
  { to: "/match/inbox", icon: Inbox, label: "Inbox" },
  { to: "/match/event", icon: CalendarDays, label: "Event" },
  { to: "/match/profile", icon: UserCircle2, label: "Profile" },
];

export const MatchLayout = ({ children, showNav = true }: MatchLayoutProps) => {
  const location = useLocation();
  const isActive = (p: string) => location.pathname === p;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="glass-nav sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link to="/match" className="font-serif text-xl tracking-wide">
          Catalyst <span className="text-white/60">/ Match</span>
        </Link>
        {showNav && (
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                aria-label={label}
                title={label}
                className={`p-2 rounded-full transition ${
                  isActive(to)
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            ))}
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/match"; }}
              className="p-2 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};
